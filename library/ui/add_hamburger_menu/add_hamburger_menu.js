/**
* @package   lizmap
* @subpackage geopoppy
* @author    Michaël DOUCHIN
* @copyright 2020 3liz
* @link      http://3liz.com
* @license    Mozilla Public Licence
*/

var lizHamburger = function() {

    // CONFIGURATION VARIABLE - BEGINNING
    // --------------------8<-----------------
    // Change some menu interface size viascale
    var hide_active_dock = true;

    // Hamburger menu
    var add_hamburger_button = true;
    var menu_black_list = [
        'permaLink',
        'metadata',
        'popupcontent', // will not prevent to use popup, just no see the item in the menu
    ];

    // Hide map menu
    var hide_map_menu = true;

    // Fullscreen
    var add_fullscreen_button = true;

    // Scale interface
    var add_scale_interface = true;
    // Activate scale interface on startup
    var activate_scale_on_startup = true;

    // Edition button
    var add_edition_button = true;
    var auto_link_geolocation_and_edition = true;

    // Prevent history back
    var prevent_back_history = true;

    // Reactivate autocompletion on portrait mobile mode
    var reactivate_locate_by_layer_autocompletion = true;

    // Geolocation
    // Auto-center button (replaces Lizmap original #geolocation-bind)
    // This allows to control the delay between each map re-center
    // ONLY for Lizmap Web Client <= 3.3.x
    var replace_geolocation_autocenter_button = true;
    var autocenter_timeout = 10000;
    var auto_activate_geolocation = true;
    var remove_stop_button = false;

    var add_geolocation_button = true;
    var geolocation_good_accuracy = 10;

    // Hide overview and attribution
    var hide_overview_and_attribution = true;

    // locales
    var geopoppyLocales = {
        'ui.button.toggle.fullscreen.title': 'Toggle fullscreen',
        'ui.button.zoom.interface.title': 'Bigger buttons',
        'ui.button.geolocation.auto.center.title': 'Auto-center',
        'ui.button.toggle.geolocation.title': 'Toggle GPS'
    };

    // CONFIGURATION VARIABLES - END
    // --------------------8<-----------------


    // ---------------------------------------
    // DO NOT EDIT BELOW !!!
    // ---------------------------------------

    var css_scale_active = false;
    var autoCenterStatus = false;
    var autoCenterTm = null;

    // --------------------8<-----------------

    // HAMBURGER DOCK
    function addHamburgerDock(menu_black_list) {

        // Build panel content from original map-menu
        var slide_content = '';
        slide_content+= '<div id="mobile_menu_container">';
        slide_content+= '<center>';
        var buttons = {'dock': []};
        var ha = $('#mapmenu li.home > a');
        var home_href = ha.attr('href');
        var home_title = ha.attr('data-original-title');
        var home_button = '<button class="btn btn-large btn-inverse dock" value="home" data-href="' + home_href + '">' + home_title + '</button>';
        home_button+= '</br>';
        buttons['dock'].push(home_button);
        $('#mapmenu ul li a').each(function(){
            var a = $(this);
            var aid = a.attr('id');
            var btn_class = 'btn-inverse';
            if (aid) {
                var item = aid.replace('button-', '');
                if (!menu_black_list.includes(item)) {
                    var atitle = a.attr('data-original-title');
                    var li = a.parent('li:first');
                    var menu_type = li.attr('class')
                    .replace('nav-', '')
                    .replace('active', '')
                    .replace(item, '')
                    .trim()
                    ;
                    if (menu_type != 'dock' && li.hasClass('active')) {
                        btn_class = 'btn-warning';
                    }
                    var button = '<button class="btn btn-large ' + ' ' + btn_class + ' ' + menu_type + '" value="' + aid + '">' + atitle + '</button>';
                    button+= '</br>';
                }
            }
            if (!(menu_type in buttons))
                    buttons[menu_type] = [];
            buttons[menu_type].push(button);
        });

        // Add the buttons
        var docks = ['dock', 'minidock', 'bottomdock', 'rightdock'];
        for(var d in docks){
            var dock = docks[d];
            if (dock in buttons) {
                slide_content+= '<h3>'+dock+'</h3>';
                slide_content+= '<div>';
                slide_content+= buttons[dock].join(' ');
                slide_content+= '</div>';
            }
        }

        slide_content+= '</center>';
        slide_content+= '</div>';

        // Add dock
        lizMap.addDock('mobile', 'Menu', 'dock', slide_content, 'icon-list');

        addHamburgerDockEvents();

    }

    function addHamburgerDockEvents() {

        // Trigger action when button is clicked
        // It opens the corresponding mapmenu item
        $('#mobile_menu_container button').click(function(){
            var aid = $(this).val();

            if (aid == 'home') {
                var url = $(this).attr('data-href');
                window.open(url, '_top');
                return false;
            }

            // If the dock is not the left dock, hide the left dock
            if (!($(this).hasClass('dock'))) {
                $('#mapmenu li.mobile.active a').click();
            }

            // Change button class for mini dock
            if ($(this).hasClass('minidock')) {
                $('#mobile_menu_container button.minidock')
                .removeClass('btn-warning').addClass('btn-inverse');
            }
            if (!($(this).hasClass('dock'))) {
                var li = $('#'+aid).parent('li:first');
                var was_active = li.hasClass('active');
                $(this)
                .toggleClass('btn-inverse', was_active)
                .toggleClass('btn-warning', !was_active)
                ;
            }

            console.log(aid);
            console.log($('#'+aid));
            $('#'+aid).click();
        });

        // Move dock-close button at the left
        $('#dock-close').css('left', '5px').css('right', 'unset');

        // Hide dock if map is clicked
        $('#content.mobile #map').click(function(event){
            var active_dock_a = $('#mapmenu ul li.nav-dock.active a, #mapmenu ul li.nav-bottomdock.active a, #mapmenu ul li.nav-rightdock.active a');
            if (active_dock_a.length) {
                active_dock_a.click();
                return false;
            }
        });

        // Show hamburger button when dock is closed
        // (de)Activate popup to let the user close the dock when clicking in the map
        lizMap.events.on({
            'dockopened': function() {
                if ('featureInfo' in lizMap.controls) {
                    lizMap.controls.featureInfo.deactivate();
                }
            },
            'bottomdockopened': function() {
                if ('featureInfo' in lizMap.controls) {
                    lizMap.controls.featureInfo.deactivate();
                }
            },
            'minidockopened': function() {
                lizMap.updateMiniDockSize();
            },
            'dockclosed': function(e){
                $('#mobile_hamburger').show();

                if ('featureInfo' in lizMap.controls) {
                    lizMap.controls.featureInfo.activate();
                }
                if (e.id == 'edition' && lizMap.editionPending) {
                    changeGeolocationInterface();
                }
            },
            'minidockclosed': function(){
                $('#mobile_menu_container button.minidock')
                .removeClass('btn-warning')
                .addClass('btn-inverse');
            },
            'bottomdockclosed': function(){
                $('#mobile_menu_container button.bottomdock')
                .removeClass('btn-warning')
                .addClass('btn-inverse');

                if ('featureInfo' in lizMap.controls) {
                    lizMap.controls.featureInfo.activate();
                }
            }
        });


    }

    // HAMBURGER BUTTON
    function addHamburgerButton() {
        // Add hamburger button at the top left
        var hamburger_html = '';
        hamburger_html += '<div class="mobile_button hamburger">';
        hamburger_html+= '<center>';
        hamburger_html+= '<div class="hamburger_line"></div>';
        hamburger_html+= '<div class="hamburger_line"></div>';
        hamburger_html+= '<div class="hamburger_line"></div>';
        hamburger_html+= '</center>';
        hamburger_html += '</div>';

        // Add to interface
        $('#map-content').append(hamburger_html);

        // Trigger dock opening
        $('div.mobile_button.hamburger').click(function(){
            $('#mapmenu li.mobile a').click();
        });
    }

    function addHamburger(menu_black_list) {
        addHamburgerDock(menu_black_list);
        addHamburgerButton();
    }

    // --------------------8<-----------------

    // HIDE MAP MENU
    function hideMapMenu() {

        // Hide mapmenu
        $('#mapmenu').css('width', '0px').hide();
        $('#dock').css('left', '0px').css('border-left', 'none');
        $('#map-content').css('margin-left', '0px');
        lizMap.updateContentSize();

    }

    // --------------------8<-----------------

    // FULLSCREEN
    function addFullScreenButton() {

        var html = '';
        html += '<div class="mobile_button fullscreen" title="'+geopoppyLocales['ui.button.toggle.fullscreen.title']+'">';
        html+= '<center>';
        html+= '<i class="icon-fullscreen icon-white"></i>';
        html+= '</center>';
        html += '</div>';
        $('#map-content').append(html);

        $('div.mobile_button.fullscreen').click(function(){
            toggleFullScreen();
            var fullscreen_active = (document.fullscreenElement !== null)
            $(this)
                .toggleClass('active', !fullscreen_active)
        });

    }

    function toggleFullScreen() {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }

    // --------------------8<-----------------

    // SCALE INTERFACE
    function addScaleInterfaceButton(activate) {

        var html = '';
        html += '<div class="mobile_button scale" title="'+geopoppyLocales['ui.button.zoom.interface.title']+'">';
        html+= '<center>';
        html+= '<i class="icon-text-width icon-white"></i>';
        html+= '</center>';
        html += '</div>';
        $('#map-content').append(html);

        addScaleInterfaceButtonEvents(activate);

    }

    function toggleCssScale() {
        if (!css_scale_active) {
            var css = '';
            css += '#switcher td button,';
            css += '#switcher td > a,';
            css += '#switcher-layers-actions button,';
            css += '#filter-content button,';
            css += '#sub-dock a.btn,';
            css += 'span.popupButtonBar button {';
            css += '    transform: scale(2) !important;';
            css += '    margin: 12px !important;';
            css += '}';
            css += '#switcher-layers-actions td > a {';
            css += '    border: 10px solid #c3c3c3;';
            css += '}';
            css += '#switcher td {';
            css += '    white-space: nowrap !important;';
            css += '}';
            css += '#switcher td span {';
            css += '    font-size: 1.5em;';
            css += '}';
            $('head').append(
                '<style type="text/css" data-name="mobile-changes">' + css + '</style>'
            );

            // Make geolocation button larger
            $('div#geolocation button.btn')
            .removeClass('btn-small')
            .addClass('btn-large');
            lizMap.updateMiniDockSize();

        } else {

            // Remove mobile-changes CSS
            $('head style[data-name="mobile-changes"]').remove();

            // Make geolocation button smaller
            $('div#geolocation button.btn')
            .removeClass('btn-large')
            .addClass('btn-small');
            lizMap.updateMiniDockSize();
        }
        css_scale_active = !css_scale_active;
    }

    function addScaleInterfaceButtonEvents(activate) {

        $('div.mobile_button.scale').click(function(){
            toggleCssScale();
            $(this)
                .toggleClass('active', css_scale_active);
        });
        if (activate) {
            $('#geopoppy_form_container button.geopoppy_scalecss').click();
        }

    }

    // --------------------8<-----------------

    // EDITION
    function addEditionButton() {

        // Add edition button at the bottom
        var edition_layer_select = $('#edition-layer');
        if (edition_layer_select.length == 1) {
            var edition_layers_count = edition_layer_select.find('option').length;
            var html = '';
            html += '<div class="mobile_button edition">';
            html+= '<center>';
            html+= '<i class="icon-pencil icon-white"></i>';
            html+= '</center>';
            html += '</div>';
            $('#map-content').append(html);

            // Original dock edition button automatically opens geolocation mini-dock
            // And activate link between geolocation and node creation if needed
            $('#edition-draw').click(function(){
                // Adapt geolocation minidock interface
                setTimeout(() => {
                    changeGeolocationInterface();
                }, 1000);
            });

            $('div.mobile_button.edition').click(function(){
                // Open creation form automatically if only 1 layer
                var edition_layers_count = edition_layer_select.find('option').length;
                if (!lizMap.editionPending && edition_layers_count == 1){
                    $('#edition-draw').click();
                }
                // Toggle edition dock
                $('#mapmenu li.edition a').click();
            });

        }

    }


    function changeGeolocationInterface() {
        // Open geolocation if not yet active
        //$('#mapmenu li.geolocation:not(.active) a').click();
        lizMap.updateMiniDockSize();

        // Link current geolocation and edition node position
        if (lizMap.editionPending && auto_link_geolocation_and_edition
            && !($('#geolocation-edition-linked').prop( "checked")) ) {
            $('#edition-point-coord-geolocation').prop('checked', true).change();
        }
    }

    // --------------------8<-----------------

    // PREVENT BACK HISTORY
    function preventBackHistory() {

        // Prevent leaving the page without warning (back button in Android)
        window.addEventListener('beforeunload', (event) => {
            // Cancel the event as stated by the standard.
            event.preventDefault();
            // Chrome requires returnValue to be set.
            event.returnValue = '';
        });

    }

    // --------------------8<-----------------

    // CHANGE MOBILE LOCATE BY LAYER VIEW TO NORMAL VIEW
    function reactivateLocateAutocomplete() {
        $('div.locate-layer select').hide();
        $('span.custom-combobox').show();
        $('span.custom-combobox input').autocomplete(
            "option",
            "position",
            { my : "right top", at: "right bottom" }
        );
    }

    // --------------------8<-----------------

    // CHANGE AUTOCENTER BUTTON
    // ONLY FOR LIZMAP <= 3.3.X
    function toggleAutoCenter(toggle) {
        var geolocate = lizMap.controls.geolocation;
        if (toggle) {
            setAutoCenter()
        } else {
            clearAutoCenter();
        }
    }

    function setAutoCenter() {
        autoCenterTm = setTimeout(
            function() {
                autoCenterStatus = true;
                // Zoom
                $('#geolocation-center').click();
                //console.log('center = ' + (new Date()).getSeconds());
                // Re-run
                setAutoCenter();
            },
            autocenter_timeout
        );
    }

    function clearAutoCenter() {
        console.log('deactivate auto center');
        autoCenterStatus = false;
        clearTimeout(autoCenterTm);
    }

    function replaceGeolocationAutoCenterButton() {
        // Run only if needed
        if (!('geolocation' in lizMap.controls)) {
            return false;
        }

        // Hide Lizmap original auto center button
        $('#geolocation-bind').hide();

        // Replace with new button
        var but = '&nbsp;<button id="geolocation-auto-center" class="btn btn-large btn-primary start"><span class="icon"></span>&nbsp;'+geopoppyLocales['ui.button.geolocation.auto.center.title']+'</button>';

        $('#geolocation-center').after(but);
        $('#geolocation-auto-center').click(function(){
            if ($(this).hasClass('start')) {
                $(this).removeClass('start');
                var set_active = true;
            } else {
                var set_active = !autoCenterStatus;
            }
            $(this)
                .toggleClass('btn-success', set_active)
                .toggleClass('btn-primary', !set_active);
            toggleAutoCenter(set_active);
        });

    }


    // --------------------8<-----------------

    // AUTO ACTIVATE GEOLOCATION ON STARTUP

    function autoActivateGeolocation() {

        if ('geolocation' in lizMap.controls) {
            lizMap.controls.geolocation.activate();
            $('#geolocation-auto-center').click();

            // Re-display locate by layer
            if (('locateByLayer' in lizMap.config) && !(jQuery.isEmptyObject(lizMap.config.locateByLayer))) {
                $('#mapmenu li.locate:not(.active) a').click();
            }
        }

    }

    // --------------------8<-----------------

    // ADD GEOLOCATION BUTTON
    function addGeolocationButton() {
        //if (!('geolocation' in lizMap.controls)) {
            //return false;
        //}
        var html = '';
        html += '<div class="mobile_button geolocation" title="'+geopoppyLocales['ui.button.toggle.geolocation.title']+'">';
        html+= '<center>';
        html+= '<i class="icon-globe icon-white"></i>';
        html+= '</center>';
        html += '</div>';
        $('#map-content').append(html);

        $('div.mobile_button.geolocation').click(function(){
            $('#mapmenu li.geolocation a').click();
        });

        // Lizmap <= 3.3
        var geolocate = lizMap.controls.geolocation;
        if (geolocate) {
            geolocate.events.on({
              "locationupdated": function(evt) {
                var accuracy = evt.position.coords.accuracy;
                var color = 'green';
                if (accuracy > geolocation_good_accuracy)
                    color = 'orange';
                $('div.mobile_button.geolocation')
                    .removeClass('orange')
                    .removeClass('red')
                    .removeClass('green')
                    .removeClass('blue')
                    .addClass(color);

              },
              "locationfailed": function(evt) {
                $('div.mobile_button.geolocation')
                    .removeClass('orange')
                    .removeClass('green')
                    .removeClass('blue')
                    .addClass('red');

              },
              "activate": function(evt) {
                $('div.mobile_button.geolocation')
                    .removeClass('orange')
                    .removeClass('green')
                    .removeClass('red')
                    .addClass('blue');
              },
              "deactivate": function(evt) {
                $('div.mobile_button.geolocation')
                    .removeClass('orange')
                    .removeClass('green')
                    .removeClass('red')
                    .removeClass('blue');
              }
            });
        }

        // Lizmap >= 3.4
        if (lizMap.mainEventDispatcher !== undefined) {
            lizMap.mainEventDispatcher.addListener(
                () => {
                    var accuracy = lizMap.mainLizmap.geolocation.accuracy;
                    var color = 'green';
                    if (accuracy > geolocation_good_accuracy)
                        color = 'orange';
                    $('div.mobile_button.geolocation')
                        .removeClass('orange')
                        .removeClass('red')
                        .removeClass('green')
                        .removeClass('blue')
                        .addClass(color);
                    console.log(accuracy)
                    console.log(color);
                },
                'geolocation.accuracy'
            );
            lizMap.mainEventDispatcher.addListener(
                () => {
                    var isTracking = lizMap.mainLizmap.geolocation.isTracking;
                    if (isTracking) {
                        console.log('GPS ON');
                        $('div.mobile_button.geolocation')
                            .removeClass('orange')
                            .removeClass('green')
                            .removeClass('red')
                            .addClass('blue');
                    } else {

                        console.log('GPS OFF');
                        $('div.mobile_button.geolocation')
                            .removeClass('orange')
                            .removeClass('green')
                            .removeClass('red')
                            .removeClass('blue');
                    }
                },
                'geolocation.isTracking'
            );
        }

    }

    // --------------------8<-----------------

    function hideOverviewAndAttribution() {
        $('#overview-box').hide();
        $('#attribution-box').hide();
    }

    // --------------------8<-----------------

    // Add tools on startup
    lizMap.events.on({
        'uicreated': function(e) {

            // Hide active dock
            if (hide_active_dock) {
                $('#mapmenu li.nav-dock.active a').click();
            }

            // Add hamburger menu and button
            if (add_hamburger_button) {
                addHamburger(menu_black_list);
            }

            // Add fullscreen button
            if (add_fullscreen_button) {
                addFullScreenButton();
            }

            // Add scale interface button
            if (add_scale_interface) {
                addScaleInterfaceButton(activate_scale_on_startup);
            }

            // Add edition button
            if (add_edition_button) {
                addEditionButton();
            }

            // Prevent back history button
            if (prevent_back_history) {
                preventBackHistory();
            }

            // Reactivate autocompletion for content.mobile
            // And position the panel from bottom to top
            // We change select height because lizMap updatemobile function
            // is triggered lately (and on window resize)
            // and would override code placed here
            if (reactivate_locate_by_layer_autocompletion) {
                setTimeout(() => { reactivateLocateAutocomplete(); }, 2000);
                $('div#locate').click(function(){
                    reactivateLocateAutocomplete();
                });
            }

            // Replace autocenter
            if (replace_geolocation_autocenter_button) {
                replaceGeolocationAutoCenterButton();
            }

            // Remove geolocation stop button
            if (remove_stop_button) {
                $('#geolocation-stop').hide();
            }

            // Auto-activate geolocation on startup
            if (auto_activate_geolocation) {
                autoActivateGeolocation();
            }

            if (add_geolocation_button) {
                addGeolocationButton();
            }

            // Hide map menu
            if (hide_map_menu) {
                hideMapMenu();
            }

            // Hide overview and attribution
            if (hide_overview_and_attribution) {
                hideOverviewAndAttribution();
            }

        }
    });

    return {};
}();



