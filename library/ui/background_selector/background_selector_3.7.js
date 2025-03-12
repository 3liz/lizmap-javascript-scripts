/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

lizMap.events.on({

    'uicreated':function(evt){
        /**
         * diff 3.6 -> 3.7 : replace #switcher-baselayer-select by lizmap-base-layers select
         * and change lizMap.mainLizmap.state (see below)
         */
        function addBaselayerImageSelector(){
            var activebl = $('#switcher-baselayer lizmap-base-layers select').val();
            var html = '<div id="baselayer-image-selector" class="'+activebl+'" title="Changer le fond de carte">';
            html+= '&nbsp;';
            html+= '</div>';
            //$('#map-content').append(html);
            if($('#baselayer-image-selector').length == 0){
                $('#map-content').append(html);
                $('#baselayer-image-selector').tooltip({placement: 'bottom'});
                $('#baselayer-image-selector').click(function(){

                    // Get next baselayer
                    var nextbl = $('lizmap-base-layers select option:selected').next('option');
                    if(nextbl.length == 0)
                        nextbl = $('lizmap-base-layers select option:first');
                    var nextbl_val = nextbl.attr('value');
                    // Change baselayer
                     $('lizmap-base-layers select').val(nextbl_val).change();
                     //!!!Important Set baselayer in lizMap config
                    lizMap.mainLizmap.state.baseLayers.selectedBaseLayerName = nextbl_val
                    // Change background image of next possible
                    getNextBaselayerImage();

                })
                getNextBaselayerImage();
            }

        }

        function getNextBaselayerImage(){
            var nextbl = $('lizmap-base-layers select option:selected').next('option');
            if(nextbl.length == 0)
                nextbl = $('lizmap-base-layers select option:first');
            var nextbl_text = nextbl.text();
            var nextbl_val = nextbl.attr('value');
            var cur_image_url = $('#baselayer-image-selector').css('background-image');
            var cur_image_spl = cur_image_url.split('/');
            cur_image_spl.pop();
            var nextbl_image = cur_image_spl.join('/') + '/' + nextbl_val + '.png';
            $('#baselayer-image-selector')
                .css(
                    'background-image',
                    nextbl_image
                )
                .attr('title', nextbl_text)
                .tooltip('fixTitle')
            ;

        }

        // Add baselayer image selector
        addBaselayerImageSelector();

    }
});
