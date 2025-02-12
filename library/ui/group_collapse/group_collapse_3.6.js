/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

lizMap.events.on({
	uicreated: () => {
		// Replace `groupname` by the group name in the HTML
		// You can collapse several groups using commas
		// e.g. `document.getElementById('group-group1 td a.expander, group-group2 td a.expander').click();`
		document.getElementById('group-groupname td a.expander').click();
	}
});
