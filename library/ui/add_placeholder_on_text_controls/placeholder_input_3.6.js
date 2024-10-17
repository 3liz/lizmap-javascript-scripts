// this script will allow you to add placeholder attributes to input text and textarea elements
// in addition to Fields alias it can help user to understand field usage
// configure using tabPlaceholder variable :
// list layer's fields on which a placeholder attributes will be set
/*
    { "<layer slug>"  (via dom html or project file)  : {
        '<field dom id 1>' ( jforms_view_edition_<field_name>) : "<Placeholder value (will be display on empty field)>" ,
        '<field dom id 2>'  : "<placeholder 2>" ,
        ...
    }}
*/

lizMap.events.on({

	lizmapeditionformdisplayed: function(e)  {

        // example with a pizzeria layer with fields name and description
        // must be changed
        var tabPlaceholder = {  'pizzeria_f97c3105_7b75_45d5_ac1f_b953d1c1d6f8' : {
                'jforms_view_edition_name' :  "Example : la dolce vita",
                "jforms_view_edition_description" : "Fill free to add your description : opening hours, parking, ..."
            } 
        } ;

        for( var i in tabPlaceholder ) {
            // matching layerID
            if (e.layerId === i) {
                let fields = tabPlaceholder[i];
                for( var inputElement_id in fields) {
                    document.getElementById(inputElement_id).setAttribute('placeholder',fields[inputElement_id])
                }
           }
        }
        
    }
});
