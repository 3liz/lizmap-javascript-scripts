lizMap.events.on({
    uicreated: function(e) {
    //ZoomIn
    $(document).keypress(function(e) {
        if(e.shiftKey && e.which == 90) { //Touche Shift+z
          $('#navbar button.zoom-in').click();
        }
    });
    //ZoomOut
    $(document).keypress(function(e) {
        if(e.shiftKey && e.which == 79) { //Touche Shift+o
          $('#navbar button.zoom-out').click();
        }
    });
    //Switcher
    $(document).keypress(function(e) {
        if(e.shiftKey && e.which == 83) { //Touche Shift+s
          $('#mapmenu li.switcher a').click();
        }
    });
    //Metadata
    $(document).keypress(function(e) {
        if(e.shiftKey && e.which == 73) { //Touche Shift+i
          $('#mapmenu li.metadata a').click();
        }
    });
    //Edition
    $(document).keypress(function(e) {
        if(e.shiftKey && e.which == 69) { //Touche Shift+e
          $('#mapmenu li.edition a').click();
        }
    });
    //Locate
    $(document).keypress(function(e) {
        if(e.shiftKey && e.which == 76) { //Touche Shift+l
          $('#mapmenu li.locate a').click();
        }
    });
    //Geolocation
    $(document).keypress(function(e) {
        if(e.shiftKey && e.which == 71) { //Touche Shift+g
          $('#mapmenu li.geolocation a').click();
        }
    });
    //Print
    $(document).keypress(function(e) {
        if(e.shiftKey && e.which == 80) { //Touche Shift+p
          $('#mapmenu li.print a').click();
        }
    });
    //Measure
    $(document).keypress(function(e) {
        if(e.shiftKey && e.which == 77) { //Touche Shift+m
          $('#mapmenu li.measure a').click();
        }
    });
    //AttributeLayers
    $(document).keypress(function(e) {
        if(e.shiftKey && e.which == 68) { //Touche Shift+d
          $('#mapmenu li.attributeLayers a').click();
        }
    });
    //Atlas
    $(document).keypress(function(e) {
        if(e.shiftKey && e.which == 65) { //Touche Shift+a
          $('#mapmenu li.atlas a').click();
        }
    });


    }
});
