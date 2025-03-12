/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

lizMap.events.on({
    
    uicreated: function(e) {
        
        //start resizable container
        var htmlCodeExternalJS = '<script src="https://rawgit.com/RickStrahl/jquery-resizable/master/src/jquery-resizable.js"></script>'
        $('#map-content').append(htmlCodeExternalJS);

        //resize map-content
        $("#dock").resizable({ //this does resize the map-content but div is not on side of right-dock, so this width wont be changed
            handleSelector: ".splitter2",
            resizeHeight: false,
            // rightElement: $("#right-dock")//,
            // touchActionNone: true
        });
        
        //design for splitter
        $('.ui-resizable-handle.ui-resizable-e').first().css('width','30px') //set width of the splitter
        $( ".ui-resizable-handle.ui-resizable-e" ).css('z-index', 1000) //set splitter to the foreground, why its lagging on top or middle but working fine on bottom
        var imageUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Merge-split-transwiki_default_2.svg/33px-Merge-split-transwiki_default_2.svg.png"
        $('.ui-resizable-handle.ui-resizable-e').css({'background-image': 'url("' + imageUrl + '")',
        'background-repeat': 'no-repeat',
        'background-position': 'center bottom 80px'});
        
        //reset max width
        $('#dock').css("max-width","100%")
        // hide overflow
        $('#dock').css("overflow","hidden")

    }
        

});
