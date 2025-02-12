/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

lizMap.events.on({
	'uicreated': function(e) {
		//Metadata button and panel
		$("#mapmenu .metadata")[0].remove();
		$("#dock-tabs #nav-tab-metadata").remove();

		//Home button
		$("#mapmenu .home")[0].remove();
	}
});
