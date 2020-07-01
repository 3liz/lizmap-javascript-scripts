Activate snapping
==================

The script provides snapping edition for geometry.

You can configure snapping by updating the `snapLayers` variable.

```
    var snapLayers = {
        'Quartiers' : {
            'layers': [
                'Quartiers',
                'SousQuartiers'
            ],
            snapToNode: true,
            snapToEdge: false,
            snapToVertex: true
        }
    }
```

The snapLayers keys are the layer's name for which you want to activate snapping.

* The `layers` key contains the layer's list to snap on.
* The `snapToNode` activates snapping to node
* The `snapToEdge` activates snapping to edge
* The `snapToVertex` activates snapping to edges intersection