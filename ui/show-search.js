lizMap.events.on({
        'uicreated': function(e) {	
		var searchElement = $('.navbar-search').clone(true, true);
		$('#headermenu .navbar-search').remove();

		searchElement.appendTo('#content');	
		searchElement.css({top: 5, right: 50, position:'absolute', zIndex:999});
		$('#lizmap-search').css({top: 42, right: 150, position:'absolute'});
	}
});
