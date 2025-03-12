/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

lizMap.events.on({
	uicreated: function(e) {
		// Collapse locate at startup
		$('#button-locate').click();
    }
});
