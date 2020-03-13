/*This javascript script translate (in this case from italian to french) layers and groups names, the title of the project, 
the print layout name and the aliases or fileds names according to the language of the browser and using the json file created
with the python script get_translatable_string.py
If a translated string is provided in the json file the original string is translated, otherwise the original string is shown.
The json file must be saved in the media folder which need to be available from the web. To do this it is necessary to create 
a symbolic link on the apache directory (e.g. /var/www/html/) to the media folder in the user repository.*/

//This function is executed when the uicreated event is triggered
lizMap.events.on({
    uicreated: function(e) {
        // get browser language
        var userLang = navigator.language || navigator.userLanguage;
        if (userLang === 'fr' || userLang === 'fr-FR'){      
            
            var translationIT_FR = {};

            // get the json file with transalted strings
            // the path to the json file must be provided as relative path, using the web url the browser can return a security error
            fetch('../../../../../../concerteaux3d/translation.json').then(function(response) {
                if (response.ok)
                    return response.json();
                throw new Error('Network response was not ok.');
                }).then(function(translation) {

                    // put the json content in to the dictionary
                    translationIT_FR = translation;
                    //console.log(translationIT_FR);
                    // iterate over dictionary key
                    Object.keys(translationIT_FR).forEach((italian) => {
                        //check if a translation is provided for each string
                        if (translationIT_FR[italian] != ""){
                            // translate layers and groups name in the layer tree
                            $("div#content div#switcher.tab-pane div#switcher-layers-container.switcher div.menu-content div#switcher-layers div.without-blocks.no-group table.tree.treeTable tbody tr td span.label").filter(function(){
                                return $(this).text() === italian
                            }).html(translationIT_FR[italian]);
                            // translate layers name in the baselayer menu
                            $("div#content div#switcher.tab-pane div#switcher-baselayer.baselayer div.menu-content div.baselayer-select select option").filter(function(){
                                return $(this).text() === italian
                            }).html(translationIT_FR[italian]);
                            // translate layers name in the editing tool menu
                            $("div#content div#edition.tab-pane div.edition div.menu-content div select option").filter(function(){
                                return $(this).text() === italian
                            }).html(translationIT_FR[italian]);
                            // translate layers name in the selection tool menu
                            $("div#content div#map-content div#mini-dock div.tabbable.tabs-below div#mini-dock-content.tab-content div#selectiontool.tab-pane div.selectiontool div.menu-content table tbody tr td select#selectiontool-layer-list option").filter(function(){
                                return $(this).text() === italian
                            }).html(translationIT_FR[italian]);
                            // translate layouts name in the print tool menu
                            $("div#content div#mini-dock div#print.tab-pane div.print div.menu-content table tbody tr td select#print-template option").filter(function(){
                                return $(this).text() === italian
                            }).html(translationIT_FR[italian]);
                            // translate layers and groups name in the attribute layer tool
                            $("div#content div#bottom-dock div#attributeLayers.tab-pane div.tab-content div#attribute-layer-list table tbody tr td").filter(function(){
                                return $(this).text() === italian
                            }).html(translationIT_FR[italian]);
                            // translate the title of the project
                            $("div#header div#title h1").filter(function(){
                                return $(this).text() === italian
                            }).html(translationIT_FR[italian]);
                        }
                        else {
                            $("div#content div#switcher.tab-pane div#switcher-layers-container.switcher div.menu-content div#switcher-layers div.without-blocks.no-group table.tree.treeTable tbody tr td span.label").filter(function(){
                                return $(this).text() === italian
                            }).html(italian);
                            $("div#content div#switcher.tab-pane div#switcher-baselayer.baselayer div.menu-content div.baselayer-select select option").filter(function(){
                                return $(this).text() === italian
                            }).html(italian);
                            $("div#content div#edition.tab-pane div.edition div.menu-content div select option").filter(function(){
                                return $(this).text() === italian
                            }).html(italian);
                            $("div#content div#map-content div#mini-dock div.tabbable.tabs-below div#mini-dock-content.tab-content div#selectiontool.tab-pane div.selectiontool div.menu-content table tbody tr td select#selectiontool-layer-list option").filter(function(){
                                return $(this).text() === italian
                            }).html(italian);
                            $("div#content div#mini-dock div#print.tab-pane div.print div.menu-content table tbody tr td select#print-template option").filter(function(){
                                return $(this).text() === italian
                            }).html(italian);
                            $("div#content div#bottom-dock div#attributeLayers.tab-pane div.tab-content div#attribute-layer-list table tbody tr td").filter(function(){
                                return $(this).text() === italian
                            }).html(italian);
                            $("div#header div#title h1").filter(function(){
                                return $(this).text() === italian
                            }).html(italian);
                        }
                    });
            });

        }
    }
});

