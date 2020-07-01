/*This javascript script translate layers and groups names, the title of the project, 
the print layout name and the aliases or fileds names according to the language of the browser and using the json files created
with the python script get_translatable_string.py
If a translated string is provided in the json file the original string is translated, otherwise the original string is shown.
The json file must be saved in the media folder.*/

var translated_string = {};
var langId = ''

var check_lang = 0
// get browser language
var userLang = navigator.language || navigator.userLanguage;
// to be changed with the desired language ID code
if (userLang === 'fr' || userLang === 'fr-FR'){
    langId = 'fr'
    check_lang++;
}
else if (userLang === 'en' || userLang === 'en-EN'){
    langId = 'en'
    check_lang++;
}

var json_url = OpenLayers.Util.urlAppend(
     lizUrls.media,
     OpenLayers.Util.getParameterString({
         "repository": lizUrls.params.repository,
         "project": lizUrls.params.project,
         "path": "media/translation_"+langId+".json"
     })
);

//This function is executed when the uicreated event is triggered
lizMap.events.on({
    uicreated: function(e) {
        if (check_lang === 1){
            // get the json file with transalted strings
            // the path to the json file must be provided as relative path, using the web url the browser can return a security error
            fetch(json_url).then(function(response) {
                if (response.ok)
                    return response.json();
                throw new Error('Network response was not ok.');
                }).then(function(translation) {

                    // put the json content in to the dictionary
                    translated_string = translation;
                    //console.log(translated_string);
                    // iterate over dictionary key
                    Object.keys(translated_string).forEach((inputLang) => {
                        //check if a translation is provided for each string
                        if (translated_string[inputLang] != ""){
                            // translate layers and groups name in the layer tree
                            $("div#content div#switcher.tab-pane div#switcher-layers-container.switcher div.menu-content div#switcher-layers div.without-blocks.no-group table.tree.treeTable tbody tr td span.label").filter(function(){
                                return $(this).text() === inputLang
                            }).html(translated_string[inputLang]);
                            // translate layers name in the baselayer menu
                            $("div#content div#switcher.tab-pane div#switcher-baselayer.baselayer div.menu-content div.baselayer-select select option").filter(function(){
                                return $(this).text() === inputLang
                            }).html(translated_string[inputLang]);
                            // translate layers name in the editing tool menu
                            $("div#content div#edition.tab-pane div.edition div.menu-content div select option").filter(function(){
                                return $(this).text() === inputLang
                            }).html(translated_string[inputLang]);
                            // translate layers name in the selection tool menu
                            $("div#content div#map-content div#mini-dock div.tabbable.tabs-below div#mini-dock-content.tab-content div#selectiontool.tab-pane div.selectiontool div.menu-content table tbody tr td select#selectiontool-layer-list option").filter(function(){
                                return $(this).text() === inputLang
                            }).html(translated_string[inputLang]);
                            // translate layouts name in the print tool menu
                            $("div#content div#mini-dock div#print.tab-pane div.print div.menu-content table tbody tr td select#print-template option").filter(function(){
                                return $(this).text() === inputLang
                            }).html(translated_string[inputLang]);
                            // translate layers and groups name in the attribut layer tool menu
                            $("div#content div#bottom-dock div#attributeLayers.tab-pane div.tab-content div#attribute-layer-list table tbody tr td").filter(function(){
                                return $(this).text() === inputLang
                            }).html(translated_string[inputLang]);
                            // translate the title of the project
                            $("div#header div#title h1").filter(function(){
                                return $(this).text() === inputLang
                            }).html(translated_string[inputLang]);
                        }
                        else {
                            $("div#content div#switcher.tab-pane div#switcher-layers-container.switcher div.menu-content div#switcher-layers div.without-blocks.no-group table.tree.treeTable tbody tr td span.label").filter(function(){
                                return $(this).text() === inputLang
                            }).html(inputLang);
                            $("div#content div#switcher.tab-pane div#switcher-baselayer.baselayer div.menu-content div.baselayer-select select option").filter(function(){
                                return $(this).text() === inputLang
                            }).html(inputLang);
                            $("div#content div#edition.tab-pane div.edition div.menu-content div select option").filter(function(){
                                return $(this).text() === inputLang
                            }).html(inputLang);
                            $("div#content div#map-content div#mini-dock div.tabbable.tabs-below div#mini-dock-content.tab-content div#selectiontool.tab-pane div.selectiontool div.menu-content table tbody tr td select#selectiontool-layer-list option").filter(function(){
                                return $(this).text() === inputLang
                            }).html(inputLang);
                            $("div#content div#mini-dock div#print.tab-pane div.print div.menu-content table tbody tr td select#print-template option").filter(function(){
                                return $(this).text() === inputLang
                            }).html(inputLang);
                            $("div#content div#bottom-dock div#attributeLayers.tab-pane div.tab-content div#attribute-layer-list table tbody tr td").filter(function(){
                                return $(this).text() === inputLang
                            }).html(inputLang);
                            $("div#header div#title h1").filter(function(){
                                return $(this).text() === inputLang
                            }).html(inputLang);
                        }
                    });
            });

        }
    }
});

