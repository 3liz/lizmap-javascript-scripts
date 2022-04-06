lizMap.events.on({
        uicreated: function(e) {
                $('#switcher table.tree tr.collapsed:not(.liz-layer.disabled) a.expander').click();
                return false;
        }
});
