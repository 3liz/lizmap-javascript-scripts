lizMap.events.on({
	'uicreated': function(e) {
		let permaLinkDom = "div#permaLink div#tab-share-permalink a#permalink";
		var buttonPermaLink = $("div#permaLink div#tab-share-permalink a#permalink");		
		buttonPermaLink.tooltip({trigger:'click'});
		buttonPermaLink.attr('data-original-title', "Lien copié");

		document.querySelector(permaLinkDom).addEventListener("click", function(event) {
			event.preventDefault();
			let permaLinkDomValue = "input-share-permalink"
			document.getElementById(permaLinkDomValue).select();
		  	document.execCommand("copy");

			setTimeout(function(){
				buttonPermaLink.tooltip('hide');
		   	}, 2000);
		}, false);
	}
});