//This function is executed when the lizmapeditionformdisplayed event is triggered
lizMap.events.on({
    lizmapeditionformdisplayed: function(e) {
        if (check_lang === 1){
            //console.log(translated_string);
            // iterate over dictionary key
            Object.keys(translated_string).forEach((inputLang) => {
                //check if a translation is provided for each string
                if (translated_string[inputLang] != ""){
                    // translate layers name in the edition form
                    $("div#content div#edition.tab-pane div.edition div.menu-content div#edition-form-container div h3").filter(function(){
                        return $(this).text() === inputLang
                    }).html(translated_string[inputLang]);
                    // translate aliases or fields name in the edition form
                    $("div#content div#edition.tab-pane div.edition div.menu-content div#edition-form-container form#jforms_view_edition.form-horizontal div.control-group label").filter(function(){
                        return $(this).text() === inputLang
                    }).html(translated_string[inputLang]);
                }
                else {
                    $("div#content div#edition.tab-pane div.edition div.menu-content div#edition-form-container div h3").filter(function(){
                        return $(this).text() === inputLang
                    }).html(inputLang);
                    $("div#content div#edition.tab-pane div.edition div.menu-content div#edition-form-container form#jforms_view_edition.form-horizontal div.control-group label").filter(function(){
                        return $(this).text() === inputLang
                    }).html(inputLang);
                }
            });
        }
    }
});

//This function is executed when the lizmappopupdisplayed event is triggered
lizMap.events.on({
    lizmappopupdisplayed: function(e) {
        if (check_lang === 1){
                    // iterate over dictionary key
            Object.keys(translated_string).forEach((inputLang) => {
                //check if a translation is provided for each string
                if (translated_string[inputLang] != ""){
                    // translate layers name in the popup
                    $("div#content div#map-content div#map.olMap div#OpenLayers_Map_377_OpenLayers_ViewPort div#OpenLayers_Map_377_OpenLayers_Container div#liz_layer_popup.olPopup.lizmapPopup div#liz_layer_popup_GroupDiv div#liz_layer_popup_contentDiv.olPopupContent.lizmapPopupContent h4").filter(function(){
                        return $(this).text() === inputLang
                    }).html(translated_string[inputLang]);
                    // translate aliases or fields name in the popup
                    $("div#content div#map-content div#map.olMap div#OpenLayers_Map_377_OpenLayers_ViewPort div#OpenLayers_Map_377_OpenLayers_Container div#liz_layer_popup.olPopup.lizmapPopup div#liz_layer_popup_GroupDiv div#liz_layer_popup_contentDiv.olPopupContent.lizmapPopupContent div.lizmapPopupDiv table.lizmapPopupTable tbody tr th").filter(function(){
                        return $(this).text() === inputLang
                    }).html(translated_string[inputLang]);
                }
                else {

                    $("div#content div#map-content div#map.olMap div#OpenLayers_Map_377_OpenLayers_ViewPort div#OpenLayers_Map_377_OpenLayers_Container div#liz_layer_popup.olPopup.lizmapPopup div#liz_layer_popup_GroupDiv div#liz_layer_popup_contentDiv.olPopupContent.lizmapPopupContent h4").filter(function(){
                        return $(this).text() === inputLang
                    }).html(inputLang);
                    $("div#content div#map-content div#map.olMap div#OpenLayers_Map_377_OpenLayers_ViewPort div#OpenLayers_Map_377_OpenLayers_Container div#liz_layer_popup.olPopup.lizmapPopup div#liz_layer_popup_GroupDiv div#liz_layer_popup_contentDiv.olPopupContent.lizmapPopupContent div.lizmapPopupDiv table.lizmapPopupTable tbody tr th").filter(function(){
                        return $(this).text() === inputLang
                    }).html(inputLang);
                }
            });
        }
    }
});

//This function is executed when the minidockopened event is triggered (it works only if the location tool is opened clicking on the related button of the toolbar)
lizMap.events.on({
    minidockopened: function(){
        if (check_lang === 1){
            // translate the layer name shown in the location tool 
            $("div#content div#map-content div#mini-dock div.tabbable.tabs-below div#mini-dock-content.tab-content div#locate.tab-pane.active div.locate div.menu-content div.locate-layer span.custom-combobox input[placeholder='Comuni Roia']").attr("placeholder", "Vive la revolucion");
        }
    }
});

//This function is executed when the lizmapswitcheritemselected event is triggered
lizMap.events.on({
    lizmapswitcheritemselected: function(){
        if (check_lang === 1){         
            //console.log(translated_string);
            // iterate over dictionary key
            Object.keys(translated_string).forEach((inputLang) => {
                //check if a translation is provided for each string
                if (translated_string[inputLang] != ""){
                    // translate the content of the layer information sub-dock
                    $("div#content div#sub-dock div.sub-metadata div.menu-content dl dd").filter(function(){
                        return $(this).text() === inputLang
                    }).html(translated_string[inputLang]);
                }
                else{
                    $("div#content div#sub-dock div.sub-metadata div.menu-content dl dd").filter(function(){
                        return $(this).text() === inputLang
                    }).html(inputLang);
                }
            });
        }
    }
});

// Work in progress: translate the layer tooltip that is shown when the mouse pointer pass over the layer name in the layer tree (see issue https://github.com/3liz/lizmap-web-client/issues/428)
/*lizMap.events.on({
    mouseover: function(){
        console.log('Ciao!')
        if (check_lang === 1){
                    // iterate over dictionary key
                    Object.keys(translated_string).forEach((inputLang) => {
                        if (translated_string[inputLang] != ""){
                            $("div#content div#switcher.tab-pane div#switcher-layers-container.switcher div.menu-content div#switcher-layers div.without-blocks.no-group table.tree.treeTable tbody tr td div.tooltip div.tooltip-inner").filter(function(){
                                return $(this).text() === inputLang
                            }).html(translated_string[inputLang]);
                        }
                        else{
                            $("div#content div#switcher.tab-pane div#switcher-layers-container.switcher div.menu-content div#switcher-layers div.without-blocks.no-group table.tree.treeTable tbody tr td div.tooltip div.tooltip-inner").filter(function(){
                                return $(this).text() === inputLang
                            }).html(inputLang);
                        }
                    });
        }
    }
});*/