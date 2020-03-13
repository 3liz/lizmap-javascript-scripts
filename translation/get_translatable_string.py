## This python script retrieves all possible translatable strings (layers name, groups name,
#layouts name, fields or aliases name, etc.) from the project and the .cfg file and saves a
#json file in which the key is the retrived string and the value should contain the translation
#of the string. The translation has to be provided manually by editing the file.
#The script has to be run from the qgis python console of the project.
#It requires the .cfg file created with the lizmap plugin
import json
import os

lyrs = []
lyrs_tmp = []
title_dict = {}
abstract_dict = {}
layout_dict = {}
info_dict = {}
translation = {}
fields_dict = {}
projectInstance = QgsProject.instance()

#retrieves layers and groups titels and abstracts from the .cfg file
prjName = projectInstance.fileName() #the project .qgs file
prjPath = projectInstance.homePath() #the project .qgs folder

json_file = '{}.cfg'.format(prjName) #the .cfg file
if os.path.exists(json_file): #check if the file esists
    print('Found!')
    #reads the .cfg file
    cfg_file = open(json_file, 'r')
    json_file_reader = cfg_file.read()
    sjson = json.loads(json_file_reader)
    #gets title and abstract values from the layers key and put them in the related dictionary
    json_layers = sjson['layers']
    for key, value in json_layers.items():
        title_dict[value['title']] = ""
        if value['abstract'] != "":
            abstract_dict[value['abstract']] = ""
else:
    print('Not found!')

#retrives the names of the defined print layouts and put them in the related dictionary
projectLayoutManager = projectInstance.layoutManager()
for l in projectLayoutManager.layouts():
    layout_dict[l.name()] = ""

#retrives the title of the project defined in the Qgis server tab of the project properties
#and put it in the related dictionary
#The sub title i.e. the name of the repository cannot be retrived from the project or the .cfg file
#hence it has to be translated directly in the translation.js file
info_dict['\n          {}\n        '.format(projectInstance.readEntry('WMSServiceTitle', '')[0])] = ""

#retrieves the aliases or the fields names of all vector layer in a specified group
#and put them in the related dictionary.
#It works over the whole layer tree too. Comment the lines related to the specified group
#to retrieve the alias/fields name of all vector layers in the project
root = projectInstance.layerTreeRoot()
sel_gr = 'ConcertEaux' #the name of the desired group, to be commented if not necessary 
for child in root.children():
    if isinstance(child, QgsLayerTreeGroup):
        if child.name() == sel_gr: #to be commented if not necessary 
            for gr in child.children():
                if isinstance(gr, QgsLayerTreeGroup):
                    lyrs_tmp = gr.findLayers()
                    for lt in lyrs_tmp:
                        if isinstance(lt.layer(), QgsVectorLayer):
                            lyrs.append(lt)
                elif isinstance(gr.layer(), QgsVectorLayer):
                    lyrs.append(gr)
for l in lyrs:
    alias = l.layer().attributeAliases()
    #put the alias or the field name, if the alias is not defined, in the related dictionary
    for key, value in alias.items():
        if value != '':
            fields_dict[value] = ""
        else:
            fields_dict[key] = ""

##merge all dictionaries in a new one
translation = {**title_dict, **abstract_dict, **layout_dict, **info_dict, **fields_dict}

#creates a .json file in the media folder with the dictionary containing all strings to be translated
try:
    with open('{}/media/translation.json'.format(prjPath), 'w', encoding='utf-8') as fp:
        json.dump(translation, fp, ensure_ascii=False)
    print('The .json file has been saved')
except:
    print('Unable to save the .json file')