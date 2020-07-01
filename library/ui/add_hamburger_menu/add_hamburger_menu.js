var lizHamburger = function() {

    function addHamburgerMenu() {
        console.log('add hamburger menu');

        // Add dock with all mapmenu item as buttons
        var html = '';
        html+= '<div id="mobile_menu_container">';
        html+= '<center>';
        var buttons = {'dock': []};
        var ha = $('#mapmenu li.home > a');
        var home_href = ha.attr('href');
        var home_title = ha.attr('data-original-title');
        var home_button = '<button class="btn btn-large btn-inverse dock" value="home" data-href="' + home_href + '">' + home_title + '</button>';
        home_button+= '</br>';
        buttons['dock'].push(home_button);
        $('#mapmenu ul li a').each(function(){
            var a = $(this);
            var aid = a.attr('id');
            var btn_class = 'btn-inverse';
            if (aid) {
                var atitle = a.attr('data-original-title');
                var li = a.parent('li:first');
                var menu_type = li.attr('class')
                .replace('nav-', '')
                .replace('active', '')
                .replace(aid.replace('button-', ''), '')
                .trim()
                ;
                if (menu_type != 'dock' && li.hasClass('active')) {
                    btn_class = 'btn-warning';
                }
                var button = '<button class="btn btn-large ' + ' ' + btn_class + ' ' + menu_type + '" value="' + aid + '">' + atitle + '</button>';
                button+= '</br>';
            }
            if (!(menu_type in buttons))
                    buttons[menu_type] = [];
            buttons[menu_type].push(button);
        });

        // Add the buttons
        var docks = ['dock', 'minidock', 'bottomdock', 'rightdock'];
        for(var d in docks){
            var dock = docks[d];
            if (dock in buttons) {
                html+= '<h3>'+dock+'</h3>';
                html+= '<div>';
                html+= buttons[dock].join(' ');
                html+= '</div>';
            }
        }

        html+= '</center>';
        html+= '</div>';

        // Add dock
        lizMap.addDock('mobile', 'Menu', 'dock', html, 'icon-list');

        // Trigger action when button is clicked
        // It opens the corresponding mapmenu item
        $('#mobile_menu_container button').click(function(){
            var aid = $(this).val();

            if (aid == 'home') {
                var url = $(this).attr('data-href');
                window.open(url, '_top');
                return false;
            }

            // If the dock is not the left dock, hide the left dock
            if (!($(this).hasClass('dock'))) {
                $('#mapmenu li.mobile.active a').click();
            }

            // Change button class
            if ($(this).hasClass('minidock')) {
                $('#mobile_menu_container button.minidock')
                .removeClass('btn-warning').addClass('btn-inverse');
            }
            if (!($(this).hasClass('dock'))) {
                var li = $('#'+aid).parent('li:first');
                var was_active = li.hasClass('active');
                $(this)
                .toggleClass('btn-inverse', was_active)
                .toggleClass('btn-warning', !was_active)
                ;
            }
            $('#'+aid).click();
        });

        // Add humburger button
        var html = '';
        html += '<div id="mobile_hamburger">';
        html+= '<center>';
        html+= '<div class="hamburger_line"></div>';
        html+= '<div class="hamburger_line"></div>';
        html+= '<div class="hamburger_line"></div>';
        html+= '</center>';
        html += '</div>';
        $('#map-content').append(html);
        $('#mobile_hamburger').click(function(){
            $('#mapmenu li.mobile a').click();
            $(this).hide();
        });

        // Hide mapmenu
        $('#mapmenu').css('width', '0px').hide();
        $('#dock').css('left', '0px').css('border-left', 'none');
        $('#map-content').css('margin-left', '0px');
        lizMap.updateContentSize();

        // Hide active dock
        $('#mapmenu li.nav-dock.active a').click();

        // Show hamburger button when dock is closed
        lizMap.events.on({
            'dockclosed': function(){
                $('#mobile_hamburger').show();
            },
            'minidockclosed': function(){
                $('#mobile_menu_container button.minidock')
                .removeClass('btn-warning')
                .addClass('btn-inverse');
            },
            'bottomdockclosed': function(){
                $('#mobile_menu_container button.bottomdock')
                .removeClass('btn-warning')
                .addClass('btn-inverse');
            }
        });

        // Move dock-close button at the left
        $('#dock-close').css('left', '5px').css('right', 'unset');
    }

    // Add tools on startup
    lizMap.events.on({
        'uicreated': function(e) {

            // Add hamburger menu and button
            addHamburgerMenu();
        }

    });

    // return lizHamburger object
    return {};

}();
