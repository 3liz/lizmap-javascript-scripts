lizMap.events.on({
    uicreated: function(e) {
       lizMap.map.restrictedExtent = lizMap.map.maxExtent;
    }
 });