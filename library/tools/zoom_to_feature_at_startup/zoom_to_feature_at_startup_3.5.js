/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

var lizZoomAtStratup = function() {

    var show_popup = true;

    function getHashParamFromUrl(hash_key) {
        var ret_val = null;
        var hash = location.hash.replace('#', '');
        var hash_items = hash.split(',');
        for (var i in hash_items) {
            var item = hash_items[i];
            var param = item.split(':');
            if (param.length == 2) {
                var key = param[0];
                var val = param[1];
                if (key == hash_key) {
                    return val;
                }
            }
        }
        return ret_val;
    }

    function getFeatureId() {
        var fid = getHashParamFromUrl('fid');
        if (!fid || fid.split('.').length != 2) {
            return null;
        }
        return fid;
    }

    function showFeaturePopup(featuretype, fid) {

        lizMap.getLayerFeature(featuretype, fid, function(feat){

            lizMap.getFeaturePopupContent(featuretype, feat, function(data){
                // Add class to table
                var popupReg = new RegExp('lizmapPopupTable', 'g');
                var ptext = data.replace( popupReg, 'table table-condensed table-striped table-bordered lizmapPopupTable');

                // Get feature id
                var hfid = $(ptext).find('input').val();
                var fid = hfid.split('.').pop();

                // Remove h4 title (with layer title)
                var titleReg = new RegExp('<h4>.+</h4>');
                ptext = ptext.replace(titleReg, '');

                // Add popup menu tool if needed
                if( !$('#mapmenu .nav-list > li.popupcontent > a').length ){
                    var dock = 'dock';
                    lizMap.addDock('popupcontent', 'Popup', dock, '<div class="lizmapPopupContent"/>', 'icon-comment');
                }
                $('#popupcontent div.menu-content div.lizmapPopupContent').html(ptext);

                // Open popup div
                $('#mapmenu li.popupcontent:not(.active) a').click();

                // Add geometry
                lizMap.addGeometryFeatureInfo(null, null);

                // Trigger Lizmap event to add popup toolbar
                lizMap.events.triggerEvent(
                    "lizmappopupdisplayed",
                    {'popup': null}
                );

            });

        })
    }

    lizMap.events.on({

        'uicreated': function(e) {

            var fid = getFeatureId();
            if (fid){
                // Get layer id, name, config
                var layerId = fid.split('.')[0];
                var getLayer = lizMap.getLayerConfigById(layerId);
                var featuretype = getLayer[0];
                var typename = getLayer[1].typename

                // Get integer feature id
                var fid = fid.split('.')[1];

                // Zoom to feature
                lizMap.zoomToFeature(featuretype, fid, 'zoom');

                // Show popup
                if (show_popup) {
                    showFeaturePopup(featuretype, fid);
                }
            }

        }
    });
}();
