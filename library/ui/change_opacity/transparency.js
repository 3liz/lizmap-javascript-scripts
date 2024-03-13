function getAllLayers(){
    var layers = $('#switcher-layers').find('tr:not(.liz-hidden):not([id^="group"])');
    $('#selectLayer').empty();

    layers.each(function() {
        var button = $(this).find('button');
        var isChecked = button.hasClass('checked');

        if (isChecked) {
            var label = $(this).find('.label').text();
            var value = button.val();
            var option = $('<option>').text(label).val(value);

            if (label && value){
                $('#selectLayer').append(option);
            }
        }
    })
}

function updateLayerTransparency() {
    value = $('#transparencySlider').val()
    $('#transparencyValue').text(value);

    var transparency = parseFloat(value);

    var layerName = $('#selectLayer').val();
    var layer = lizMap.map.getLayersByName(layerName)[0];

    if (layer) {
        layer.setOpacity(transparency);
    }
}

lizMap.events.on({
    uicreated: function(e) {
        var html = '<div class="select-layer" id="selectDivLayer">';
        html += '<label for="selectLayer">Layers :</label>';
        html += '<select id="selectLayer" onchange="updateLayerTransparency()"></select></div>';
        
        // Transparency slider
        html += '<div id="transparencySliderContainer">';
        html += '<label for="transparencySlider">Transparency :</label>';
        html += '<input type="range" id="transparencySlider" min="0" max="1" step="0.1" value="1" onchange="updateLayerTransparency()">';
        html += '<span id="transparencyValue">1.0</span>';
        html += '</div>';

        lizMap.addDock(
            'transparency-slider',
            'Change transparency',
            'minidock',
            html,
            'icon-search',
        );

        getAllLayers();

        $('#switcher-layers').on('click', function() {
            getAllLayers();
        });
        
    }
});