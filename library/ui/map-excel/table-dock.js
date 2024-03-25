// Update fields when file change
function handleFileSelection() {
    var selectedFile = $('#fileInput')[0].files[0];

    if (selectedFile) {
        updateInputFields(selectedFile);
    }
}

// Update select options
function updateSelectOptions(selectId, columns) {
    var select = $("#" + selectId);
    select.empty(); 

    $.each(columns, function(index, value) {
        $("<option>", {
            value: value,
            text: value
        }).appendTo(select);
    });
}

// Update fields
function updateInputFields(file) {
    readExcelFileAsync(file)
        .then(dataJson => {
            if (dataJson.length > 0) {
                var columns = Object.keys(dataJson[0]);
                
                var selectIds = ["selectLongitude", "selectLatitude", "selectAdresse", "selectCodePostal", "selectVille"];
                selectIds.forEach(function(selectId) {
                    updateSelectOptions(selectId, columns);
                });
            }
        })
        .catch(error => {
            console.error(error);
        });
}

// Read excel or CSV file
function readExcelFileAsync(file) {
    return new Promise((resolve, reject) => {
        var reader = new FileReader();
        reader.onload = function(e) {
            var array = e.target.result;
            const data = new Uint8Array(array);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const firstSheet = workbook.Sheets[firstSheetName];
            const dataJson = XLSX.utils.sheet_to_json(firstSheet, { header: 0 });
            resolve(dataJson);
        };
        reader.onerror = function(error) {
            reject(error);
        };
        reader.readAsArrayBuffer(file);
    });
};

function callCurrentScript() {
    var files = $('#fileInput')[0].files;

    if ($('#GPS-content').hasClass('active')){
        const promises = [];

        $.each(files, function(index, file) {
            promises.push(readExcelFileAsync(file));
        });

        var colLon = $('#selectLongitude').val();
        var colLat = $('#selectLatitude').val();

        startReadingXY(promises, colLon, colLat);

    } else if ($('#adresses-content').hasClass('active')){
        console.log("adresse");
    }
}

lizMap.events.on({
    uicreated: function(e) {
        var html = '<div id="select_files_container" style="text-align: center; height:200px">';
        html += '<ul class="nav justify-content-center nav-local-type" role="tablist">';
        html += '<li class="nav-item" role="presentation"><button class="nav-link local-type active" id="GPS-tab" data-bs-toggle="tab" data-bs-target="#GPS-content" type="button" role="tab" aria-controls="GPS" aria-selected="true">GPS</button></li>';
        html += '<li class="nav-item" role="presentation"><button class="nav-link local-type" id="adresses-tab" data-bs-toggle="tab" data-bs-target="#adresses-content" type="button" role="tab" aria-controls="adresses" aria-selected="false">Adresses</button></li>';
        html += '</ul>';
        
        html += '<div id="select-files" style="margin-top:7px">';
        html += '<input type="file" id="fileInput" name="myfile" multiple accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onchange="handleFileSelection()"><br><br>';
        html += '</div>';

        // Content of panel
        html += '<div class="tab-content" id="myTabContent">';
        html += '<div class="tab-pane active show" id="GPS-content" role="tabpanel" aria-labelledby="GPS-tab">';
        
        // For GPS
        html += '<label for="selectLongitude">Longitude :</label>';
        html += '<select id="selectLongitude"></select>';
        html += '<label for="selectLatitude">Latitude :</label>';
        html += '<select id="selectLatitude"></select>';
        html += '<label for="selectLogo">Logo :</label>';
        html += '<select id="selectLogo">';
        html += '<option value="location-mark.png" data-image="location-mark.png">Location Mark</option>';
        html += '</select></div>';

        // For adresses
        html += ' <div class="tab-pane" id="adresses-content" role="tabpanel" aria-labelledby="adresses-tab">';
        html += '<label for="selectAdresse">Adresse :</label>';
        html += '<select id="selectAdresse"></select>';
        html += '<label for="selectCodePostal">Code Postal :</label>';
        html += '<select id="selectCodePostal"></select>';
        html += '<label for="selectVille">Ville :</label>';
        html += '<select id="selectVille"></select>';
        html += '<label for="selectLogo">Logo :</label>';
        html += '<select id="selectLogo">';
        html += '<option value="location-mark.png" data-image="location-mark.png">Location Mark</option>';
        html += '</select></div></div>';

        html += '<button type="button" id="sendfiles" style="margin:10px;" onclick="callCurrentScript()">Envoyer</button>';
        
        html += '<script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/js/bootstrap.bundle.min.js" defer></script>';
        html += '<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.5/xlsx.full.min.js"></script>';
        html += '<script src="https://unpkg.com/@turf/turf@6/turf.min.js"></script>';

        lizMap.addDock(
            'excel_file',
            'Excel Table Mapping',
            'minidock',
            html,
            'icon-file'
        );

        $('#excel_file').css("width", "300px");

        $("a.nav-link.local-type").on("click", function(){
            $("a.nav-link.local-type").removeClass("active");
            $(this).addClass("active");

        });
    }
});
