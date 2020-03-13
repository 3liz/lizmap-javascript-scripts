# Translation
In this folder there are:

* a python script to retrieve translatable strings from a QGIS project and its related .cfg file created with the lizmap plugin
* a javascript file which translate the project content in lizmapwebclient according to the browser language

The python script (get_translatable_string.py)
----------------------------------------------
This python script retrieves all possible translatable strings (layers name, groups name, layouts name, fields or aliases name, etc.) from the QGIS project and the related .cfg file. It saves a json file in which the key is the retrived string and the value should contain the translation of the string. Following an example of the json structure:

'{"original layer name": "", "Original group name": "", ..}'

The translation has to be provided manually by editing the file and putting the translated string in the double quotes.
The script has to be run from the qgis python console of the project.
It requires the .cfg file created with the lizmap plugin
