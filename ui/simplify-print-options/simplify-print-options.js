lizMap.events.on({
	'uicreated': function(e) {
		$("#print-format option[value='svg']").remove();
		$("#print-format option[value='jpg']").remove();
		$("#print-format option[value='png']").text('Image');
	}
});
