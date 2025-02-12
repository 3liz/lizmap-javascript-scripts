/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

// add some custom style
var style = "<style>"
style += "#dock {max-width:100%; padding: 0px; background: transparent!important;}"
style += "#dock-tabs { background: rgba(00,00,00,0.7)}";
style += "#dock-content{ display: flex; }"
style += "#dock .tab-pane{ padding: 0px 10px; background: rgba(00,00,00,0.7); height: 100%; max-width:350px; min-width:270px;}"
style += "#dock .tab-pane#filter{ height: max-content; margin-left:2px; min-width:200px;}"
style += "#mapmenu .filter.nav-dock{ display: none!important;}"
style += "#switcher-layers-actions{ min-height: 40px;}"
style += ".btn-custom:hover{opacity: 0.9 }"
style += '#metadata.tab-pane { background-color: #EFEFEF!important; }'
style += '#bottom-dock{ max-width: calc( 100% - 40px)}'
style += '#switcher-baselayer { min-height: 100px}'
style += "</style>"
$( style ).appendTo( "head" )

lizMap.events.on({
    'uicreated': function(e) {
        setTimeout(() => {

            // add filter panel title
            $("#filter #filter-container").before('<h3 style="margin-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.5);"><span class="title"><span class="icon" style="background-image: url(/css/filter-icon-white.png); background-position: center; width: 20px; background-size: contain; height: width: 20px; height: 20px; display: inline-block;"></span>&nbsp;<span class="text">Filter</span></span></h3>')

            // add filter button on layers panel
            $('#switcher-layers-actions').append('<button class="btn-custom" id="custom-filter-switcher" style="outline: none;background: rgba(255,255,255,0.9); border-radius: 3px;color: black; margin: 8px; margin-right: 0px;">Filter</button>');

            // open filter panel on click
            $("#custom-filter-switcher").click(function(e) {
                e.preventDefault();
                setTimeout( function() {
                    $("#filter").toggleClass("active");
                }, 200);
            })
        }, 800);   
    }
});
