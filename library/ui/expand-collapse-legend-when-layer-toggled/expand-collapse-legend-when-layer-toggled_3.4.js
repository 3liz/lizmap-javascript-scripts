/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * Automatically expands the legend when a layer or group is checked, and collapses it when unchecked. Tested with Lizmap Web Client 3.9.
 */

lizMap.events.on({
    uicreated: function () {
        const layerTree = lizMap.mainLizmap.state.layerTree;

        const toggleExpanded = (evt) => {
            const item = layerTree.findTreeLayersAndGroups()
                .find(tl => tl.name === evt.name);
            if (!item) return;

            const expand = !!evt.visibility;
            item.expanded = expand;

            // Second passage une fois que l'interface a fini de réagir au clic
            setTimeout(() => { item.expanded = expand; }, 300);
        };

        layerTree.addListener(toggleExpanded, 'layer.visibility.changed');
        layerTree.addListener(toggleExpanded, 'group.visibility.changed');
    }
});
