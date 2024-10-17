lizMap.events.on({
    uicreated: function(e) {
        $('#button-geolocation').click();
        $('lizmap-geolocation div.menu-content div.button-bar button:first').click();
    }
});