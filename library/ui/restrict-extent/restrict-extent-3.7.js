lizMap.events.on({
   mapcreated: function(e) {
       lizMap.map.restrictedExtent = lizMap.map.maxExtent;
    }
 });