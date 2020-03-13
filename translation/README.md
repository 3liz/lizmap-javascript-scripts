# Translation
In this folder there are:

* a python script to retrieve translatable strings from a QGIS project and its related .cfg file created with the lizmap plugin
* a javascript file which translate the project content in Lizmap-Web-Client according to the browser language

The python script (get_translatable_string.py)
----------------------------------------------
This python script retrieves all possible translatable strings (layers name, groups name, layouts name, fields or aliases name, etc.) from the QGIS project and the related .cfg file. It saves a json file in which the key is the retrieved string and the value should contain the translation of the string. The json file is automatically saved in the media folder. Following an example of the json structure:

*{"Original layer name": "", "Original group name": "", ..}*

The translation has to be provided manually by editing the file and putting the translated string in the double-quotes. Following an example of the translated json:

*{"Original layer name": "Translated layer name", "Original group name": "Translated group name", ..}*

**NB.**
* The script has to be run from the QGIS python console of the project.
* It requires the .cfg file created with the lizmap plugin.
* For further details about the script see the comments in the code.

The js script (translation.js)
----------------------------------------------
This javascript script translates layers and groups names, the title of the project, the print layouts names and the aliases or fileds names according to the language of the browser and using the json file created with the python script *get_translatable_string.py*
If a translated string is provided in the json file the original string is translated, otherwise the original string is shown in lizmap web client.
The json file must be saved in the media folder which needs to be available from the web. Therefore it is necessary to create 
a symbolic link on the apache directory (e.g. /var/www/html/) to the media folder in the user repository.
The javascript retrieves the original string (key) and the translated string (value) from the json file. Then for each key found in the jason check the text of the provided html selector (e.g. *$("div#header div#title h1")*). If the two strings (the one from the json file e the one found in the html page) match the text of the provided html selector is replaced with the translated string, if provided in the json file.

At the moment the script translates:
* layers and groups name in the layer tree
* layers name in the baselayer menu
* layers name in the editing tool menu
* layers name in the selection tool menu
* layouts name in the print tool menu
* layers and groups name in the attribute layer tool
* the title of the project
* layers name in the edition form
* aliases or fields name in the edition form
* layers name in the popup
* aliases or fields name in the popup
* the layer name shown in the location tool
* the content of the layer information sub-dock

**NB.**
* The javascript file has to be saved in the media/js folder.
* Change the path to the .json file according to your media folder path (using the link to media folder previously created).
* If something is not properly translated check the html selector (e.g. *$("div#header div#title h1")*), they can be different depending on your lizmap properties (e.g the container of the popup), or the json file.
* For further details about the script see the comments in the code.
