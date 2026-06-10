# (FR) Panoramax

_English below_

Ce script permet d'afficher dans votre projet les photos provenant du projet Panoramax
(https://panoramax.openstreetmap.fr/ et/ou https://panoramax.ign.fr/) dans Lizmap Web Client. À noter qu'il n'est pas
nécessaire que votre projet soit dans une projection spécifique pour que ce script fonctionne. C'est QGIS qui se
chargera de la reprojection.

![alt text](image-3.png)

## Pré-requis

- Lizmap Web Client ≥ 3.8

- Pour des raisons de performance et du fait qu'OpenLayers ne permette pas la reprojection de tuiles vectorielles,
  **la ou les couches de données Panoramax doivent être ajoutées depuis votre projet QGIS**.
  **Un groupe ou une couche nommée Panoramax doit absolument exister dans votre projet QGIS. Sinon le script générera
  une erreur**. Vous pouvez changer le nom de votre couche/groupe mais dans ce cas il sera nécessaire de modifier
  la variable `PANORAMAX_QGIS_LAYER_NAME` du script pour qu'elle corresponde au nom de votre couche. Vous pouvez
  également modifier depuis QGIS le style de votre couche de tuiles vectorielles si vous le souhaitez.

![alt text](image.png)
![alt text](image-1.png)

## Utilisation
Deux fichiers JavaScript sont disponibles :
- **panoramax3_3.9.js** : utilise l'API V3 de Panoramax (historique, stable)
- **panoramax4_3.9.js** : utilise l'API V4 de Panoramax (Web Components, recommandé)

**Nous recommandons d'utiliser la V4** qui est plus moderne et mieux maintenue.

Pour utiliser le script Panoramax dans votre projet :
1. assurez-vous d'avoir une couche Panoramax présente dans votre projet QGIS
2. copier `panoramax3_3.9.js` ou `panoramax4_3.9.js` dans le dossier `media/js/default` de votre répertoire (ou `media/js/nom du projet`)
3. le bouton Panoramax s'affichera dans Lizmap Web Client
4. en cliquant sur ce bouton, un dock s'ouvrira affichant le visualiseur de photos
5. cliquez sur un point de la couche Panoramax sur la carte pour afficher la photo correspondante
   - une flèche directionnelle indique l'azimut de la photo
   - la carte se centre automatiquement sur le point

## Personnalisation

Si vous modifiez le nom du groupe ou de la couche Panoramax dans QGIS, vous devrez adapter la variable
`PANORAMAX_QGIS_LAYER_NAME` dans le script pour qu'elle corresponde au nom de la couche dans votre projet.

Vous pouvez également personnaliser l'apparence du bouton ou le comportement d'affichage selon vos besoins via des
ajustements dans le fichier JavaScript.

# (EN) Panoramax

This script allows you to display photos from the Panoramax project (https://panoramax.openstreetmap.fr/ and/or
https://panoramax.ign.fr/) in your Lizmap Web Client project. It is not necessary for your project to have a specific
projection for this script to work. QGIS will handle the reprojection.

![alt text](image-3.png)

## Requirements

- Lizmap Web Client ≥ 3.8

- For performance reasons and because OpenLayers does not allow the reprojection of vector tiles, **the Panoramax data
  layer(s) must be added from your QGIS project**. **A layer or group named Panoramax must exist in your QGIS project.
  Otherwise, the script will generate an error**. You can change the name of your layer/group, but in that case, you
  will need to modify the PANORAMAX_QGIS_LAYER_NAME variable in the script to match the name of your layer. You can
  also modify the vector tiles style in QGIS.

![alt text](image.png)
![alt text](image-1.png)


## Usage
Two JavaScript files are available:
- **panoramax3_3.9.js**: uses the Panoramax V3 API (legacy, stable)
- **panoramax4_3.9.js**: uses the Panoramax V4 API (Web Components, recommended)

**We recommend using V4**, which is more modern and better maintained.


To use the Panoramax script in your project:
1. ensure you have a Panoramax layer present in your QGIS project
2. copy `panoramax3_3.9.js` or `panoramax4_3.9.js` to the `media/js/default` folder of your project directory (or `media/js/project name`)
3. the Panoramax button will appear in Lizmap Web Client
4. by clicking on this button, a dock will open displaying the photo viewer
5. click on a point in the Panoramax layer on the map to display the corresponding photo
   - a directional arrow indicates the photo's azimuth
   - the map automatically centers on the point

## Customization

If you change the name of the Panoramax group or layer in QGIS, you will need to adjust the `PANORAMAX_QGIS_LAYER_NAME`
variable in the script to match the name of your layer.

You can also customize the appearance of the button or the display behavior according to your needs by making
adjustments to the JavaScript file.
