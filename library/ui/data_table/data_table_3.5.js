/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

lizMap.events.on({
    'uicreated': function () {

        // Change the URL from your own data
        const URL = 'https://url/index.php/lizmap/service/?repository=your_repositoryu&project=your_project&SERVICE=WFS&REQUEST=GetFeature&VERSION=your_version&TYPENAME=your_layerOUTPUTFORMAT=GeoJSON';
        const NAME = "Nom de la couche"

        var html = '<div id="statistic_content"></div>';
        lizMap.addDock(
            'table_dock',
            `Table of ${NAME}`,
            'right-dock',
            html,
            'icon-signal'
        );

        try {
            const promise = getData(URL);

            // Handle promise resolution
            promise.then(features =>{
                // Extract property names from the first feature
                const propertyNames = Object.keys(features[0].properties);
                const tableRows = [];

                // Create table header using property names
                const tableHeader = `
                    <thead>
                        <tr>
                            ${propertyNames.map(propertyName => `<th>${propertyName}</th>`).join('')}
                        </tr>
                    </thead>
                `;

                // Add rows to the table
                features.forEach(feature => {
                    const row = `
                        <tr>
                            ${propertyNames.map(propertyName => `<td>${feature.properties[propertyName]}</td>`).join('')}
                        </tr>
                    `;
                    tableRows.push(row);
                });

                // Update the style of your table
                const tableStyle = `
                    <style>
                        table#table-data {
                            width: 100%;
                            border-collapse: collapse;
                            border: 1px solid;
                            color:white;
                        }
                        #table-data th, #table-data td {
                            padding: 8px;
                            text-align: left;
                            border-bottom: 1px solid #ddd;
                        }
                        table#table-data th {
                            background-color: grey;
                        }
                    </style>
                `;
                
                // Get to the table container
                const tableContainer = $('#statistic_dock');

                // Add the content of the table
                tableContainer.html(`
                    ${tableStyle}
                    <table id="table-data">
                        ${tableHeader}
                        ${tableRows.join('')}
                    </table>
                `);
                
            })        
        }catch (error) {
            console.error('An error occurred during processing: ', error);
        }

    }
})

// Asynchronous function to get data
async function getData(url) {
    try {
        const response = await fetch(url); 

        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data.features;

    } catch (error) {
       console.error('An error occurred while retrieving the data', error);
       throw error; 
   }
};
