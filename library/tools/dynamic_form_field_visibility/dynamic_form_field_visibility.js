// This script allows to show/hide 'child' fields based on 'parent' fields value
// To activate, you should describe the fields dependencies in the dynamicFields object
//
// This object contains a list of parent fields (keys)
// Foreach parent, you can set a list of child fields
// Foreach child, you must add the list of parent values which keep the child visible
// Values can be strings, '', or boolean (true, false)
// See below for a commented example:
//
// This has been done for a simple map with only ONE editable layer
// TODO: allow to configure dynamicFields for more than one layer

/*
var dynamicFields = {
    'parent_field_a': { // The change of the field 'parent_field_a'...
        'one_child_of_a': [ // ... will toggle the visibility of this child 'one_child_of_a'
            // 'one_child_of_a' will be shown if 'parent_field_a' is set to one of the following values
            'value_of_the_parent',
            'another_value_of_the_parent'
        ],
        // You can use '+' in the list of values to always show the field for any parent value
        // With '+', if the parent is set to '' or is empty, the child field will be hidden
        // It will be shown for any of the parent value not null or empty
        'another_child_field': ['+']
    },
    'parent_field_b': { // If the parent_field 'parent_field_b' is a checkbox
        'b_child_1': [true], // use true to show the child if 'parent_field_b' is checked
        'b_child_2': [false] // or false to show the 'b_child_2' if parent is NOT checked
    }
}
*/

lizMap.events.on({

    'uicreated': function(e){

            var formPrefix = 'jforms_view_edition';

            var dynamicFields = {
                // Example working with https://demo.lizmap.com/lizmap_3_2/index.php/view/map/?repository=demo&project=observatoire
                'type_obs': {
                    'etat_mer': ['MM', 'TORM'], // Display 'etat_mer' only if 'type_obs' in ('MM', 'TORM')
                    'mode_observation': ['+'], // always show if type_obs is set (has a value)
                    'distance_observation': ['+'], // always show if type_obs is set (has a value),
                    'individu_isole': ['MM', 'TORM', 'TORT', 'ECH']
                },

                'individu_isole':{
                    'mm_charger_photo': [false] // Hide picture field 'mm_charger_photo' if 'individu_isole' is not checked
                }
            };

            function resetEditField( jfield ){
                if( jfield.attr('type') == 'text' ){
                    document.getElementById( jfield.attr('id') ).value = null;
                }else if( jfield.attr('type')=='checkbox' ){
                    document.getElementById( jfield.attr('id') ).checked = false;
                }else if( jfield.attr('type')=='radio' ){
                    document.getElementById( jfield.attr('id') ).checked = false;
                }else{
                    document.getElementById( jfield.attr('id') ).value = '';
                }
                jfield.change();
            };

            function runDynamicField( field ){
                var val = field.val();
                var iname = field.attr('name');
                var d = dynamicFields[iname];

                var hasVal = false;
                var fid = field.attr('id');

                if( field.attr('type') == 'text' ){
                    hasVal = ( val != '' );
                }else if( field.attr('type')=='checkbox' ){
                    hasVal = document.getElementById( fid ).checked;
                    val = hasVal;
                }else if( field.attr('type')=='radio' ){
                    hasVal = document.getElementById( fid ).checked;
                    val = hasVal;
                }else{
                    hasVal = ( val != '' );
                }

                for( var t in d ){
                    var children = d[t];

                    var tog = (
                        // the value is listed in the children for t
                        $.inArray( val, children ) != -1
                        // OR the value is + ie all values possible
                        || ( children.length == 1 && children[0] == '+' && hasVal )
                    );

                    var tinput = $('#' + formPrefix + '_' + t);
                    if( !tinput.length )
                        continue;

                    tinput.parents('div.control-group:first').toggle(tog);
                    if(!tog)
                        resetEditField( tinput );

                }
            };

            function setupDynamicFields(){
                $('#jforms_view_edition input, #jforms_view_edition select').each(
                    function(){
                        var iname = $(this).attr('name');
                        if( iname
                            && iname.substring(0,1) != '_'
                            && iname in dynamicFields
                        ){
                            var field = $(this);
                            runDynamicField( field );
                            $(this).change(function(){
                                runDynamicField( field );
                            });
                        }
                    }
                )
            };


            lizMap.events.on({

                'lizmapeditionformdisplayed': function(e){
                    // Setup dynamic fields
                    setupDynamicFields();
                }
            });
    }

});

