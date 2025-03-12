/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

/*
    This script works with Lizmap >= 3.5.
    It displays all children popups as tabs next to parent popup tab.
    Children are defined in QGIS in 'Project Properties' => Relations.
    Children tabs are ordered by their Id so you can control it by setting Ids
    as 0_your_id, 1_your_id, ... for example.
*/
lizMap.events.on({
    lizmappopupallchildrendisplayed: (popupChildrenData) => {

        // Parent div with lizmapPopupSingleFeature class
        const parentPopupElement = popupChildrenData.parentPopupElement;

        // Children popup elements
        const childPopupElements = popupChildrenData.childPopupElements;

        // Wrap parent popup with div and class to create Bootstrap 2 tabs
        parentPopupElement.children('.lizmapPopupDiv')
            .wrap('<div class="tabbable"></div>')
            .wrap('<div class="tab-content"></div>');

        // Get popup children content
        // and create tabs with it
        let popupChildrenTabTitle = '';
        let popupChildrenTabContent = '';

        for (let index = 0; index < childPopupElements.length; index++) {
            const childPopupElement = childPopupElements[index];

            const childPopupTitle = childPopupElement.data('title');

            // Remove children titles as there are now in tab
            childPopupElement.find('.lizmapPopupTitle').remove();
            const childPopupContent = childPopupElement[0].outerHTML;

            popupChildrenTabTitle += `<li><a href="#tab-child-${index}" data-toggle="tab">${childPopupTitle}</a></li>`;
            popupChildrenTabContent += `<div class="tab-pane lizmapPopupDiv" id="tab-child-${index}">${childPopupContent}</div>`;
        }

        // Get popup parent content
        // Get feature unique id and replace . by _ to use it as a valid id
        const parentId = parentPopupElement.find('.lizmap-popup-layer-feature-id').val().replace('.', '_');
        const parentPopupTitle = parentPopupElement.children('h4').text();

        // Create and add tabs
        const tabsTemplate = `
            <ul class="nav nav-tabs" style="background: #eee;">
                <li class="active"><a href="#tab-${parentId}" data-toggle="tab">${parentPopupTitle}</a></li>
                ${popupChildrenTabTitle}
            </ul>`;

        parentPopupElement.children('.tabbable').prepend(tabsTemplate);

        // Create and add tabs content
        parentPopupElement.find('.tab-content .lizmapPopupDiv').first().addClass('tab-pane active').attr('id', 'tab-' + parentId);
        parentPopupElement.find('.tab-content').append(popupChildrenTabContent);

        // Remove old parent title
        parentPopupElement.children('.lizmapPopupTitle').remove();

        // Remove old children popups in parent popup
        parentPopupElement.find('.tab-content .lizmapPopupDiv').first().children('.lizmapPopupChildren').remove();
    }
});
