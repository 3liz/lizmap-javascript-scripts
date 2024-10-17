lizMap.events.on({
	'uicreated': function(e) {
		//Metadata button and panel
		$("#mapmenu .metadata")[0].remove();
		$("#dock-tabs #nav-tab-metadata").remove();

		//Home button
		$("#mapmenu .home")[0].remove();
	}
});
