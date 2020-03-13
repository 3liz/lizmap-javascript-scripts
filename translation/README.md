# Translation
In this folder there are:

* a python script to retrieve translatable strings from a QGIS project and its related .cfg file created with the lizmap plugin
* a javascript file which translate the project content in lizmapwebclient according to the browser language

The python script (get_translatable_string.py)
----------------------------------------------
This python script retrieves all possible translatable strings (layers name, groups name, layouts name, fields or aliases name, etc.) from the QGIS project and the related .cfg file. It saves a json file in which the key is the retrived string and the value should contain the translation of the string. Following an example of the json structure:

*{"Original layer name": "", "Original group name": "", ..}*

The translation has to be provided manually by editing the file and putting the translated string in the double quotes. Following an example of the translated json:

*{"Original layer name": "Translated layer name", "Original group name": "Translated group name", ..}*

**NB.**
* The script has to be run from the QGIS python console of the project.
* It requires the .cfg file created with the lizmap plugin.
* For further details about the script see the comments in the code.
