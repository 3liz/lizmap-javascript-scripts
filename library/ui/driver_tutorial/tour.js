// Enable you to create an html Popup startup
function htmlPopup(tour) {
    var html = '';
    var title = 'My popup';
    var content = 'The content of the popup.'

    // Header
    html += '<div class="modal-header" style="background-color:rgba(0, 0, 0, 0.7);">';
    html += '<h3 style="color:white;">' + title + '</h3></div>';

    // Main content : body
    html += '<div class="modal-body">';
    html += '<p>' + content + '</p>';

    // Project Metadata
    html+= $('#metadata').html();

    // End of main content body
    html+= '</div>';

    // Footer
    html+= '<div class="modal-footer" style="background-color:rgba(0, 0, 0, 0.7);"></div>';

    // Return shepherd
    return {
        id: 'Popup Startup',
        text: html,
        attachTo: {
            element: 'body',
        },
        buttons: [{text: 'See tutorial',action: tour.next,}],
    }
}

// Check the browser's localstoarage
function dismissTour(){
    if(!localStorage.getItem('shepherd-tour')) {
        localStorage.setItem('shepherd-tour', 'yes');
    }
}

// Start the tutorial
function startTutorial() {
    // Create a tour
    const tour = new Shepherd.Tour({
        useModalOverlay:true, 
        defaultStepOptions: {
            classes: 'shepherd-theme-custom',
            scrollTo : true,
            cancelIcon: {enabled: true},
            keyboardNavigation:true,
            exitOnEsc:true,
            when: {

                // Create progress bar
                show() {

                    // Don't show the progress bar on first and final step
                    if (tour.steps.indexOf(tour.currentStep) != 0 && tour.steps.indexOf(tour.currentStep) != tour.steps.length - 1) {
                        const currentStepElement = tour.currentStep.el;
                        const header = currentStepElement.querySelector('.shepherd-footer');
                        const progress = document.createElement('div');
                        const innerBar = document.createElement('span');
                        const progressPercentage = ((tour.steps.indexOf(tour.currentStep) + 1)/tour.steps.length)*100 + '%';

                        progress.className='shepherd-progress-bar';
                        innerBar.style.width=progressPercentage;

                        progress.style.minWidth = '10px';
                        
                        progress.appendChild(innerBar);
                        header.insertBefore(progress, currentStepElement.querySelector('.shepherd-button'));
                    }
                }
            }
        },
        
    });
    
    tour.addStep(htmlPopup(tour));

    // Add automatic tour steps
    const tourSteps = $('.nav.nav-list li').filter(function() {
            return this.style.display !== 'none' && !this.classList.contains('hide');
        }).map(function(index, element) {
            
            const aElement = $(element).find('a')[0];
            
            return {
                id: `Step ${index + 1}`,
                title : `Step ${index + 1}`, 
                text: $(aElement).attr('data-original-title'),
                attachTo: {
                    element: aElement,
                    on: 'right',
                },
                buttons: [{ text: 'Previous', action: tour.back }, {text: 'Next',action: tour.next,}],
            };
        }
    ).get();

    // Add 3 more personal tour steps
    const stepHappyCoding = [
        {
            id : 'move-map',
            title : 'Move the map', 
            text: 'Move the map',
            attachTo: {
                element: 'span#navbar',
                on: 'left',
            },
            buttons: [{ text: 'Previous', action: tour.back }, {text: 'Next',action: tour.next,}],
        },
    
        {
            id : 'overview',
            title : 'Overview box', 
            text: 'Overview box',
            attachTo: {
                element: '#overview-box',
                on: 'top',
            },
            buttons: [{ text: 'Previous', action: tour.back }, {text: 'Next',action: tour.next,}],
        },
        
        {
            id : 'happy-coding', 
            title : 'Happy Coding', 
            text: 'And that is all, go ahead and start adding tours to your applications.',
            attachTo: {
                element: 'body',
            },
            buttons: [
                { text: 'Previous', action: tour.back }, 
                {
                    text: 'Finish',
                    action() {
                        // Dismiss the tour when the finish button is clicked
                        dismissTour();
                        return this.hide();
                    }
                }],
        }
    ];
    
    // Spread the steps into the tour array
    tourSteps.push(...stepHappyCoding); 
    tour.addSteps(tourSteps);

    // Return the
    return tour;
}

lizMap.events.on({
    uicreated: function () {
        // Include the CSS CDN of shepherd
        var link = document.createElement('link');
        link.href = 'https://cdn.jsdelivr.net/npm/shepherd.js@10.0.1/dist/css/shepherd.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Include the JS CDN of shepherd
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/shepherd.js@10.0.1/dist/js/shepherd.min.js';
        script.type = 'text/javascript';

        script.onload = function () {
            console.log('Shepherd.js has been loaded successfully!');
            const tour = startTutorial();

            // Dismiss the tour when the cancel icon is clicked
            tour.on('cancel', dismissTour);

            // Start the tour
            if (!localStorage.getItem('shepherd-tour')) {
                tour.start();
            }
        };

        script.onerror = function () {
            console.error('Erreur lors du chargement de shepherd.js');
        };

        document.head.appendChild(script);
    }
});
