lizMap.events.on({
  lizmappopupdisplayed: () => {

    // Veuillez indiquer le nom de la couche contenant les parcelles ainsi
    // que le nom de la colonne contenant l'identifiant de la parcelle
    const NOM_COUCHE_PARCELLE = 'Parcelles';
    const NOM_ATTRIBUT_ID_PARCELLE = 'geo_parcelle';

    const layerFidNode = document.querySelector(`input[value^="${NOM_COUCHE_PARCELLE}_"].lizmap-popup-layer-feature-id`);

    if (layerFidNode) {
      const featureId = layerFidNode.value.split('.')[1];

      fetch(lizUrls.wms, {
        method: "POST",
        body: new URLSearchParams({
          repository: lizUrls.params.repository,
          project: lizUrls.params.project,
          SERVICE: 'WFS',
          REQUEST: 'GetFeature',
          VERSION: '1.0.0',
          FEATUREID: NOM_COUCHE_PARCELLE + '.' + featureId,
          PROPERTYNAME: NOM_ATTRIBUT_ID_PARCELLE,
          OUTPUTFORMAT: 'GeoJSON'
        })
      }).then(function (response) {
        return response.json();
      }).then(response => {
        const parcelleId = response.features[0].properties[NOM_ATTRIBUT_ID_PARCELLE];
        // Remplacement des 0 dans le préfixe de la section par des espaces
        let parcelleIdOxalis = '';

        for (let i = 0; i < parcelleId.length; i++) {
          if ((i == 6 || i == 7 || i == 8) && parcelleId.charAt(i) === '0') {
            parcelleIdOxalis += ' ';
          } else {
            parcelleIdOxalis += parcelleId.charAt(i);
          }
        }

        OP_RechercherDossiersParcelles("", parcelleIdOxalis);
      });
    }
  },

  uicreated: () => {

    const oxalisContent = `
        <script type="text/javascript">
        
        </script>

        <!-- Formulaire de saisie du code d'appairage OPERIS -->
        <div id="opws_pairform" class="opws_modal">
          <div class="opws_modalcontent opws_animate">
            <div class="opws_closecontainer">
              <span onclick="noPair();" class="opws_close" title="Annuler et fermer">&times;</span>
            </div>
    
            <div class="opws_titrecontainer">
              <label><b>Veuillez vous appairer à </b></label><label id="opws_pairapplication"><b>OPERIS</b></label>
            </div>
          
            <div class="opws_container">
              <label for="opws_code"><b>Code d'appairage</b></label>
              <input type="text" class="opws_input" placeholder="Veuillez saisir le code d'appairage" id="opws_code" required>
    
              <div><p></div>
          
              <!--<button type="submit">Valider</button>-->
              <button class="opws_button" onclick="responsePair(document.getElementById('opws_code').value);">Valider</button>
              <label id="opws_pairerreur" class="opws_error">
            </div>
          </div>
        </div>


        <input type="button" id="btAppairage" value="Appairer" onClick="requestPair();">
        `;

    lizMap.addDock('Oxalis', 'Oxalis', 'dock', oxalisContent, ' icon-th-large');

  }
});
