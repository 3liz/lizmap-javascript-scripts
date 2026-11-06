/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 *
 * Attribute table column resize (DataTables)
 *
 * - Drag the right border of a header to change the column width
 * - Double click on the handle: restore the original widths of the table
 * - Widths are saved in the browser (localStorage) per repository/project/table
 * - Truncated texts show the full content on mouse hover
 *
 * Tested with Lizmap Web Client 3.9.12 (DataTables 1.10, global jQuery).
 */
(function () {
    'use strict';

    if (typeof window.jQuery === 'undefined') {
        return;
    }
    var $ = window.jQuery;

    var MIN_WIDTH = 40;          // minimum width of a column (px)
    var FALLBACK_WIDTH = 100;    // used if a column cannot be measured (hidden table)
    var STORAGE_PREFIX = 'lzrc';

    // ---------------------------------------------------------------------
    // Project key (repository:project) read from #lizmap-vars
    // ---------------------------------------------------------------------
    var PROJECT_KEY = (function () {
        try {
            var el = document.getElementById('lizmap-vars');
            var p = JSON.parse(el.textContent).lizUrls.params;
            return p.repository + ':' + p.project;
        } catch (e) {
            return window.location.pathname;
        }
    })();

    // ---------------------------------------------------------------------
    // CSS
    // ---------------------------------------------------------------------
    function injectCss() {
        if (document.getElementById('lzrc-style')) {
            return;
        }
        var css = [
            '.dataTables_wrapper th.lzrc-th { position: relative; }',
            '.lzrc-handle { position: absolute; top: 0; right: 0; width: 8px; height: 100%;',
            '  cursor: col-resize; z-index: 5; touch-action: none; user-select: none; }',
            '.lzrc-handle::after { content: ""; position: absolute; right: 2px; top: 20%; height: 60%;',
            '  border-right: 2px solid transparent; transition: border-color .15s; }',
            '.lzrc-th:hover .lzrc-handle::after { border-right-color: rgba(0,0,0,.18); }',
            '.lzrc-handle:hover::after, body.lzrc-dragging .lzrc-handle.lzrc-active::after {',
            '  border-right-color: #0066cc; }',
            'body.lzrc-dragging, body.lzrc-dragging * { cursor: col-resize !important;',
            '  user-select: none !important; }',
            'table.lzrc-fixed { table-layout: fixed; max-width: none !important; }',
            'table.lzrc-fixed > thead > tr > th, table.lzrc-fixed > tbody > tr > td {',
            '  box-sizing: border-box; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }'
        ].join('\n');
        var style = document.createElement('style');
        style.id = 'lzrc-style';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ---------------------------------------------------------------------
    // Table structure (with or without scrollX/scrollY)
    // ---------------------------------------------------------------------
    function getParts(wrapper) {
        var $w = $(wrapper);
        var $bodyTable = $w.find('.dataTables_scrollBody table').first();
        var $headTable = $w.find('.dataTables_scrollHead table').first();
        if (!$bodyTable.length) {
            $bodyTable = $w.find('table.dataTable').first();
        }
        if (!$headTable.length) {
            $headTable = $bodyTable;
        }
        return {
            wrapper: wrapper,
            $headTable: $headTable,
            $bodyTable: $bodyTable,
            $headInner: $w.find('.dataTables_scrollHeadInner').first(),
            $headCells: $headTable.children('thead').children('tr').first().children('th'),
            split: $headTable[0] !== $bodyTable[0]
        };
    }

    // Cells setting the width in the body (DataTables sizing row)
    function getSizingCells(p) {
        if (!p.split) {
            return $();
        }
        var $cells = p.$bodyTable.children('thead').children('tr').first().children();
        if (!$cells.length) {
            $cells = p.$bodyTable.children('tbody').children('tr').first().children('td');
        }
        return $cells;
    }

    function columnKey(th, i) {
        var txt = $(th).text().replace(/\s+/g, ' ').trim();
        return txt ? txt : ('#' + i);
    }

    function setCellWidth(el, w) {
        el.style.width = w + 'px';
        el.style.minWidth = w + 'px';
        el.style.maxWidth = w + 'px';
    }

    function clearCellWidth(el) {
        el.style.width = '';
        el.style.minWidth = '';
        el.style.maxWidth = '';
    }

    function measureWidths(p) {
        return p.$headCells.map(function () {
            var w = Math.round(this.getBoundingClientRect().width);
            return w > 0 ? w : FALLBACK_WIDTH;
        }).get();
    }

    function applyWidths(p, widths) {
        var $sizing = getSizingCells(p);
        var total = 0;
        p.$headCells.each(function (i) {
            var w = widths[i];
            setCellWidth(this, w);
            if ($sizing[i]) {
                setCellWidth($sizing[i], w);
            }
            total += w;
        });
        var tables = p.split ? [p.$headTable, p.$bodyTable] : [p.$headTable];
        $.each(tables, function (_, $t) {
            $t.addClass('lzrc-fixed').css({ width: total + 'px', minWidth: total + 'px' });
        });
        if (p.$headInner.length) {
            p.$headInner.css('width', total + 'px');
        }
    }

    // ---------------------------------------------------------------------
    // Persistence
    // ---------------------------------------------------------------------
    function storageKey(p) {
        var id = p.$bodyTable.attr('id') || p.$headTable.attr('id');
        return id ? STORAGE_PREFIX + ':' + PROJECT_KEY + ':' + id : null;
    }

    function loadSaved(p) {
        var key = storageKey(p);
        if (!key) {
            return p.wrapper._lzrcWidths || null;
        }
        try {
            return JSON.parse(window.localStorage.getItem(key));
        } catch (e) {
            return null;
        }
    }

    function save(p, widths) {
        var obj = {};
        p.$headCells.each(function (i) {
            obj[columnKey(this, i)] = widths[i];
        });
        p.wrapper._lzrcWidths = obj;
        var key = storageKey(p);
        if (key) {
            try {
                window.localStorage.setItem(key, JSON.stringify(obj));
            } catch (e) { /* storage not available */ }
        }
    }

    function forget(p) {
        p.wrapper._lzrcWidths = null;
        var key = storageKey(p);
        if (key) {
            try {
                window.localStorage.removeItem(key);
            } catch (e) { /* ignore */ }
        }
    }

    // Apply the saved widths again (after DataTables draw / adjust)
    function restore(p) {
        var saved = loadSaved(p);
        if (!saved) {
            return;
        }
        var current = null;
        var widths = p.$headCells.map(function (i) {
            var k = columnKey(this, i);
            if (typeof saved[k] === 'number') {
                return saved[k];
            }
            current = current || measureWidths(p);
            return current[i];
        }).get();
        if (widths.length) {
            applyWidths(p, widths);
        }
    }

    function reset(wrapper) {
        var p = getParts(wrapper);
        forget(p);
        p.$headCells.each(function () { clearCellWidth(this); });
        getSizingCells(p).each(function () { clearCellWidth(this); });
        var tables = p.split ? [p.$headTable, p.$bodyTable] : [p.$headTable];
        $.each(tables, function (_, $t) {
            $t.removeClass('lzrc-fixed').css({ width: '', minWidth: '' });
        });
        var tableEl = p.$bodyTable[0];
        if (tableEl && $.fn.dataTable && $.fn.dataTable.isDataTable(tableEl)) {
            $(tableEl).DataTable().columns.adjust();
        }
    }

    // ---------------------------------------------------------------------
    // Dragging
    // ---------------------------------------------------------------------
    function onPointerDown(e) {
        if (e.button !== undefined && e.button !== 0) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();

        var handle = this;
        var th = handle.parentNode;
        var wrapper = $(th).closest('.dataTables_wrapper')[0];
        if (!wrapper) {
            return;
        }
        var p = getParts(wrapper);
        var idx = p.$headCells.index(th);
        if (idx < 0) {
            return;
        }

        var widths = measureWidths(p);
        applyWidths(p, widths);

        var startX = e.pageX;
        var startW = widths[idx];
        var moved = false;

        $(handle).addClass('lzrc-active');
        $('body').addClass('lzrc-dragging');

        $(document)
            .on('pointermove.lzrc', function (ev) {
                var w = Math.max(MIN_WIDTH, Math.round(startW + ev.pageX - startX));
                if (w !== widths[idx]) {
                    moved = true;
                    widths[idx] = w;
                    applyWidths(p, widths);
                }
            })
            .on('pointerup.lzrc pointercancel.lzrc', function () {
                $(document).off('.lzrc');
                $(handle).removeClass('lzrc-active');
                $('body').removeClass('lzrc-dragging');
                if (moved) {
                    save(p, widths);
                    wrapper._lzrcSuppressClick = true;
                    setTimeout(function () { wrapper._lzrcSuppressClick = false; }, 60);
                }
            });
    }

    // ---------------------------------------------------------------------
    // Table initialization
    // ---------------------------------------------------------------------
    function ensureHandles(p) {
        p.$headCells.each(function () {
            if ($(this).children('.lzrc-handle').length) {
                return;
            }
            $(this).addClass('lzrc-th');
            $('<div class="lzrc-handle" title="Drag to resize, double click to restore"></div>')
                .appendTo(this);
        });
    }

    function setupWrapper(wrapper) {
        if (!wrapper) {
            return;
        }
        var p = getParts(wrapper);
        if (!p.$headCells.length) {
            return;
        }

        if (!wrapper._lzrcInit) {
            wrapper._lzrcInit = true;

            // Prevent the end of the drag (or a click on the handle) from sorting the column
            wrapper.addEventListener('click', function (ev) {
                var onHandle = $(ev.target).closest('.lzrc-handle').length > 0;
                if (onHandle || (wrapper._lzrcSuppressClick && $(ev.target).closest('th').length)) {
                    ev.stopPropagation();
                    ev.preventDefault();
                    wrapper._lzrcSuppressClick = false;
                }
            }, true);

            $(wrapper).on('pointerdown', '.lzrc-handle', onPointerDown);
            $(wrapper).on('dblclick', '.lzrc-handle', function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                reset(wrapper);
            });
        }

        ensureHandles(p);
        restore(p);
    }

    function wrapperFromEvent(e, settings) {
        if (settings && settings.nTableWrapper) {
            return settings.nTableWrapper;
        }
        return $(e.target).closest('.dataTables_wrapper')[0];
    }

    // ---------------------------------------------------------------------
    // Start
    // ---------------------------------------------------------------------
    function start() {
        injectCss();

        // DataTables events bubble up to document
        $(document).on('init.dt draw.dt column-sizing.dt', function (e, settings) {
            setupWrapper(wrapperFromEvent(e, settings));
        });

        // Full text on mouse hover for truncated cells
        $(document).on('mouseenter', 'table.lzrc-fixed > tbody > tr > td', function () {
            if (this.scrollWidth > this.clientWidth && !this.getAttribute('title')) {
                var txt = $(this).text().trim();
                if (txt) {
                    this.setAttribute('title', txt);
                }
            }
        });

        // Tables already present, if any
        $('.dataTables_wrapper').each(function () { setupWrapper(this); });
    }

    if (window.lizMap && window.lizMap.events) {
        window.lizMap.events.on({ uicreated: start });
    } else {
        $(start);
    }
})();