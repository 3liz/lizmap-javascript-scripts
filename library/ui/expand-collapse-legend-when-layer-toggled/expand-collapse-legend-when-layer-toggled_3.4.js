/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

lizMap.events.on({
    uicreated: function (e) {
        $('#switcher-layers tr.liz-layer button').click(function(){
            if ($(this).hasClass('checked') && $(this).parents('tr.collapsed').length === 1){
                $(this).prev().click()
            }
            if (!$(this).hasClass('checked') && $(this).parents('tr.expanded').length === 1) {
                $(this).prev().click()
            }
        });
    }
});
