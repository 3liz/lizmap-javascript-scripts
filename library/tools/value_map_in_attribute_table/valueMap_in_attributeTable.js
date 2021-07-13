/*This javascript script shows the description labels instead of codes for columns with ValueMap widget in the Lizmap attribute table. 
A table layer with fieldname, code and description label must be uploaded in lizMap. 
The table layer can be automatically filled running the python script get_cod_label_widget.py from the python console of the QGIS project.*/

// Layers that must be translated, ie values must be replaced by label
var layers_to_translate = [
    'layer_name_1',
    'layer_name_2',
    'layer_name_x'
];

// Future translation data will be stored in the following object
var translation_data = {};

// the table layer name
var translation_layer = 'description_table';
// In this layer
// A field named "fieldname" with the corresponding field name with value map widget
// A field named "cod" contains the code i.e the value which can be found in the field
// Field named "label" contains the label corresponding to this code.
// Example
// fieldname        code        label
// country           1         Paris 
// country           2        Rome    
// material          1        Métal 
// ....


lizMap.events.on({

   // Define layer field aliases in attribute layers
   'attributeLayersReady': function(e){

      // Initialize alias object
      for(var i in layers_to_translate){
         var layer = layers_to_translate[i];
         translation_data[layer] = {}
      }

      // Get fields and form item translation data
      var layer = translation_layer;
      lizMap.getFeatureData(layer, null, null, 'none', false, null, null, function(aName, aFilter, aFeatures, aAliases){
         if( aFeatures.length != 0 ) {
            for(var i in aFeatures){
               var data = aFeatures[i]['properties'];
               // Get field containing the description label
               var translated_label = 'label';
               if('fieldname' in data && translated_label in data ){
                  var fieldname = data['fieldname'];
                  for(var i in layers_to_translate){
                     var alayer = layers_to_translate[i];
                    // Fill in the dictionnary
                    if(data[translated_label]){
                        if( !(fieldname in translation_data[alayer]) ) {
                           console.log('sonoqui')
                           translation_data[alayer][fieldname] = {};
                        }
                        translation_data[alayer][fieldname][data['cod']] = data[translated_label];
                    }
                  }
               }
            }

            // Override lizMap.translateWfsFieldValues(aName, colName, data, translation_dict)
            lizMap.translateWfsFieldValues = function (aName, fieldName, fieldValue, translation_dict){
               var retVal = fieldValue;
               if( translation_data
                 && aName in translation_data
                 && fieldName in translation_data[aName]
                 && fieldValue in translation_data[aName][fieldName]
                 && translation_data[aName][fieldName][fieldValue]
               ){
                  retVal = translation_data[aName][fieldName][fieldValue];
               }
               return retVal;
            }

         }
         return false;
      });
   }

});
