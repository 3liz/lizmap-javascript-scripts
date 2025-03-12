/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

lizMap.events.on({
        uicreated: function(e) {
                $('#switcher table.tree tr.collapsed:not(.liz-layer.disabled) a.expander').click();
                return false;
        }
});
