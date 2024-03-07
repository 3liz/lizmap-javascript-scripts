// Close popup at startup
function closePopup(){
    $('.driver-popover.driverjs-first').remove();
    document.body.classList.remove('driver-active', 'driver-fade');
    $(".driver-overlay").remove();
};

// Start the tutorial
function startTutorial(){
    const driverObj = driver.js.driver({
        showProgress: false,
        progressText: '{{current}} / {{total}}',
        allowClose: true,
        nextBtnText: 'Next',
        prevBtnText: 'Previous',
        doneBtnText: 'Close',
        popoverClass: 'driverjs-theme',

        onNextClick:() => {
            driverObj.moveNext();
            // You can add more functionality onNextClick
        },
        onPrevClick:() => {
            driverObj.movePrevious();
            // You can add more functionality onPreviousClick
        },
        
        steps: [
            // Select all elements inside nav.nav-list
            ...$('.nav.nav-list li').map(function(index) {
                return {
                    element: `#mapmenu ul.nav-list li:nth-child(${index + 1}) a span:first-child`,
                    popover: { title: `Step ${index + 1}`, description: `Description for step ${index + 1}`, side: "left", align: 'start',}
                };
            }).get(),
            { popover: { title: 'Happy Coding', description: 'And that is all, go ahead and start adding tours to your applications.' } }
        ]

    });

    driverObj.drive();    
};

lizMap.events.on({
    uicreated: function () {

        // Include the CDN
        var link = document.createElement('link');
        link.href = 'https://cdn.jsdelivr.net/npm/driver.js@1.0.1/dist/driver.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/driver.js@1.0.1/dist/driver.js.iife.js';
        script.type = 'text/javascript';


        script.onload = function () {
            console.log('driver.js has been loaded successfully!');

            // Create the driver for the first popup
            const driverFirst = driver.js.driver({popoverClass: 'driverjs-first'});
            
            var html = '';
            var title = 'My popup';
            var content = 'The content of the popup.'
        
            // Header
            html += '<div class="modal-header" style="background-color:rgba(0, 0, 0, 0.7);"><div class="close-button" id="buttonClose" onclick="closePopupTuto(' + JSON.stringify() + ');">✖</div>';
            html += '<h3 style="color:white;">' + title + '</h3></div>';
        
            // Main content : body
            html += '<div class="modal-body">';
            html += '<p>' + content + '</p>';
        
            // Project Metadata
            html+= $('#metadata').html();
        
            // End of main content body
            html+= '</div>';
        
            // Footer
            html+= '<div class="modal-footer" style="background-color:rgba(0, 0, 0, 0.7);"><button type="button" class="btn btn-default" data-dismiss="modal" onclick="startTutorial();">Go to the tutorial</button></div>';

            driverFirst.highlight({
                popover: {
                    description: html,
                }
            });
        };

        script.onerror = function () {
            console.error('Erreur lors du chargement de driver.js');
        };

        document.head.appendChild(script);
    }
});
