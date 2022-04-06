
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
