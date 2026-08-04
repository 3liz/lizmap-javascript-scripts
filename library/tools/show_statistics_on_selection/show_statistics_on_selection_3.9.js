/**
    * @license Mozilla Public License Version 2.0
    * This script has been developed by the "community"
    * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
    * @author Arnaud Vandecasteele
    *
    * Selection statistics - Lizmap Web Client 3.9
    *
    * Displays aggregated statistics about the selected features of the layers
    * declared in STATISTICS_CONFIG.
    *
    * SCRIPT LOGIC
    * STARTUP MINI DOCK OPENED : SelectionStatistics.init()
    *   => MAIN PARTS OF THE SCRIPT ON EVERY SELECTION CHANGE : SelectionStatistics.onSelectionChanged(event) CALL WFS Fetcher
    *   => ON A PRINT CLICK : onPrint(layerName)
    *   => ON PANEL CLOSE : SelectionStatistics.destroyPanel()
    *
    * Six classes. Only SelectionStatistics wires the Lizmap
    * events; only WfsFetcher and SelectionPrinter talk to the server; StatsPanel
    * touches the DOM and nothing else.
    *
    *   Aggregator           pure computation over a list of raw field values
    *   ValueFormatter       renders one aggregated value in the active locale
    *   WfsFetcher           QGIS Server access: field aliases, selected features
    *   StatsPanel           DOM rendering; knows neither network nor aggregates
    *   SelectionPrinter     builds and sends the GetPrint request
    *   SelectionStatistics  orchestration, and the only holder of lizMap events
    *
*/

