/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 *
 * Legend layer filter
 *
 * Adds a search field above the legend, with a label and a button to clear the filter.
 * Shows the layers whose title contains the typed text, and the groups containing them.
 * If the text matches a group name, the whole content of the group is shown.
 *
 * Tested with Lizmap Web Client 3.9.12.
 */
(function () {
    'use strict';

    // ---- Texts, translate them if needed ----
    var LABEL_TEXT = 'Type to filter layers';
    var PLACEHOLDER_TEXT = 'Search';
    var CLEAR_TEXT = 'Clear filter';

    // ---- Styles, colors from the Lizmap theme variables ----
    var style = document.createElement('style');
    style.textContent = `
        #layer-filter-bar {
            display: flex;
            flex-wrap: wrap;
            align-items: flex-end;
            gap: 4px 12px;
            margin: 8px 0 12px 5px;
        }
        #layer-filter-bar .layer-filter-label {
            flex: 0 0 100%;
            margin: 0;
            font-size: 15px;
            font-weight: 600;
            line-height: 1.3;
            color: var(--color-text-primary, #333);
        }
        #layer-filter-bar #layer-filter-input {
            flex: 1 1 auto;
            min-width: 0;
            height: 40px;
            box-sizing: border-box;
            margin: 0;
            padding: 8px 4px;
            border: 0;
            border-bottom: 1px solid #5d7083;
            border-radius: 0;
            background: transparent;
            box-shadow: none;
            font-size: 16px;
            color: var(--color-text-primary, #333);
        }
        #layer-filter-bar #layer-filter-input::placeholder {
            color: #5d7083;
            opacity: 1;
        }
        #layer-filter-bar #layer-filter-input:hover {
            border-bottom-color: var(--color-text-primary, #333);
        }
        #layer-filter-bar #layer-filter-input:focus {
            border-bottom: 2px solid var(--color-contrasted-elements, #43718c);
            outline: 2px solid #f90;
            outline-offset: 0;
            box-shadow: none;
        }
        #layer-filter-bar .layer-filter-clear {
            flex: 0 0 auto;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            margin: 0;
            padding: 0;
            border: 0;
            border-radius: 4px;
            background: var(--color-contrasted-elements, #43718c);
            color: var(--color-contrasted-text, #fff);
            cursor: pointer;
        }
        #layer-filter-bar .layer-filter-clear svg {
            width: 24px;
            height: 24px;
            fill: currentColor;
        }
        #layer-filter-bar .layer-filter-clear:hover {
            filter: brightness(0.85);
        }
        #layer-filter-bar .layer-filter-clear:focus-visible {
            outline: 2px solid #f90;
            outline-offset: 2px;
        }
    `;
    document.head.appendChild(style);

    var currentFilter = '';
    var applying = false;

    // Title of the node itself (not of its children)
    function ownTitle(li) {
        var label = li.querySelector(':scope > div .node > label');
        return label ? label.textContent.toLowerCase() : '';
    }

    // Returns true if the node (or something inside it) matches
    function filterNode(li, text, parentMatches) {
        var selfMatches = parentMatches || ownTitle(li).includes(text);
        var childMatches = false;
        var ul = li.querySelector(':scope > ul');
        if (ul) {
            ul.querySelectorAll(':scope > li[data-testid]').forEach(function (child) {
                if (filterNode(child, text, selfMatches)) {
                    childMatches = true;
                }
            });
        }
        var visible = selfMatches || childMatches;
        li.style.display = visible ? '' : 'none';
        return visible;
    }

    function applyFilter() {
        var tree = document.querySelector('lizmap-treeview');
        if (!tree) {
            return;
        }
        applying = true;
        try {
            var roots = tree.querySelectorAll(':scope > ul > li[data-testid]');
            roots.forEach(function (li) {
                if (currentFilter === '') {
                    // No filter: show everything
                    li.style.display = '';
                    li.querySelectorAll('li[data-testid]').forEach(function (el) {
                        el.style.display = '';
                    });
                } else {
                    filterNode(li, currentFilter, false);
                }
            });
        } finally {
            applying = false;
        }
    }

    function init() {
        var container = document.getElementById('switcher-layers-container');
        var tree = document.querySelector('lizmap-treeview');
        if (!container || !tree || document.getElementById('layer-filter-bar')) {
            return;
        }

        var bar = document.createElement('div');
        bar.id = 'layer-filter-bar';

        var label = document.createElement('label');
        label.className = 'layer-filter-label';
        label.htmlFor = 'layer-filter-input';
        label.textContent = LABEL_TEXT;

        var filterInput = document.createElement('input');
        filterInput.type = 'text';
        filterInput.id = 'layer-filter-input';
        filterInput.placeholder = PLACEHOLDER_TEXT;
        filterInput.autocomplete = 'off';
        filterInput.addEventListener('input', function () {
            currentFilter = this.value.trim().toLowerCase();
            applyFilter();
        });

        var clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.className = 'layer-filter-clear';
        clearButton.title = CLEAR_TEXT;
        clearButton.setAttribute('aria-label', CLEAR_TEXT);
        // Inline "close" icon (no external file)
        clearButton.innerHTML =
            '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
            '<path d="m12.7 12 3.7 3.6-.8.8-3.6-3.7-3.6 3.7-.8-.8 3.7-3.6-3.7-3.6.8-.8 3.6 3.7 3.6-3.7.8.8-3.7 3.6z"/>' +
            '</svg>';
        clearButton.addEventListener('click', function () {
            filterInput.value = '';
            currentFilter = '';
            applyFilter();
            filterInput.focus();
        });

        bar.appendChild(label);
        bar.appendChild(filterInput);
        bar.appendChild(clearButton);

        // Insert the bar above the legend
        var menuContent = container.querySelector('.menu-content');
        container.insertBefore(bar, menuContent || container.firstChild);

        // The legend is redrawn by Lizmap (expand/collapse groups, etc.):
        // apply the filter again when it changes
        new MutationObserver(function () {
            if (!applying && currentFilter !== '') {
                applyFilter();
            }
        }).observe(tree, { childList: true, subtree: true });
    }

    lizMap.events.on({
        uicreated: function () {
            try {
                init();
            } catch (e) {
                // An error here must not break the map loading
                console.error('Legend layer filter:', e);
            }
        }
    });
})();
