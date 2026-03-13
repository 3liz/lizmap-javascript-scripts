/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */
lizMap.events.on({
    uicreated: function (e) {
        // use ../media/ for a file shared across all repositories/projects
        // or media/ for a specific projet file
        // more info : https://docs.lizmap.com/current/en/publish/customization/javascript.html#url-of-a-static-file
        let media = "<Your file path HERE>"; // example : "media/pdf/SamplePDF.pdf"
        // url will be build for the current projet, you can use static values if needed
        let url = lizUrls.media + '?repository=' + lizUrls.params.repository + '&project=' + lizUrls.params.project + '&path=' + media;
        lizMap.addDock(
            'pdf',
            'Aide', // tooltip when mouse is over icon
            'right-dock',
            '<iframe src="' + url + '" style="height:calc(95vh - 100px); height: -o-calc(95vh - 100px); height: -webkit-calc(95vh - 100px); height: -moz-calc(95vh - 100px);" width="95%" scrolling="no" frameborder="0"></iframe>', // dock content
            'icon-file'
        );
    }
});
