# Show ValueMap description labels instead of codes in Lizmap Attribute Table
In this folder there are:

* a python script to retrieve all codes/labels from ValueMap widgets of layers in the QGIS project
* a javascript file which shows the ValueMap description labels instead of codes in Lizmap-Web-Client Attribute Table tool

## The python script (get_cod_label_widget.py)

This python script retrieves all codes and labels from columns with ValueMap widget and compiles a table layer which must be added to the QGIS project. Th table layer must be a .dbf file with three text columns named: fieldname, cod and label. This file must be created by the user and added to the QGIS project.
This python script also creates a txt file with the list on layers names with ValueMap widgets. This list can be used to add the layers name to the valueMap_in_attributeTable.js file.
The resulting table layer must be added to lizmap web client.

**NB.**
* The script has to be run from the QGIS python console of the project.
* For further details about the script see the comments in the code.

## The js script (translation.js)

This javascript script shows the description labels instead of codes for columns with ValueMap widget in the Lizmap attribute table. 
A table layer with fieldname, code and description label must be uploaded in lizMap. 
The table layer can be automatically filled running the python script get_cod_label_widget.py from the python console of the QGIS project.

**NB.**
* The javascript file has to be saved in the media/js folder.
* For further details about the script see the comments in the code.
