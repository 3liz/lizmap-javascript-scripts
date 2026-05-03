/*
# Afficher un panneau de légende fixe en bas de la carte

Ce script génère dynamiquement une petite fenêtre affichant une légende définie par l'utilisateur en bas de l'interface de la carte.
La légende peut présenter divers éléments cartographiques tels que des lignes, des images ou des rectangles, chacun représentant différentes caractéristiques ou catégories de la carte.

## Configuration
Vous pouvez configurer les éléments de légende et les classes qui seront affichés en modifiant le tableau `my_legend_items`.
Cette flexibilité permet d'obtenir une légende hautement personnalisable adaptée aux besoins spécifiques du projet.

## Mise en œuvre

- Ajoutez ce script sous le nom `add_hard_coded_legend_at_map_bottom.js` dans votre dossier `media/js/nom_du_projet`.

C'est une petite amélioration de :
https://github.com/m2cci-gakoum/lizmap-javascript-scripts/blob/master/library/ui/add_hard_coded_legend_at_map_bottom/add_hard_coded_legend_at_map_bottom.js

Voici la configuration des variables de la légende, que vous pouvez adapter selon les besoins de votre projet :
*/

// Initialisation des variables de configuration de la légende
var my_legend_title = "Légende";  // Titre de la légende
var my_legend_toggle_label = "Montrer/Cacher la légende";  // Texte pour le bouton de basculement pour montrer/cacher la légende
var my_legend_hide_button_label = "Cacher";  // Texte pour le bouton pour cacher la légende

// Définition des éléments à afficher dans la légende
var my_legend_items = [
  {
    code: "categorie",
    title: "",
    items: [
      {
        type: "line",
        title: "Titre",
        code: "line",
        color: "orange",  // Couleur de l'élément ligne
      },
      {
        type: "image",
        title: "Titre1",
        code: "",
        image: "http://localhost/lizmap36/lizmap/www/index.php/view/media/getMedia?repository=projetnomDuRepertoire&project=nomDuProjet&path=/media/image/image.png",  // Chemin vers l'image
      },
      {
        type: "image",
        title: "Titre2",
        code: "",
        image: "http://localhost/lizmap36/lizmap/www/index.php/view/media/getMedia?repository=projetnomDuRepertoire&project=nomDuProjet&path=/media/image/image.png",
      },
      {
        type: "image",
        title: "Titre3",
        code: "3",
        image: "http://localhost/lizmap36/lizmap/www/index.php/view/media/getMedia?repository=projetnomDuRepertoire&project=nomDuProjet&path=/media/image/image.png",
      },
      {
        type: "rectangle",
        title: "Agglomération Ville Franche",
        code: "5",
        color: "white",
        background: "orange",  // Couleur de fond pour l'élément rectangle
      },
    ],
  },
];

// Écouteur d'événements pour la création de l'interface utilisateur
lizMap.events.on({
  uicreated: function (e) {
    // Construction du HTML pour la légende
    var legend_html = '<div class="my-legend-container">';
    legend_html += '<span id="my-legend-title">' + my_legend_title + "</span>";
    legend_html += '<button id="my-legend-toggle" class="btn btn-mini pull-right" title="' + my_legend_toggle_label + '">';
    legend_html += my_legend_hide_button_label;
    legend_html += "</button>";
    legend_html += '<div id="my-legend-items-container">';

    // Construction du contenu de la légende
    my_legend_items.forEach(function (legend) {
      legend_html += '<div id="my-legend-' + legend.code + '" class="my-legend-item">';
      legend_html += "<h4>" + legend.title + "</h4>";
      legend_html += '<table class="my-legend-table"><tbody>';

      legend.items.forEach(function (item) {
        legend_html += "<tr><td>";
        if (item.type === "image") {
          legend_html += '<img src="' + item.image + '" alt="' + item.title + '" width="50" height="50">';
        } else if (item.type === "rectangle") {
          legend_html += '<div style="width: 20px; height: 20px; background-color: ' + item.background + ';"></div>';
        } else if (item.type === "line") {
          legend_html += '<hr style="height: 3px; border: none; background-color: ' + item.color + ';">';
        }
        legend_html += "</td><td>" + item.title + "</td></tr>";
      });

      legend_html += "</tbody></table></div>";
    });

    legend_html += "</div></div>";

    // Ajout de la légende au contenu de la carte
    $("#map-content").append(legend_html);

    // Gestion des clics sur les éléments pour basculer la visibilité des éléments de la légende
    $("#my-legend-title, #my-legend-toggle").click(function () {
      $("#my-legend-items-container").toggle();  // Basculement de la visibilité des éléments de la légende
      $("#my-legend-toggle").toggle();  // Basculement de la visibilité du bouton de basculement
    });
  },
});
