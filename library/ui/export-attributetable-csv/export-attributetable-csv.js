lizMap.events.on({

    'attributeLayerContentReady': function(e) {
        const fieldSeparator = ',';
        const fieldBoundary = '"';
        const escapeChar = '"';
        const reBoundary = new RegExp(fieldBoundary, 'g');
        const newLine = navigator.userAgent.match(/Windows/) ? '\r\n' : '\n';

        var join = function (a) {
            var s = '';

            // If there is a field boundary, then we might need to escape it in
            // the source data
            for (var i = 0, ien = a.length; i < ien; i++) {
                if (i > 0) {
                    s += fieldSeparator;
                }

                s += fieldBoundary
                    ? fieldBoundary +
                    ('' + a[i]).replace(reBoundary, escapeChar + fieldBoundary) +
                    fieldBoundary
                    : a[i];
            }

            return s;
        };

        var exportData = function (cleanName) {
            const tableSelector = '#attribute-layer-table-'+cleanName;
            var oTable = $( tableSelector ).dataTable();

            const heads = join($(tableSelector+' th[aria-controls="'+tableSelector.slice(1)+'"]').map(function() {return this.innerText}).toArray())
            const rows = oTable.fnGetNodes().map(function(row) {
                return join(Array.from(row.cells).slice(1).map(function(cell) {
                    if (cell.children.length != 0) {
                        const child = cell.children[0];
                        if (child.tagName == 'A') {
                            return child.href;
                        }
                    }
                    const text = cell.innerText;
                    if (text.includes(',')) {
                        if (text.includes("'")) {
                            return "'"+text.replace("'", "\'")+"'";
                        }
                        return "'"+text+"'";
                    }
                    return text;
                }));
            });

            const output = heads + newLine + rows.join(newLine);
            const charset = document.characterSet || document.charset;
            const fileType = 'text/csv' + charset

            const content = new Blob([output], { type: fileType });

            var a = document.createElement('a');
            a.download = cleanName+'.csv';
            a.href = URL.createObjectURL(content);
            a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => { URL.revokeObjectURL(a.href); }, 1500);
        }

        const cleanName = lizMap.cleanName(e.featureType);
        $('#attribute-layer-'+cleanName+' .attribute-layer-action-bar .export-formats').prepend(
            '<button class="btn btn-mini exportCSV" data-name="'+cleanName+'">CSV</button>'
        );
        $('#attribute-layer-'+cleanName+' .attribute-layer-action-bar .export-formats .exportCSV').click(() => {
            exportData(cleanName);
        });
    }
});