//This function is executed when the lizmapeditionformdisplayed event is triggered
lizMap.events.on({
    lizmapeditionformdisplayed: function(e) {
        // get browser language
        var userLang = navigator.language || navigator.userLanguage;
        if (userLang === 'fr' || userLang === 'fr-FR'){

            var translationIT_FR2 = {};

            // get the json file with transalted strings
            // the path to the json file must be provided as relative path, using the web url the browser can return a security error
            fetch('../../../../../../concerteaux3d/translation.json').then(function(response) {
                if (response.ok)
                    return response.json();
                throw new Error('Network response was not ok.');
                }).then(function(translation) {

                    // put the json content in to the dictionary
                    translationIT_FR2 = translation;
                    //console.log(translationIT_FR2);
                    // iterate over dictionary key
                    Object.keys(translationIT_FR2).forEach((italian) => {
                        //check if a translation is provided for each string
                        if (translationIT_FR2[italian] != ""){
                            // translate layers name in the edition form
                            $("div#content div#edition.tab-pane div.edition div.menu-content div#edition-form-container div h3").filter(function(){
                                return $(this).text() === italian
                            }).html(translationIT_FR2[italian]);
                            // translate aliases or fields name in the edition form
                            $("div#content div#edition.tab-pane div.edition div.menu-content div#edition-form-container form#jforms_view_edition.form-horizontal div.control-group label").filter(function(){
                                return $(this).text() === italian
                            }).html(translationIT_FR2[italian]);
                        }
                        else {
                            $("div#content div#edition.tab-pane div.edition div.menu-content div#edition-form-container div h3").filter(function(){
                                return $(this).text() === italian
                            }).html(italian);
                            $("div#content div#edition.tab-pane div.edition div.menu-content div#edition-form-container form#jforms_view_edition.form-horizontal div.control-group label").filter(function(){
                                return $(this).text() === italian
                            }).html(italian);
                        }
                    });
            });

        }
    }
});

//This function is executed when the lizmappopupdisplayed event is triggered
lizMap.events.on({
    lizmappopupdisplayed: function(e) {
        // get browser language
        var userLang = navigator.language || navigator.userLanguage;
        if (userLang === 'fr' || userLang === 'fr-FR'){

            var translationIT_FR3 = {};

            // get the json file with transalted strings
            // the path to the json file must be provided as relative path, using the web url the browser can return a security error
            fetch('../../../../../../concerteaux3d/translation.json').then(function(response) {
                if (response.ok)
                    return response.json();
                throw new Error('Network response was not ok.');
                }).then(function(translation) {

                    // put the json content in to the dictionary
                    translationIT_FR3 = translation;
                    //console.log(translationIT_FR3);
                    // iterate over dictionary key
                    Object.keys(translationIT_FR3).forEach((italian) => {
                        //check if a translation is provided for each string
                        if (translationIT_FR3[italian] != ""){
                            // translate layers name in the popup
                            $("div#content div#map-content div#map.olMap div#OpenLayers_Map_377_OpenLayers_ViewPort div#OpenLayers_Map_377_OpenLayers_Container div#liz_layer_popup.olPopup.lizmapPopup div#liz_layer_popup_GroupDiv div#liz_layer_popup_contentDiv.olPopupContent.lizmapPopupContent h4").filter(function(){
                                return $(this).text() === italian
                            }).html(translationIT_FR3[italian]);
                            // translate aliases or fields name in the popup
                            $("div#content div#map-content div#map.olMap div#OpenLayers_Map_377_OpenLayers_ViewPort div#OpenLayers_Map_377_OpenLayers_Container div#liz_layer_popup.olPopup.lizmapPopup div#liz_layer_popup_GroupDiv div#liz_layer_popup_contentDiv.olPopupContent.lizmapPopupContent div.lizmapPopupDiv table.lizmapPopupTable tbody tr th").filter(function(){
                                return $(this).text() === italian
                            }).html(translationIT_FR3[italian]);
                        }
                        else {
                            $("div#content div#map-content div#map.olMap div#OpenLayers_Map_377_OpenLayers_ViewPort div#OpenLayers_Map_377_OpenLayers_Container div#liz_layer_popup.olPopup.lizmapPopup div#liz_layer_popup_GroupDiv div#liz_layer_popup_contentDiv.olPopupContent.lizmapPopupContent h4").filter(function(){
                                return $(this).text() === italian
                            }).html(italian);
                            $("div#content div#map-content div#map.olMap div#OpenLayers_Map_377_OpenLayers_ViewPort div#OpenLayers_Map_377_OpenLayers_Container div#liz_layer_popup.olPopup.lizmapPopup div#liz_layer_popup_GroupDiv div#liz_layer_popup_contentDiv.olPopupContent.lizmapPopupContent div.lizmapPopupDiv table.lizmapPopupTable tbody tr th").filter(function(){
                                return $(this).text() === italian
                            }).html(italian);
                        }
                    });
            });
        }
    }
});

