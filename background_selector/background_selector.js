lizMap.events.on({

    'uicreated':function(evt){

        function addBaselayerImageSelector(){
            var activebl = $('#switcher-baselayer-select').val();
            var html = '<div id="baselayer-image-selector" class="'+activebl+'" title="Changer le fond de carte">';
            html+= '&nbsp;';
            html+= '</div>';

            //$('#map-content').append(html);
            if($('#baselayer-image-selector').length == 0){
                $('#map-content').append(html);
                $('#baselayer-image-selector').tooltip({placement: 'bottom'});
                $('#baselayer-image-selector').click(function(){

                    // Get next baselayer
                    var nextbl = $('#switcher-baselayer-select option:selected').next('option');
                    if(nextbl.length == 0)
                        nextbl = $('#switcher-baselayer-select option:first');
                    var nextbl_val = nextbl.attr('value');

                    // Change baselayer
                     $('#switcher-baselayer-select').val(nextbl_val).change();

                    // Change background image of next possible
                    getNextBaselayerImage();

                })
                getNextBaselayerImage();
            }

        }

        function getNextBaselayerImage(){
            var nextbl = $('#switcher-baselayer-select option:selected').next('option');
            if(nextbl.length == 0)
                nextbl = $('#switcher-baselayer-select option:first');
            var nextbl_text = nextbl.text();
            var nextbl_val = nextbl.attr('value');
            var cur_image_url = $('#baselayer-image-selector').css('background-image');
            var cur_image_spl = cur_image_url.split('/');
            var cur_image = cur_image_spl.pop();
            var nextbl_image = cur_image_spl.join('/') + '/' + nextbl_val + '.png';
            var begin = window.location.protocol + "//" + window.location.host + "/";
            nextbl_image = nextbl_image.replace(
                begin,
                lizUrls.basepath
            ) + '")';
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
