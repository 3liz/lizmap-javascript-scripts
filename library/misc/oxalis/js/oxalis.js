lizMap.events.on({

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

    },
    lizmappopupdisplayed: (evt) => {
      const identifiantUniqueTH = Array.from(document.getElementById(evt.containerId).querySelectorAll('.lizmapPopupSingleFeature th'))
        .filter(el => el.textContent === 'Identifiant unique');
        const parcelleId = identifiantUniqueTH[0].nextElementSibling.innerText;

        OP_RechercherDossiersParcelles("", parcelleId);
    }

});