(function () {
    'use strict';

    /* ============================================================
     * CONFIGURATION - adapt to your project
     * ============================================================ */

    /** Diagnostic traces in the console. Keep false in production. */
    const DEBUG_MODE = false;

    /**
     * Interface language.
     * 'auto' follows the Lizmap interface (<html lang>), then the browser.
     * Any BCP 47 tag forces one, e.g. 'fr-FR', 'en-GB', 'de-DE'.
     */
    const LOCALE = 'auto';

    /** Language used when the active one has no translation below. */
    const FALLBACK_LOCALE = 'en';

    /** ISO 4217 code for format.type === 'currency'. Overridable per field. */
    const CURRENCY = 'EUR';

    /** Panel title. null uses the translated one below. */
    const PANEL_TITLE = null;

    /** Above this count the module shows a message instead of computing. */
    const MAX_FEATURES = 5000;

    /**
     * Fetch the field aliases defined in the QGIS project.
     * Cost: one request per configured layer, at startup only.
     */
    const FETCH_QGIS_ALIASES = true;

    /**
     * How long to wait for the QGIS alias callback before giving up, in ms.
     * On timeout the config labels are used and startup carries on.
     */
    const ALIAS_TIMEOUT_MS = 10000;

    /**
     * How long to wait for the WFS feature request before giving up, in ms.
     * On timeout the layer block shows the error message instead of staying
     * frozen on the previous selection figures.
     */
    const REQUEST_TIMEOUT_MS = 30000;

    /**
     * How long to wait for the PDF, in ms. Deliberately generous: a layout with
     * several maps takes far longer to render than a feature query.
     */
    const PRINT_TIMEOUT_MS = 120000;

    /**
     * Print layout used by the print button, as named in the QGIS project.
     * null disables the feature entirely: no button, no validation, no request.
     */
    const PRINT_LAYOUT = null;

    /**
     * Layout label id receiving the title.
     * Avoid accents and spaces: it becomes an HTTP parameter name.
     */
    const PRINT_TITLE_LABEL_ID = 'stats_title';

    /**
     * Layout label id receiving the statistics.
     * Tick "render as HTML" on that label in QGIS for a proper two-column table.
     */
    const PRINT_CONTENT_LABEL_ID = 'stats_content';

    /**
     * DPI used to compute the scale denominator of the printed map. Lizmap uses it
     */
    const PRINT_DPI = 100;

    /**
       * Layers and fields to aggregate.
       *
       * Each layer key is the layer name as written in the QGIS layers panel.
       * A layer absent from the project, an unknown aggregate or an invalid
       * format is reported in the console at startup and skipped, never fatal.
       *
       *   'LayerName': {
       *       label:      'Shown above the block',        // optional, default: layer name
       *       printTitle: 'Shown on the printed sheet',   // optional, default: label
       *       fields: { ... }
       *   }
       *
       * FIELD SHAPES
       *
       *   'field': ['sum']                                 short form
       *   'field': { aggregates: ['sum'], label, format, list, frequency }
       *
       * The option sub-objects are named after the aggregate they configure:
       * `list: {...}` is read only when 'list' is requested, same for frequency.
       * Declaring one without its aggregate warns at startup.
       *
       * AGGREGATES  (rendered examples below are fr-FR; wording follows LOCALE)
       *
       *   count      how many features have this field filled in       -> 42
       *              To count selected features, use a never-null field
       *              such as the primary key: count on an empty field
       *              returns 0, which is correct but rarely what you want.
       *
       *   sum        total of the numeric values                       -> 12,43 ha
       *   average    mean of the numeric values                        -> 1 776 m²
       *   minimum    smallest numeric value                            -> 210 m²
       *   maximum    largest numeric value                             -> 4 100 m²
       *              Non-numeric values are discarded. If nothing is
       *              usable the cell shows a dash and warns once.
       *
       *   list       enumerates the values                             -> 2, 10, 100, 244
       *   distinct   how many different values                         -> 7
       *   frequency  each value with its count, one row each           -> Moyen  11
       *
       * LIST OPTIONS      list: { separator, maxItems, sort, distinct }
       *
       *   separator  between values                        default ', '
       *   maxItems   beyond it, appends "… et N autres"    default 50
       *   sort       'natural'  2, 10, 100   <- cadastral numbers arrive as
       *              'alpha'    10, 100, 2      strings, hence this default
       *              'none'     selection order
       *   distinct   deduplicate the list                  default true
       *
       *   Careful: `list.distinct` deduplicates, the `distinct` aggregate
       *   returns a count. Both may sit on the same field.
       *
       * FREQUENCY OPTIONS      frequency: { maxItems }
       *
       *   maxItems   beyond it, the tail is merged into one row   default 10
       *   Unfilled values are kept, always listed last, and never truncated
       *   away: their number is information, unlike in numeric aggregates.
       *
       * FORMAT      format: { type, unit, decimals, currency }
       *
       *   type 'number'    12 345,6            decimals: omitted -> 0 to 2
       *   type 'area'      unit 'm2'   124 310 m²    <- raw value, no conversion
       *                    unit 'ha'   12,43 ha      <- divides by 10 000
       *                    unit 'auto' switches to ha above 10 000 m²
       *   type 'currency'  185 000 €           currency: ISO code, default CURRENCY
       *
       *   With unit 'm2' the value is always rendered whole: `decimals` is
       *   ignored there, since an area in square metres is an integer.
       *
       *   The format applies to the field/aggregate pair, not the field alone:
       *   count, distinct and frequency yield head counts and always render as
       *   bare integers, even on a field declared as an area or a currency.
    ============ CONFIG EXAMPLE replace with your own layers and fields ============
    const STATISTICS_CONFIG = {
        layers: {
            'Parcelles': {
                label: 'Parcelles cadastrales',
                fields: {
                    'id_source': {
                        aggregates: ['count'],
                        label: 'Nombre de parcelles'
                    },
                    'numero': {
                        aggregates: ['list'],
                        label: 'Numéro',
                        list: { separator: ', ', maxItems: 50, sort: 'natural', distinct: true }
                    },
                    'contenance': {
                        aggregates: ['sum', 'minimum', 'maximum'],
                        label: 'Surface',
                        format: { type: 'area', decimals: 2 }
                    }
                }
            }
        }
    };
    */
   const STATISTICS_CONFIG = {
        layers: {
        }
    };

    /**
     * User-facing strings, keyed by language subtag.
     * To add a language, copy a block and translate the values.
     * Partial blocks are fine: missing keys fall back to FALLBACK_LOCALE.
     * {n} and {max} are substituted at display time.
     */
    const TRANSLATIONS = {
        fr: {
            panelTitle: 'Statistiques de la sélection',
            count: 'Nombre',
            sum: 'Somme',
            average: 'Moyenne',
            minimum: 'Minimum',
            maximum: 'Maximum',
            list: 'Liste',
            distinct: 'Valeurs distinctes',
            noValue: '-',
            emptyValue: '(non renseigné)',
            andNMore: '… et {n} autres',
            tooManyFeatures: 'Sélection trop volumineuse ({n} entités, maximum {max})',
            error: 'Impossible de calculer les statistiques',
            print: 'Imprimer',
            printError: 'Impossible de générer l\'impression'
        },
        en: {
            panelTitle: 'Selection statistics',
            count: 'Count',
            sum: 'Sum',
            average: 'Average',
            minimum: 'Minimum',
            maximum: 'Maximum',
            list: 'List',
            distinct: 'Distinct values',
            noValue: '-',
            emptyValue: '(not set)',
            andNMore: '… and {n} more',
            tooManyFeatures: 'Selection too large ({n} features, maximum {max})',
            error: 'Unable to compute statistics',
            print: 'Print',
            printError: 'Unable to generate the print'
        }
    };

    /* ============================================================
     * DO NOT MODIFY BELOW THIS LINE
     * ============================================================ */

    /** Supported aggregates. Used to validate STATISTICS_CONFIG. */
    const AGGREGATES = {
        count:     { labelKey: 'count' },
        sum:       { labelKey: 'sum' },
        average:   { labelKey: 'average' },
        minimum:   { labelKey: 'minimum' },
        maximum:   { labelKey: 'maximum' },
        distinct:  { labelKey: 'distinct' },
        list:      { labelKey: 'list',
                     defaults: { separator: ', ', maxItems: 50, sort: 'natural', distinct: true } },
        frequency: { defaults: { maxItems: 10 } }
    };

    /** Accepted values for format.type. */
    const KNOWN_FORMATS = ['number', 'area', 'currency'];

    /**
     * USED IN PRINT
     * Standardized rendering pixel size in metres, from the OGC WMS spec.
     * Dividing a view resolution by it yields the scale denominator of the
     * screen. Lizmap reaches the same value through a DPI constant.
     */
    const OGC_PIXEL_SIZE_M = 0.00028;

    /** BCP 47 tag. Drives both the strings and every Intl formatter. */
    const ACTIVE_LOCALE = (LOCALE && LOCALE !== 'auto')
        ? LOCALE
        : (document.documentElement.lang || navigator.language || FALLBACK_LOCALE);

    /**
     * Strings for the active language.
     * Lookup order: exact tag, then primary subtag, then FALLBACK_LOCALE.
     * Keys are merged over the fallback, so a partial translation still works.
     */
    const T = (function () {
        const fallback = TRANSLATIONS[FALLBACK_LOCALE] || {};
        const primary = ACTIVE_LOCALE.toLowerCase().split('-')[0];
        const strings = TRANSLATIONS[ACTIVE_LOCALE] || TRANSLATIONS[primary];

        if (!strings) {
            console.warn(
                `[stats] no translation for "${ACTIVE_LOCALE}", ` +
                `falling back to "${FALLBACK_LOCALE}"`
            );
        }

        // Always a fresh object, never the TRANSLATIONS entry itself.
        return Object.assign({}, fallback, strings || {});
    })();

    /** Natural sort: "2" before "10". Collation order follows the active locale. */
    const NATURAL_COLLATOR = new Intl.Collator(ACTIVE_LOCALE, { numeric: true, sensitivity: 'base' });

    /** Strict alphabetical sort, in the active locale's collation order. */
    const ALPHA_COLLATOR = new Intl.Collator(ACTIVE_LOCALE, { sensitivity: 'base' });

    /** Trace gated by DEBUG_MODE. */
    function debug(...args) {
        if (DEBUG_MODE) {
            console.log('[stats]', ...args);
        }
    }

    /**
       * Reduces a flat list of raw field values to one aggregated result.
       *
       * Numeric aggregates (count, sum, average, minimum, maximum) drop anything
       * that is not a finite number and return null rather than NaN or Infinity.
       * Textual ones (list, frequency, distinct) apply to any field type and
       * handle sorting, deduplication and truncation.
       *
       * No DOM, no network. Inspectable from the console via window.lizStats.
       */
    class Aggregator {
        /** layer|field|aggregate keys already reported, so we warn only once. */
        static #warned = new Set();

        /**
         * @param {string} layerName  layer name, used in messages
         * @param {string} fieldName  field name, used in messages
         * @param {string} aggregate  one of AGGREGATES
         * @param {Array}  values     raw values, one per selected feature
         * @param {Object} [options]  `list` or `frequency` options from the config
         * @returns {{kind: string, value?: *, rows?: Array}}
         */
        static compute(layerName, fieldName, aggregate, values, options) {
            switch (aggregate) {
                case 'count':
                    return { kind: 'count', value: Aggregator.#defined(values).length };

                case 'distinct':
                    return { kind: 'count', value: new Set(Aggregator.#defined(values)).size };

                case 'list':
                    return { kind: 'text', value: Aggregator.#list(values, options) };

                case 'frequency':
                    return { kind: 'rows', rows: Aggregator.#frequency(values, options) };

                default:
                    return {
                        kind: 'numeric',
                        value: Aggregator.#numeric(layerName, fieldName, aggregate, values)
                    };
            }
        }

        /**
         * The single definition of "not filled in". Every aggregate relies on it,
         * so count, distinct, list and frequency can never disagree on what an
         * empty value is.
         */
        static #isEmpty(value) {
            return value === null || value === undefined || value === '';
        }

        /** Filled values only. */
        static #defined(values) {
            return values.filter(v => !Aggregator.#isEmpty(v));
        }

        /**
         * Numeric aggregates. Discards anything not convertible to a finite number.
         * Returns null when nothing is usable: never NaN, never Infinity.
         */
        static #numeric(layerName, fieldName, aggregate, values) {
            const numbers = [];
            for (const value of Aggregator.#defined(values)) {
                // The comma swap handles decimal commas coming from the database,
                // which is a data quirk, not a locale concern.
                const n = typeof value === 'number'
                    ? value
                    : Number(String(value).replace(',', '.'));
                if (Number.isFinite(n)) {
                    numbers.push(n);
                }
            }

            if (numbers.length === 0) {
                Aggregator.#warnOnce(layerName, fieldName, aggregate);
                return null;
            }

            const total = numbers.reduce((a, b) => a + b, 0);

            switch (aggregate) {
                case 'sum':
                    return total;
                case 'average':
                    return total / numbers.length;
                case 'minimum':
                    return numbers.reduce((a, b) => (b < a ? b : a));
                case 'maximum':
                    return numbers.reduce((a, b) => (b > a ? b : a));
                default:
                    return null;
            }
        }

        /** Value enumeration, deduplicated and sorted by default. */
        static #list(values, options) {
            const o = Object.assign({}, AGGREGATES.list.defaults, options);

            let items = Aggregator.#defined(values).map(v => String(v));
            if (items.length === 0) {
                return null;
            }

            if (o.distinct) {
                items = [...new Set(items)];
            }
            if (o.sort === 'natural') {
                items.sort(NATURAL_COLLATOR.compare);
            } else if (o.sort === 'alpha') {
                items.sort(ALPHA_COLLATOR.compare);
            }

            let text = items.slice(0, o.maxItems).join(o.separator);
            if (items.length > o.maxItems) {
                text += o.separator + T.andNMore.replace('{n}', items.length - o.maxItems);
            }
            return text;
        }

        /**
         * Distribution: each distinct value with its number of occurrences,
         * sorted by descending count.
         */
        static #frequency(values, options) {
            const o = Object.assign({}, AGGREGATES.frequency.defaults, options);

            const counts = new Map();
            let emptyCount = 0;

            for (const value of values) {
                if (Aggregator.#isEmpty(value)) {
                    emptyCount++;
                    continue;
                }
                const key = String(value);
                counts.set(key, (counts.get(key) || 0) + 1);
            }

            const rows = [...counts.entries()]
                .map(([value, count]) => ({ value, count }))
                .sort((a, b) => (b.count - a.count) || NATURAL_COLLATOR.compare(a.value, b.value));

            let shown = rows;
            if (rows.length > o.maxItems) {
                shown = rows.slice(0, o.maxItems);
                const remaining = rows.slice(o.maxItems).reduce((total, r) => total + r.count, 0);
                shown.push({
                    value: T.andNMore.replace('{n}', rows.length - o.maxItems),
                    count: remaining
                });
            }

            // Unfilled values are a residual category, not a real one: always last,
            // never ranked among actual values, never dropped by truncation.
            if (emptyCount > 0) {
                shown.push({ value: T.emptyValue, count: emptyCount });
            }

            return shown;
        }

        /** One warning per layer/field/aggregate, so the console stays readable. */
        static #warnOnce(layerName, fieldName, aggregate) {
            const key = layerName + '|' + fieldName + '|' + aggregate;
            if (Aggregator.#warned.has(key)) {
                return;
            }
            Aggregator.#warned.add(key);
            console.warn(
                `[stats] no usable numeric value for "${aggregate}" ` +
                `on ${layerName}.${fieldName}: is this field really numeric?`
            );
        }
    }

    /**
       * Renders an aggregated result as a display string, in the active locale.
       *
       * Dispatches on the `kind` produced by Aggregator, never on the aggregate
       * name: a new aggregate needs no change here as long as it reports a known
       * kind. Head counts are always bare integers, whatever format the field
       * declares, since counting parcels yields neither hectares nor euros.
       *
       * Three formats are supported through the field config: plain `number`,
       * `area` in square metres or hectares, and `currency`. Everything goes
       * through Intl.NumberFormat, so separators, decimal marks and the position
       * of the currency symbol follow the language rather than being hardcoded.
       *
       * A null value renders as the localised dash: the class never emits NaN,
       * Infinity or an empty cell.
       *
       * Formatter instances are cached by their serialised options, since
       * building one is expensive and a single render asks for a handful of
       * distinct shapes.
       *
       * No DOM, no network.
       */
    class ValueFormatter {

        /** Cached Intl.NumberFormat instances, keyed by their options. */
        static #formatters = new Map();

        /**
         * @param {{kind: string, value?: *}} result  output of Aggregator.compute
         * @param {Object} [format]  { type, unit, decimals, currency } from the config
         * @returns {string}
         */
        static format(result, format) {
            switch (result.kind) {
                case 'count':
                    // A head count is always a bare integer: no unit, no currency.
                    return ValueFormatter.#numberFormat({ maximumFractionDigits: 0 })
                        .format(result.value);

                case 'text':
                    return result.value === null ? T.noValue : result.value;

                case 'numeric':
                    return ValueFormatter.#numeric(result.value, format);

                default:
                    return T.noValue;
            }
        }

        static #numberFormat(options) {
            const key = JSON.stringify(options);
            if (!ValueFormatter.#formatters.has(key)) {
                ValueFormatter.#formatters.set(key, new Intl.NumberFormat(ACTIVE_LOCALE, options));
            }
            return ValueFormatter.#formatters.get(key);
        }

        /** Undefined decimals means 0 to 2 fraction digits, depending on the value. */
        static #fractionOptions(decimals) {
            return decimals === undefined
                ? { minimumFractionDigits: 0, maximumFractionDigits: 2 }
                : { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
        }

        static #numeric(value, format) {
            if (value === null) {
                return T.noValue;
            }

            const f = Object.assign({ type: 'number', unit: 'm2' }, format);
            const fraction = ValueFormatter.#fractionOptions(f.decimals);

            switch (f.type) {
                case 'area': {
                    // m2 and ha are SI symbols: identical in every language.
                    const asHectares = f.unit === 'ha' || (f.unit === 'auto' && value > 10000);
                    return asHectares
                        ? ValueFormatter.#numberFormat(fraction).format(value / 10000) + ' ha'
                        : ValueFormatter.#numberFormat({ maximumFractionDigits: 0 })
                            .format(value) + ' m²';
                }

                case 'currency':
                    // style:'currency' places the symbol per locale, which a plain
                    // suffix cannot do: "185 000 €" in fr-FR, "€185,000" in en-US.
                    return ValueFormatter.#numberFormat(Object.assign(
                        { style: 'currency', currency: f.currency || CURRENCY },
                        fraction
                    )).format(value);

                default:
                    return ValueFormatter.#numberFormat(fraction).format(value);
            }
        }
    }

    /**
       * Data access. The only class that talks to QGIS Server, and the only one
       * that knows how a Lizmap layer name maps onto a WFS type name.
       *
       * Two jobs with deliberately opposite error policies. Loading field aliases
       * never throws: they are cosmetic, the config labels take over, and a
       * missing alias must not stop the module from starting. Fetching features
       * does throw: without them there are no statistics, and the caller has to
       * show that rather than leave stale figures on screen.
       *
       * Aliases are read once per layer at startup and cached; features are
       * fetched once per selection, filtered by FEATUREID and narrowed by
       * PROPERTYNAME to the configured fields alone.
       *
       * Both calls are bounded in time, by different means: the alias API is
       * callback-based and cannot be aborted, so a timer stops the wait, while
       * the feature request carries an AbortSignal that actually cancels it.
       *
       * Knows nothing about aggregation or rendering.
       */
    class WfsFetcher {

        constructor() {
            /** @type {Map<string, Object>} layer name -> { field: alias } */
            this._aliases = new Map();
        }

        /**
         * Cached aliases for a layer, or an empty object when none were loaded.
         * Synchronous: the rendering path must not await.
         *
         * @param {string} layerName
         * @returns {Object}
         */
        aliasesOf(layerName) {
            return this._aliases.get(layerName) || {};
        }

        /**
         * Field aliases defined in the QGIS project.
         * Called once per layer at startup, never during a selection.
         * Never throws: on failure the config labels take over.
         *
         * @param {string} layerName
         * @returns {Promise<Object>}
         */
        async loadAliases(layerName) {
            if (!FETCH_QGIS_ALIASES) {
                return {};
            }
            if (this._aliases.has(layerName)) {
                return this._aliases.get(layerName);
            }

            const aliases = await new Promise((resolve) => {
                // A callback API that never fires would leave init() awaiting
                // forever, so give up after a bounded wait. A promise settles
                // once: the timer and the callback can race freely, whichever
                // lands first wins and the other call is a no-op.
                const timer = setTimeout(() => {
                    debug('timed out while loading aliases of', layerName);
                    resolve({});
                }, ALIAS_TIMEOUT_MS);

                try {
                    lizMap.getFeatureData(
                        layerName, null, null, 'none', false, 0, 1,
                        (aName, aFilter, cFeatures, cAliases) => {
                            clearTimeout(timer);
                            resolve(cAliases || {});
                        }
                    );
                } catch (error) {
                    clearTimeout(timer);
                    debug('failed to load aliases of', layerName, error);
                    resolve({});
                }
            });

            debug('aliases of', layerName, aliases);
            this._aliases.set(layerName, aliases);
            return aliases;
        }

        /**
         * Selected features, filtered by FEATUREID and limited to the useful fields.
         * Throws on network failure or unusable response.
         *
         * @param {string}   layerName
         * @param {Array}    featureIds  identifiers taken from e.featureIds
         * @param {string[]} fieldNames  fields configured for this layer
         * @returns {Promise<Array>} GeoJSON features
         */
        async fetchFeatures(layerName, featureIds, fieldNames) {
            const request = lizMap.getVectorLayerWfsUrl(layerName, null, null, null, false);

            // WFS expects "typename.id", not "layerName.id". They often match,
            // but relying on that is exactly what broke the original script.
            const typename = lizMap.config.layers[layerName]?.typename || layerName;

            const options = Object.assign({}, request.options, {
                OUTPUTFORMAT: 'GeoJSON',
                GEOMETRYNAME: 'none',
                PROPERTYNAME: fieldNames.join(','),
                FEATUREID: featureIds.map(id => typename + '.' + id).join(',')
            });

            debug('WFS request', request.url, options);

            const response = await window.fetch(request.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(options),
                // Without this, a server that never answers leaves the panel
                // frozen on the previous figures, with no message at all.
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
            });

            if (!response.ok) {
                throw new Error(`WFS ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            if (!data || !Array.isArray(data.features)) {
                throw new Error('WFS response has no `features` array');
            }

            debug(data.features.length, 'features received for', layerName);
            return data.features;
        }
    }

    /**
     * Builds and sends the QGIS Server GetPrint request.
     *
     * The whole feature rests on one server-side mechanism: a layout label
     * carrying an id becomes a named parameter of the request. Lizmap uses it
     * for its own editable print fields; this class builds the request
     * directly instead of driving Lizmap's print panel through the DOM.
     *
     * validate() checks the layout, its two labels and its map against the
     * project once at startup, names what is available on failure, and hides
     * the dedicated layout from Lizmap's own print list. print() keeps the
     * screen scale, ships the visible layers and the selection token, and
     * serialises the on-screen block as HTML or aligned text depending on the
     * label's own "render as HTML" setting.
     *
     * Escapes every database value it puts into markup: the textContent
     * guarantee protecting the panel does not apply when producing a string.
     */
    class SelectionPrinter {

        constructor() {
            /** Layout descriptor from lizMap.mainLizmap.config.printTemplates. */
            this._template = null;
            /** Main map item of that layout: id, width and height in mm. */
            this._map = null;
            /** Whether the content label renders HTML, per its QGIS setting. */
            this._htmlLabel = false;
        }

        /**
         * Checks the print configuration against the Lizmap project.
         * Every failure names what is available, so a wrong id is diagnosed
         * from the console rather than by guesswork.
         *
         * @returns {boolean} true when printing can be offered
         */
        validate() {
            if (!PRINT_LAYOUT) {
                return false;   // Feature disabled: stay silent.
            }

            const templates = lizMap.mainLizmap?.config?.printTemplates || [];

            const template = templates.find(t => t.title === PRINT_LAYOUT);
            if (!template) {
                console.warn(
                    `[stats] print layout "${PRINT_LAYOUT}" not found, available: ` +
                    (templates.map(t => t.title).join(', ') || 'none')
                );
                return false;
            }

            const labels = template.labels || [];
            const ids = labels.map(l => l.id);
            for (const id of [PRINT_TITLE_LABEL_ID, PRINT_CONTENT_LABEL_ID]) {
                if (!ids.includes(id)) {
                    console.warn(
                        `[stats] label "${id}" not found in layout "${PRINT_LAYOUT}", available: ` +
                        (ids.join(', ') || 'none')
                    );
                    return false;
                }
            }

            const maps = template.maps || [];
            if (maps.length === 0) {
                console.warn(`[stats] layout "${PRINT_LAYOUT}" has no map item`);
                return false;
            }
            if (maps.length > 1) {
                console.warn(
                    `[stats] layout "${PRINT_LAYOUT}" has ${maps.length} maps, using "${maps[0].id}"`
                );
            }

            this._template = template;
            this._map = maps[0];

            const contentLabel = labels.find(l => l.id === PRINT_CONTENT_LABEL_ID);
            this._htmlLabel = Boolean(contentLabel && contentLabel.htmlState);

            debug('print ready:', PRINT_LAYOUT, '| map', this._map.id,
                '| html label', this._htmlLabel);

            this.#hideFromLizmapPrint(templates);
            return true;
        }

        /**
         * Removes the dedicated layout from Lizmap's own print panel, where it
         * would only confuse: it expects label values this module supplies.
         *
         * @param {Array} templates  print templates, already resolved by validate()
         */
        #hideFromLizmapPrint(templates) {
            const config = lizMap.mainLizmap.config;
            const index = templates.findIndex(t => t.title === PRINT_LAYOUT);
            const entry = config.layouts?.list?.[index];

            if (entry) {
                entry.enabled = false;
                debug('layout hidden from the Lizmap print panel');
            }

            // Catch-up: the dropdown may already have been rendered before we
            // got here. One-off cleanup, not a mechanism.
            const select = document.querySelector('#print-template');
            if (select) {
                const option = [...select.options]
                    .find(o => o.textContent.trim() === PRINT_LAYOUT);
                if (option) {
                    option.remove();
                }
            }
        }

        /**
         * @param {string} layerName  layer the statistics belong to
         * @param {Object} block      the block currently rendered in the panel
         * @param {string} title      title to print
         * @returns {Promise<void>} rejects on network failure or timeout
         */
        async print(layerName, block, title) {
            const view = lizMap.mainLizmap.map.getView();
            const mapId = this._map.id;
            const { crs, scale, extent } = this.#frame(view);

            const params = {
                SERVICE: 'WMS',
                REQUEST: 'GetPrint',
                VERSION: '1.3.0',
                FORMAT: 'pdf',
                TRANSPARENT: true,
                CRS: crs,
                DPI: PRINT_DPI,
                TEMPLATE: PRINT_LAYOUT,
                // Keeps the PDF text selectable rather than rasterised.
                FORMAT_OPTIONS: 'TEXT_RENDER_FORMAT:AlwaysText'
            };

            params[mapId + ':EXTENT'] = extent.join(',');
            params[mapId + ':SCALE'] = scale;
            params[PRINT_TITLE_LABEL_ID] = title;
            params[PRINT_CONTENT_LABEL_ID] = this.#serialise(block);

            const layers = SelectionPrinter.#visibleLayers();
            if (layers) {
                params[mapId + ':LAYERS'] = layers;
            }

            const token = SelectionPrinter.#selectionToken(layerName);
            if (token) {
                params.SELECTIONTOKEN = token;
            }

            debug('GetPrint', params);

            const response = await window.fetch(lizMap.mainLizmap.serviceURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(params),
                signal: AbortSignal.timeout(PRINT_TIMEOUT_MS)
            });

            if (!response.ok) {
                throw new Error(`GetPrint ${response.status} ${response.statusText}`);
            }

            // QGIS Server often reports failures as a 200 carrying an XML
            // ServiceExceptionReport. Downloading that as a .pdf hides the
            // error from everyone: check the content type first.
            const contentType = response.headers.get('Content-Type') || '';
            if (!contentType.includes('pdf')) {
                const excerpt = (await response.text()).slice(0, 300);
                throw new Error(
                    `GetPrint returned "${contentType || 'no content type'}" ` +
                    `instead of a PDF: ${excerpt}`
                );
            }

            SelectionPrinter.#download(await response.blob(), title);
        }

        /**
         * Scale and extent for the layout map.
         *
         * Assumes a metric projection, as Lizmap does for the same computation.
         */
        #frame(view) {
            const scale = Math.round(view.getResolution() / OGC_PIXEL_SIZE_M);

            const widthM = this._map.width / 1000;
            const heightM = this._map.height / 1000;

            const [cx, cy] = view.getCenter();
            const dx = widthM * scale / 2;
            const dy = heightM * scale / 2;
            let extent = [cx - dx, cy - dy, cx + dx, cy + dy];

            const options = lizMap.mainLizmap.config.options;
            const mapCrs = options.projection.ref;
            const projectCrs = options.qgisProjectProjection?.ref || mapCrs;

            if (projectCrs !== mapCrs) {
                const transform = lizMap.ol?.proj?.transformExtent;
                if (transform) {
                    extent = transform(extent, mapCrs, projectCrs);
                } else {
                    // Better a warning than a PDF silently framed on the wrong spot.
                    console.warn('[stats] cannot reproject the print extent, frame may be wrong');
                }
            }

            return { crs: projectCrs, scale, extent };
        }

        /** Visible layers, in draw order. Null falls back to the layout's own. */
        static #visibleLayers() {
            const names = [];

            // Base maps live outside rootMapGroup, so Lizmap reads them from a
            // separate place. First in the list means drawn underneath.
            try {
                const base = lizMap.mainLizmap.state.baseLayers.selectedBaseLayer;
                if (base && base.hasItemState && base.itemState.wmsName) {
                    names.push(base.itemState.wmsName);
                }
            } catch (error) {
                debug('base map unavailable, printing without it', error);
            }

            // Guarded separately: losing the base map should not cost the
            // overlays, nor the reverse. If both fail the print still works,
            // with the layers saved in the layout.
            try {
                names.push(...lizMap.mainLizmap.state.rootMapGroup.findExplodedMapLayers()
                    .filter(layer => layer.visibility)
                    .sort((a, b) => b.layerOrder - a.layerOrder)
                    .map(layer => layer.wmsParameters.LAYERS)
                    .filter(Boolean));
            } catch (error) {
                debug('layer enumeration unavailable, printing the layout layers', error);
            }

            return names.length ? names.join(',') : null;
        }

        /** Makes the selection appear highlighted on the printed map. */
        static #selectionToken(layerName) {
            return lizMap.config.layers[layerName]?.request_params?.selectiontoken ?? null;
        }

        #serialise(block) {
            return this._htmlLabel
                ? SelectionPrinter.#toHtml(block)
                : SelectionPrinter.#toText(block);
        }

        /**
         * QGIS parses this string as markup, so field values coming from the
         * database must be escaped here. The textContent guarantee that protects
         * the panel does not apply when producing a string.
         */
        static #escape(value) {
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        static #toHtml(block) {
            const escape = SelectionPrinter.#escape;
            let html = '<table>';

            for (const entry of block.entries || []) {
                html += `<tr><th colspan="2">${escape(entry.label)}</th></tr>`;
                for (const row of entry.rows) {
                    html += `<tr><td>${escape(row.left)}</td>`
                        + `<td align="right">${escape(row.right)}</td></tr>`;
                }
            }

            return html + '</table>';
        }

        static #toText(block) {
            const entries = block.entries || [];

            let width = 0;
            for (const entry of entries) {
                for (const row of entry.rows) {
                    width = Math.max(width, row.left.length);
                }
            }

            const lines = [];
            for (const entry of entries) {
                lines.push(entry.label);
                for (const row of entry.rows) {
                    lines.push('  ' + row.left.padEnd(width + 2) + row.right);
                }
                lines.push('');
            }

            return lines.join('\n').trimEnd();
        }

        static #download(blob, title) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = SelectionPrinter.#filename(title);
            link.click();
            URL.revokeObjectURL(url);
        }

        /** Strips accents, path separators and control characters. */
        static #filename(title) {
            const date = new Date().toISOString().slice(0, 10);
            const base = String(title)
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .toLowerCase()
                .slice(0, 80);
            return `${base || 'selection'}-${date}.pdf`;
        }
    }

    /**
     * DOM rendering.
     */
    class StatsPanel {

        constructor() {
            /** Container holding the per-layer blocks. */
            this._root = null;
            /** @type {Map<string, HTMLElement>} layer name -> block element */
            this._blocks = new Map();
            /** @type {Map<string, Object>} layer name -> last rendered block */
            this._rendered = new Map();
            /**
             * Set by the orchestrator when printing is available. The panel
             * triggers it and never learns what it does.
             * @type {?function(string): Promise<void>}
             */
            this.onPrint = null;
        }

        /** The block currently displayed for a layer, or undefined. */
        blockOf(layerName) {
            return this._rendered.get(layerName);
        }

        create() {
            // Anchored on the tab pane, not inside <lizmap-selection-tool>: that
            // component is Lit-rendered and rebuilds its template whenever the
            // selection count changes, which would silently drop our node.
            const container = document.querySelector('#selectiontool');
            if (!container) {
                console.error('[stats] selection panel not found, panel not created');
                return;
            }

            const root = document.createElement('div');
            root.id = 'lizmap-selection-statistics';
            root.hidden = true;

            const title = document.createElement('div');
            title.className = 'lizmap-stats-title';
            title.textContent = PANEL_TITLE || T.panelTitle;
            root.appendChild(title);

            container.appendChild(root);
            this._root = root;
            debug('panel created');
        }

        /**
         * @param {string} layerName
         * @param {{label: string, entries?: Array, message?: string}} block
         */
        renderLayer(layerName, block) {
            // The host panel may have been re-rendered, taking our node with it.
            if (!this._root || !this._root.isConnected) {
                this._blocks.clear();
                this._root = null;
                this.create();
            }
            if (!this._root) {
                return;
            }

            this._rendered.set(layerName, block);

            const element = this.#blockElement(layerName);
            element.replaceChildren();

            const heading = document.createElement('div');
            heading.className = 'lizmap-stats-heading';

            const label = document.createElement('b');
            label.textContent = block.label;
            heading.appendChild(label);

            // Nothing to print when the block only carries a message.
            if (this.onPrint && block.entries) {
                heading.appendChild(this.#printButton(layerName));
            }

            element.appendChild(heading);

            // entries and message can coexist: a failed print keeps the figures
            // on screen and adds the reason underneath.
            if (block.entries) {
                element.appendChild(StatsPanel.#table(block.entries));
            }
            if (block.message) {
                const message = document.createElement('p');
                message.className = 'lizmap-stats-message';
                message.textContent = block.message;
                element.appendChild(message);
            }

            element.hidden = false;
            this.#updateVisibility();
        }

        clearLayer(layerName) {
            this._rendered.delete(layerName);

            const element = this._blocks.get(layerName);
            if (!element) {
                return;
            }
            element.replaceChildren();
            element.hidden = true;
            this.#updateVisibility();
        }

        destroy() {
            if (this._root) {
                this._root.remove();
            }
            this._blocks.clear();
            this._rendered.clear();
            this._root = null;
        }

        /** Print control, styled like the neighbouring Lizmap selection buttons. */
        #printButton(layerName) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-mini lizmap-stats-print';
            button.title = T.print;

            const icon = document.createElement('i');
            icon.className = 'icon-print';
            button.appendChild(icon);

            button.addEventListener('click', async () => {
                button.disabled = true;
                try {
                    await this.onPrint(layerName);
                } finally {
                    button.disabled = false;
                }
            });

            return button;
        }

        /** Creates the layer block on first use, then reuses it. */
        #blockElement(layerName) {
            let element = this._blocks.get(layerName);
            if (!element) {
                element = document.createElement('div');
                element.className = 'lizmap-stats-block';
                element.dataset.layer = layerName;
                this._root.appendChild(element);
                this._blocks.set(layerName, element);
            }
            return element;
        }

        /**
         * Shows the panel while at least one block has content, and removes it
         * from the DOM entirely once none has.
         */
        #updateVisibility() {
            if (!this._root) {
                return;
            }

            const anyVisible = [...this._blocks.values()].some(el => !el.hidden);
            if (anyVisible) {
                this._root.hidden = false;
            } else {
                this.destroy();
            }
        }

        /**
         * One entry renders as a header row (field label) followed by its
         * { left, right } rows. No HTML string anywhere: nodes and textContent only,
         * so escaping is guaranteed by construction rather than by discipline.
         */
        static #table(entries) {
            const table = document.createElement('table');
            table.className = 'table table-condensed lizmap-selection-statistics-table';

            const tbody = document.createElement('tbody');

            for (const entry of entries) {
                const headRow = document.createElement('tr');
                const th = document.createElement('th');
                th.colSpan = 2;
                th.textContent = entry.label;
                headRow.appendChild(th);
                tbody.appendChild(headRow);

                for (const row of entry.rows) {
                    const tr = document.createElement('tr');

                    const left = document.createElement('td');
                    left.textContent = row.left;

                    const right = document.createElement('td');
                    right.className = 'lizmap-stats-value';
                    right.textContent = row.right;

                    tr.append(left, right);
                    tbody.appendChild(tr);
                }
            }

            table.appendChild(tbody);
            return table;
        }
    }

    /**
     * Orchestration. Reads the global `lizMap` for the layer configuration and
     * the selection tokens; WfsFetcher owns the rest of the Lizmap surface.
     */
    class SelectionStatistics {

        constructor() {
            this._panel = new StatsPanel();
            this._fetcher = new WfsFetcher();
            this._printer = new SelectionPrinter();
            /** @type {Map<string, {label: string, printTitle: string, fields: Map}>} */
            this._layers = new Map();
        }

        async init() {
            this.#normalizeConfig();

            if (this._layers.size === 0) {
                console.warn('[stats] no usable layer in STATISTICS_CONFIG, module inactive');
                return;
            }

            // Wiring the callback is what makes the button appear at all.
            let printReady = false;
            try {
                printReady = this._printer.validate();
            } catch (error) {
                console.error('[stats] print validation failed, printing disabled', error);
            }
            if (printReady) {
                this._panel.onPrint = layerName => this.#print(layerName);
            }

            // Synchronous so far: the index and the panel exist before any await,
            // which means an early selection is still handled correctly.
            this._panel.create();

            // The alias requests are independent: one round trip instead of N.
            await Promise.all(
                [...this._layers.keys()].map(layerName => this._fetcher.loadAliases(layerName))
            );

            debug('initialised for', [...this._layers.keys()]);
        }

        /**
         * Prints one layer block. The panel holds what is on screen, so the PDF
         * cannot diverge from it.
         */
        async #print(layerName) {
            const block = this._panel.blockOf(layerName);
            const layerConf = this._layers.get(layerName);

            // The selection may have been cleared between the click and here.
            if (!block || !block.entries || !layerConf) {
                return;
            }

            try {
                await this._printer.print(layerName, block, layerConf.printTitle);
            } catch (error) {
                console.error('[stats] print failed for', layerName, error);
                // Keep the figures, add the reason underneath.
                this._panel.renderLayer(layerName, Object.assign({}, block, {
                    message: T.printError
                }));
            }
        }

        /**
         * Removes the panel from the DOM. The instance survives, so the validated
         * config and the cached aliases are kept: the next selection rebuilds the
         * panel without any extra request.
         */
        destroyPanel() {
            this._panel.destroy();
        }

        /**
         * @param {{featureType: string, featureIds: Array}} event
         */
        async onSelectionChanged(event) {
            // `featureType` carries the Lizmap layer name, not the WFS typename.
            // The two differ as soon as QGIS Server disambiguates a name, and
            // confusing them is what silently broke the original script.
            const layerName = this._layers.has(event.featureType) ? event.featureType : null;

            if (!layerName) {
                // Layer not configured. This is the guard the original script lost
                // when its OpenLayers 2 check was commented out.
                return;
            }

            const layerConf = this._layers.get(layerName);
            const featureIds = event.featureIds || [];

            if (featureIds.length === 0) {
                this._panel.clearLayer(layerName);
                return;
            }

            if (featureIds.length > MAX_FEATURES) {
                this._panel.renderLayer(layerName, {
                    label: layerConf.label,
                    message: T.tooManyFeatures
                        .replace('{n}', featureIds.length)
                        .replace('{max}', MAX_FEATURES)
                });
                return;
            }

            try {
                const fieldNames = [...layerConf.fields.keys()];
                const features = await this._fetcher.fetchFeatures(layerName, featureIds, fieldNames);
                this._panel.renderLayer(layerName, this.#buildBlock(layerName, layerConf, features));
            } catch (error) {
                console.error('[stats] computation failed for', layerName, error);
                this._panel.renderLayer(layerName, {
                    label: layerConf.label,
                    message: T.error
                });
            }
        }

        /**
         * Validates and normalises STATISTICS_CONFIG.
         * Every faulty entry is reported then skipped, without blocking the rest.
         */
        #normalizeConfig() {
            const configured = (STATISTICS_CONFIG && STATISTICS_CONFIG.layers) || {};

            for (const [layerName, rawLayer] of Object.entries(configured)) {
                const lizmapLayer = lizMap.config.layers[layerName];
                if (!lizmapLayer) {
                    console.warn(`[stats] layer "${layerName}" is not in the Lizmap project, skipped`);
                    continue;
                }

                const fields = new Map();

                for (const [fieldName, rawField] of Object.entries(rawLayer.fields || {})) {
                    // Short form ['sum'] becomes the long form { aggregates: ['sum'] },
                    // so the rest of the code only ever sees one shape.
                    const def = Array.isArray(rawField)
                        ? { aggregates: rawField }
                        : Object.assign({}, rawField);

                    const aggregates = (def.aggregates || []).filter((name) => {
                        if (Object.keys(AGGREGATES).includes(name)) {
                            return true;
                        }
                        console.warn(`[stats] unknown aggregate "${name}" on ${layerName}.${fieldName}, skipped`);
                        return false;
                    });

                    if (aggregates.length === 0) {
                        console.warn(`[stats] no valid aggregate on ${layerName}.${fieldName}, field skipped`);
                        continue;
                    }

                    if (def.format && !KNOWN_FORMATS.includes(def.format.type)) {
                        console.warn(
                            `[stats] invalid format.type "${def.format.type}" on ` +
                            `${layerName}.${fieldName}, default formatting applied`
                        );
                        delete def.format;
                    }

                    for (const optionName of Object.keys(AGGREGATES).filter(a => AGGREGATES[a].defaults)) {
                        if (def[optionName] && !aggregates.includes(optionName)) {
                            console.warn(
                                `[stats] "${optionName}" options declared on ${layerName}.${fieldName} ` +
                                `without the matching aggregate, no effect`
                            );
                        }
                    }
                    for (const name of aggregates) {
                        const key = AGGREGATES[name].labelKey;
                        if (key && !(key in T)) {
                            console.warn(`[stats] no translation for aggregate "${name}", it will render as undefined`);
                        }
                    }

                    fields.set(fieldName, {
                        aggregates: aggregates,
                        label: def.label,
                        format: def.format,
                        list: def.list,
                        frequency: def.frequency
                    });
                }

                if (fields.size === 0) {
                    console.warn(`[stats] layer "${layerName}" has no usable field, skipped`);
                    continue;
                }

                this._layers.set(layerName, {
                    label: rawLayer.label || layerName,
                    // Cascading fallback: a project unaware of the print feature
                    // still gets a sensible title.
                    printTitle: rawLayer.printTitle || rawLayer.label || layerName,
                    fields: fields
                });
            }
        }

        /** Turns the received features into a `block` consumable by StatsPanel. */
        #buildBlock(layerName, layerConf, features) {
            const aliases = this._fetcher.aliasesOf(layerName);
            const entries = [];

            for (const [fieldName, fieldConf] of layerConf.fields) {
                const values = features.map(feature => feature.properties?.[fieldName] ?? null);

                // Label resolution: config, then non-empty QGIS alias, then field name.
                const label = fieldConf.label || aliases[fieldName] || fieldName;

                const rows = [];

                // Aggregates are rendered in the order written in the config.
                for (const aggregate of fieldConf.aggregates) {
                    // Option sub-objects are keyed by their aggregate name,
                    // so a lookup replaces the per-aggregate branch.
                    const options = fieldConf[aggregate];

                    const result = Aggregator.compute(layerName, fieldName, aggregate, values, options);

                    if (result.kind === 'rows') {
                        // frequency is the only multi-row aggregate.
                        for (const row of result.rows) {
                            rows.push({
                                left: row.value,
                                right: ValueFormatter.format({ kind: 'count', value: row.count })
                            });
                        }
                    } else {
                        rows.push({
                            left: T[AGGREGATES[aggregate].labelKey],
                            right: ValueFormatter.format(result, fieldConf.format)
                        });
                    }
                }

                if (rows.length > 0) {
                    entries.push({ label: label, rows: rows });
                }
            }

            return { label: layerConf.label, entries: entries };
        }
    }

    /* ============================================================
     * INIT
     * ============================================================ */

    let selectionStatistics = null;

    lizMap.events.on({

        'minidockopened': function (e) {
            if(e.id === "selectiontool" && !selectionStatistics){
                selectionStatistics = new SelectionStatistics();
                selectionStatistics.init();
            }
        },

        'minidockclosed': function (e) {
            if (e.id === "selectiontool" && selectionStatistics) {
                selectionStatistics.destroyPanel();
            }
        },

        'layerSelectionChanged': function (event) {
            if (selectionStatistics) {
                selectionStatistics.onSelectionChanged(event);
            }
        }
    });

    /** Exposed for console diagnostics. */
    window.lizStats = {
        Aggregator: Aggregator,
        ValueFormatter: ValueFormatter,
        WfsFetcher: WfsFetcher,
        StatsPanel: StatsPanel,
        instance: () => selectionStatistics
    };
})();
