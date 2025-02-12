/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

var my_legend_title = 'Legend';
var my_legend_toggle_label = 'Hide/Show the legend';
var my_legend_hide_button_label = 'Hide';
var my_legend_items = [
    {
        code: 'categorie',
        title: 'Catégories',
        items: [
            {
                title: 'Catégorie 1',
                code: '1',
                color: 'black',
                background: 'green'
            },
            {
                title: 'Catégorie 2',
                code: '2',
                color: 'darkgrey',
                background: 'orange'
            },
            {
                title: 'Catégorie 3',
                code: '3',
                color: 'white',
                background: 'red'
            }
        ]
    }
    ,
    {
        code: 'other',
        title: 'Other legend',
        items: [
            {
                title: 'Violet',
                code: '1',
                color: 'black',
                background: 'violet'
            },
            {
                title: 'Blue',
                code: '2',
                color: 'darkgrey',
                background: 'blue'
            }
        ]
    }
];


lizMap.events.on({
    'uicreated': function (e) {

        // Build legend content
        var legend_html = '';
        legend_html += '<div class="my-legend-container">';
        legend_html += '    <span id="my-legend-title">' + my_legend_title + '</span>';
        legend_html += '    <button id="my-legend-toggle" class="btn btn-mini pull-right" title="' + my_legend_toggle_label + '">';
        legend_html += my_legend_hide_button_label;
        legend_html += '    </button>';
        legend_html += '    <div id="my-legend-items-container">';
        for (var l in my_legend_items) {
            var legend = my_legend_items[l];

            legend_html += '        <div id="my-legend-' + legend.code + '" class="my-legend-item">';
            legend_html += '            <h4>' + legend.title + '</h4>';
            legend_html += '            <table class="my-legend-table">';
            legend_html += '                <tbody>';
            for (var i in legend.items) {
                var item = legend.items[i];
                legend_html += '            <tr>';
                legend_html += '                <td>';
                legend_html += '                    <span class="my-legend-symbol" style="color:' + item.color + '; background-color:' + item.background + '">';
                legend_html += item.code;
                legend_html += '                    </span>';
                legend_html += '                </td>';
                legend_html += '                <td>' + item.title + '</td>';
                legend_html += '            </tr>';
            }
            legend_html += '                </tbody>';
            legend_html += '            </table>';
            legend_html += '        </div>';
        }
        legend_html += '    </div>';
        legend_html += '</div>';

        // Add generated legend HTML in the map-content container
        $('#map-content').append(legend_html);

        // Toggle legend when clicking on the panel title or button
        $('#my-legend-title').click(function () {
            $('#my-legend-items-container').toggle();
            $('#my-legend-toggle').toggle();
        });
        $('#my-legend-toggle').click(function () {
            $('#my-legend-items-container').toggle();
            $('#my-legend-toggle').toggle();
        });

    }
});