//This function is executed when the minidockopened event is triggered (it works only if the location tool is opened clicking on the related button of the toolbar)
lizMap.events.on({
    minidockopened: function(){
        var userLang = navigator.language || navigator.userLanguage;
        if (userLang === 'fr' || userLang === 'fr-FR'){
            // translate the layer name shown in the location tool 
            $("div#content div#map-content div#mini-dock div.tabbable.tabs-below div#mini-dock-content.tab-content div#locate.tab-pane.active div.locate div.menu-content div.locate-layer span.custom-combobox input[placeholder='Comuni Roia']").attr("placeholder", "Vive la revolucion");
        }
    }
});

//This function is executed when the lizmapswitcheritemselected event is triggered
lizMap.events.on({
    lizmapswitcheritemselected: function(){
        var userLang = navigator.language || navigator.userLanguage;
        if (userLang === 'fr' || userLang === 'fr-FR'){        
            
            var translationIT_FR = {};

            // get the json file with transalted strings
            // the path to the json file must be provided as relative path, using the web url the browser can return a security error
            fetch('../../../../../../concerteaux3d/translation.json').then(function(response) {
                if (response.ok)
                    return response.json();
                throw new Error('Network response was not ok.');
                }).then(function(translation) {

                    // put the json content in to the dictionary
                    translationIT_FR = translation;
                    console.log(translationIT_FR);
                    // iterate over dictionary key
                    Object.keys(translationIT_FR).forEach((italian) => {
                        //check if a translation is provided for each string
                        if (translationIT_FR[italian] != ""){
                            // translate the content of the layer information sub-dock
                            $("div#content div#sub-dock div.sub-metadata div.menu-content dl dd").filter(function(){
                                return $(this).text() === italian
                            }).html(translationIT_FR[italian]);
                        }
                        else{
                            $("div#content div#sub-dock div.sub-metadata div.menu-content dl dd").filter(function(){
                                return $(this).text() === italian
                            }).html(italian);
                        }
                    });
                });
        }
    }
});

// Work in progress: translate the layer tooltip that is shown when the mouse pointer pass over the layer name in the layer tree (see issue https://github.com/3liz/lizmap-web-client/issues/428)
/*lizMap.events.on({
    mouseover: function(){
        console.log('Ciao!')
        var userLang = navigator.language || navigator.userLanguage;
        if (userLang === 'fr' || userLang === 'fr-FR'){    
            
            var translationIT_FR = {};

            // get the json file with transalted names
            fetch('../../../../../../concerteaux3d/translation.json').then(function(response) {
                if (response.ok)
                    return response.json();
                throw new Error('Network response was not ok.');
                }).then(function(translation) {

                    // put the json content in to the dictionary
                    translationIT_FR = translation;
                    console.log(translationIT_FR);
                    // iterate over dictionary key
                    Object.keys(translationIT_FR).forEach((italian) => {
                        if (translationIT_FR[italian] != ""){
                            $("div#content div#switcher.tab-pane div#switcher-layers-container.switcher div.menu-content div#switcher-layers div.without-blocks.no-group table.tree.treeTable tbody tr td div.tooltip div.tooltip-inner").filter(function(){
                                return $(this).text() === italian
                            }).html(translationIT_FR[italian]);
                        }
                        else{
                            $("div#content div#switcher.tab-pane div#switcher-layers-container.switcher div.menu-content div#switcher-layers div.without-blocks.no-group table.tree.treeTable tbody tr td div.tooltip div.tooltip-inner").filter(function(){
                                return $(this).text() === italian
                            }).html(italian);
                        }
                    });
                });
        }
    }
});*/