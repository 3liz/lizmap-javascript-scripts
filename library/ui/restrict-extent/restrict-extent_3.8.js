/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 *
 */

lizMap.events.on({
   mapcreated: function(e) {
       lizMap.map.restrictedExtent = lizMap.map.maxExtent;
    }
 });
