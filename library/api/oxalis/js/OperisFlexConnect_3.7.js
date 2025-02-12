/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

APPLI_DDC = "DDC";
APPLI_OXALIS = "Oxalis";
APPLI_TULIPE = "Tulipe";

//================== Variables de paramétrage pour le connecteur websocket
var websocket_applis_param = '{"APPLIS":[{"NOM":"Oxalis","URL":""},{"NOM":"DDC","URL":""},{"NOM":"Tulipe","URL":""}]}';
var websocket_activer = 1;
var websocket_timer = 60000;
var websocket_timer_activer = 0;
var websocket_debug = 0;

//------------------ Objet JSOperisFlexConnect
	
/**
 * Objet JSOperisFlexConnect à utiliser pour communiquer avec les produits OPERIS
 * 
 * @param _oOperisFlexConnect Objet Flex OperisFlexConnect à utiliser pour la communication. Ignoré si
 * 							  websocket_activer=1 et que le navigateur prend en charge les websockets
 * 
 */
function JSOperisFlexConnect(_oOperisFlexConnect) {

    /**
     * Objet Flex OperisFlexConnect ou websocket
     */
	if (websocket_activer == 1 && window.WebSocket) {
		if (websocket_appli == null) {
			try {
				websocket_applis = (JSON.parse(websocket_applis_param)).APPLIS;
				if (Array.isArray(websocket_applis) && websocket_applis.length > 0) {
					// Le cas échéant, mémorisation du nom de l'application OPERIS unique
					if (websocket_applis.length == 1) {
						nom_appli = websocket_applis[0].NOM;
					}
					wsConnecterAppli();
				} else {
					if (websocket_debug == 1)
						alert("Le connecteur websocket n'a pas pu s'initialiser");			
				}
			} catch (e) {
				if (websocket_debug == 1)
					alert("Le connecteur websocket n'a pas pu s'initialiser :\n" + e);	
			}
		}			
	} else {
		websocket_activer = 0;
		this.__oOperisFlexConnect = _oOperisFlexConnect;
	}

    /**
     * Version d'OperisFlexConnect
     */
    this.__version = "3.1.0 (10/06/2021)";

}

//------------------ Attributs et fonctions de l'objet JSOperisFlexConnect

/**
 * Identifiant d'application OPERIS 
 */
JSOperisFlexConnect.prototype.APPLICATION_OPERIS = "AppliOperis";


/**
 * Liste des fonctions SIG appelées par OPERIS
 */
JSOperisFlexConnect.prototype.FONCTION_SIG_CADRER = "SIG_Cadrer";
JSOperisFlexConnect.prototype.FONCTION_SIG_COORDONNEESCADRER = "SIG_CoordonneesCadrer";
JSOperisFlexConnect.prototype.FONCTION_SIG_IMPLANTERDOSSIER = "SIG_ImplanterDossier";
JSOperisFlexConnect.prototype.FONCTION_SIG_IMPRIMERDOSSIER = "SIG_ImprimerDossier";
JSOperisFlexConnect.prototype.FONCTION_SIG_LANCERIMC = "SIG_LancerIMC";
JSOperisFlexConnect.prototype.FONCTION_SIG_RECHERCHERREGLEMENTS = "SIG_RechercherReglements";
JSOperisFlexConnect.prototype.FONCTION_SIG_GETIMAGE = "SIG_GetImage";
JSOperisFlexConnect.prototype.FONCTION_SIG_SETUSERINFO = "SIG_SetUserInfo";

// DDC
JSOperisFlexConnect.prototype.FONCTION_SIG_CADRERDOSSIERS = "SIG_CadrerDossiers";
JSOperisFlexConnect.prototype.FONCTION_SIG_MAJREGLEMENTS = "SIG_MiseAJourReglementsDossierParcelles";

/**
 * Liste des notifications envoyées par le serveur websocket
 */
JSOperisFlexConnect.prototype.NOTIFICATION_WS_CONNEXION= "WS_Connexion";
JSOperisFlexConnect.prototype.NOTIFICATION_WS_DECONNEXION= "WS_Deconnexion";
JSOperisFlexConnect.prototype.NOTIFICATION_WS_NONDISTRIBUE= "WS_NonDistribue";
 
/**
 * Liste des fonctions OPERIS appelées par le SIG
 */
JSOperisFlexConnect.prototype.FONCTION_OPERIS_RETOUR_IMPRIMER_DOSSIER = "SIG_ImprimerDossier";
JSOperisFlexConnect.prototype.FONCTION_OPERIS_RETOUR_LANCER_IMC = "SIG_LancerIMC";
JSOperisFlexConnect.prototype.FONCTION_OPERIS_ECOUTER_JAVASCRIPT = "SIG_EcouterJavascript";
JSOperisFlexConnect.prototype.FONCTION_OPERIS_RETOUR_RECHERCHER_REGLEMENTS = "SIG_RechercherReglements";
JSOperisFlexConnect.prototype.FONCTION_OPERIS_RETOUR_SETUSERINFO= "SIG_SetUserInfo";
JSOperisFlexConnect.prototype.FONCTION_OPERIS_RETOUR_GETIMAGE= "SIG_GetImage";
JSOperisFlexConnect.prototype.FONCTION_RECHERCHER_DOSSIERS_PARCELLES = "opeConnectRechercherDossiersParcelles";
JSOperisFlexConnect.prototype.FONCTION_OPERIS_EXIT = "EXIT";

// DDC
JSOperisFlexConnect.prototype.FONCTION_DDC_RETOUR_IMPRIMER_DOSSIER = "ddcConnectRetourImpressionDossier";
JSOperisFlexConnect.prototype.FONCTION_DDC_RETOUR_LANCER_IMC = "ddcConnectRetourLancerIMC";
JSOperisFlexConnect.prototype.FONCTION_DDC_RECHERCHER_DOSSIERS_PARCELLES = "ddcConnectRechercherDossiersParcelles";
JSOperisFlexConnect.prototype.FONCTION_DDC_AFFICHER_FICHE_PARCELLE = "ddcConnectAfficherFicheParcelle";
JSOperisFlexConnect.prototype.FONCTION_DDC_AFFICHER_FICHE_DOSSIER = "ddcConnectAfficherFicheDossier";
JSOperisFlexConnect.prototype.FONCTION_VISDGI_AFFICHER_RELEVE_PROPRIETE = "ddcConnectAfficherRelevePropriete";
JSOperisFlexConnect.prototype.FONCTION_PLU_MAJ_REGLEMENT_PARCELLE = "ddcConnectRetourMajReglementsParcelle";
JSOperisFlexConnect.prototype.FONCTION_PLU_MAJ_REGLEMENT_PARCELLE_DEBUT = "PLU_MajReglementsParcelle_debut";
JSOperisFlexConnect.prototype.FONCTION_PLU_MAJ_REGLEMENT_PARCELLE_FIN = "PLU_MajReglementsParcelle_fin";

// VISDGI
JSOperisFlexConnect.prototype.FONCTION_VISDGI_RECHERCHER_PARCELLES = "ddcConnectRechercherParcelles";

/**
 * Préfixe des messages d'erreur
 */
JSOperisFlexConnect.prototype.ERREUR_PREFIXE = "Erreur : ";

/**
 * Message d'erreur lorsque l'objet OperisFlexConnect n'est pas défini
 */
JSOperisFlexConnect.prototype.MESSAGE_ERREUR_OPERIS_FLEX_CONNECT_INCONNU = JSOperisFlexConnect.prototype.ERREUR_PREFIXE + "L'objet OperisFlexConnect n'est pas défini"; 

/**
 * Code d'erreur lorsque l'objet OperisFlexConnect n'est pas défini
 */
JSOperisFlexConnect.prototype.CODE_ERREUR_OPERIS_FLEX_CONNECT_INCONNU = -1000; 

/**
 * Vérifications avant le lancement d'une fonction
 * 
 * @param _application Identifiant de l'application
 * @param _message     Potentiel message d'erreur
 * 
 */
JSOperisFlexConnect.prototype.preVerifications = function (_application, _message) {

    // Vérification de la présence de l'objet OperisFlexConnect ou WebSocket    
    if (this.__oOperisFlexConnect == null && websockets.length == 0) {
        _message = JSOperisFlexConnect.MESSAGE_ERREUR_OPERIS_FLEX_CONNECT_INCONNU;
        return JSOperisFlexConnect.CODE_ERREUR_OPERIS_FLEX_CONNECT_INCONNU;
    }
    
    _message = null;
    return 0;
    
}

//================== Fonctions OPERIS appelées par le SIG (JS -> OPERIS)

/**
 * Appel de l'application OPERIS : RetourImprimerDossier
 * 
 * @param _url URL de l'image retournée
 * @param _codeErreur Code d'erreur (0 si OK)
 * @param _message Potentiel message d'erreur
 * @param _requeteID Identifiant de la requête (utilisé par OperisFlexEngine)
 * @param _to Destinataire de la requête (utilisé par le serveur websocket pour distribuer le message)
 * @param _websocket Client websocket (utilisé par le connecteur)
 */
JSOperisFlexConnect.prototype.OPERIS_RetourImprimerDossier = function (_url, _codeErreur, _message, _requeteID, _to, _websocket) {

    // Vérifications préalables     
    _codeErreur = this.preVerifications(this.APPLICATION_OPERIS, _message);
    if (_codeErreur < 0)
       return;

	if (websocket_activer == 1) {
		wsEnvoyer(toJSON(this.FONCTION_OPERIS_RETOUR_IMPRIMER_DOSSIER, [_url], _requeteID, _to), _websocket);
	} else {
		this.__oOperisFlexConnect.AppelFonction(this.FONCTION_OPERIS_RETOUR_IMPRIMER_DOSSIER, [_url]);
	}
}

/**
 * Appel de l'application OPERIS : RetourlancerIMC
 * 
* @param _xml résultat xml de l'IMC
 * @param _url URL du résultat xml de l'IMC
 * @param _codeErreur Code d'erreur (0 si OK)
 * @param _message Potentiel message d'erreur
 * @param _requeteID Identifiant de la requête (utilisé par OperisFlexEngine)
 * @param _to Destinataire de la requête (utilisé par le serveur websocket pour distribuer le message
 * @param _websocket Client websocket (utilisé par le connecteur)
 */
JSOperisFlexConnect.prototype.OPERIS_RetourLancerIMC = function (_xml, _url, _codeErreur, _message, _requeteID, _to, _websocket) {

    // Vérifications préalables     
    _codeErreur = this.preVerifications(this.APPLICATION_OPERIS, _message);
    if (_codeErreur < 0)
       return;

	if (websocket_activer == 1) {
		wsEnvoyer(toJSON(this.FONCTION_OPERIS_RETOUR_LANCER_IMC, [_xml, _url], _requeteID, _to), _websocket);
	} else {   
		this.__oOperisFlexConnect.AppelFonction(this.FONCTION_OPERIS_RETOUR_LANCER_IMC, [_xml, _url]);
	}
}

/**
 * Appel de l'application OPERIS : RechercherDossiersParcelles
 * @param _dossiers  Liste des dossiers à rechercher (séparés par des ;)
 * @param _parcelles Liste des parcelles à rechercher (séparées par des ;)
 * @param _codeErreur Code d'erreur (0 si OK)
 * @param _message Potentiel message d'erreur
 */
JSOperisFlexConnect.prototype.OPERIS_RechercherDossiersParcelles = function (_dossiers, _parcelles, _codeErreur, _message) {

    // Vérifications préalables     
    _codeErreur = this.preVerifications(this.APPLICATION_OPERIS, _message);
    if (_codeErreur < 0)
       return;

	this.AppelFonction(this.FONCTION_OPERIS_ECOUTER_JAVASCRIPT, [this.FONCTION_RECHERCHER_DOSSIERS_PARCELLES, _dossiers, _parcelles], [APPLI_OXALIS, APPLI_TULIPE]);
}

/**
 * Appel de l'application OPERIS : RetourRechercherReglements
 * 
 * @param _xml contenu xml des règlements retournés
 * @param _codeErreur Code d'erreur (0 si OK)
 * @param _message Potentiel message d'erreur
 * @param _requeteID Identifiant de la requête (utilisé par OperisFlexEngine)
 * @param _to Destinataire de la requête (utilisé par le serveur websocket pour distribuer le message
 * @param _websocket Client websocket (utilisé par le connecteur)
 */
JSOperisFlexConnect.prototype.OPERIS_RetourRechercherReglements = function (_xml, _codeErreur, _message, _requeteID, _to, _websocket) {

    // Vérifications préalables     
    _codeErreur = this.preVerifications(this.APPLICATION_OPERIS, _message);
    if (_codeErreur < 0)
       return;

	if (websocket_activer == 1) {
		wsEnvoyer(toJSON(this.FONCTION_OPERIS_RETOUR_RECHERCHER_REGLEMENTS, [_xml], _requeteID, _to), _websocket);
	} else {    
		this.__oOperisFlexConnect.AppelFonction(this.FONCTION_OPERIS_RETOUR_RECHERCHER_REGLEMENTS, [_xml]);
	}
}

/**
 * Appel de l'application OPERIS : RetourSetUserInfo
 * 
 * @param _user Le nom de l'utilisateur connecté (permet à l'application operis de savoir que GEO est bien là)
 * @param _codeErreur Code d'erreur (0 si OK)
 * @param _message Potentiel message d'erreur
 * @param _requeteID Identifiant de la requête (utilisé par OperisFlexEngine)
 * @param _to Destinataire de la requête (utilisé par le serveur websocket pour distribuer le message
 * @param _websocket Client websocket (utilisé par le connecteur)
 */
JSOperisFlexConnect.prototype.OPERIS_RetourSetUserInfo = function (_user, _codeErreur, _message, _requeteID, _to, _websocket) {

    // Vérifications préalables     
    _codeErreur = this.preVerifications(this.APPLICATION_OPERIS, _message);
    if (_codeErreur < 0)
       return;

	if (websocket_activer == 1) {
		wsEnvoyer(toJSON(this.FONCTION_OPERIS_RETOUR_SETUSERINFO, [_user], _requeteID, _to), _websocket);
	} else {    
		this.__oOperisFlexConnect.AppelFonction(this.FONCTION_OPERIS_RETOUR_SETUSERINFO, [_user]);
	}
}

/**
 * Appel de l'application OPERIS : RetourGetImage
 * 
 * @param _base64 base64 de l'image retournée
 * @param _codeErreur Code d'erreur (0 si OK)
 * @param _message Potentiel message d'erreur
 * @param _requeteID Identifiant de la requête (utilisé par OperisFlexEngine)
 * @param _to Destinataire de la requête (utilisé par le serveur websocket pour distribuer le message
 * @param _websocket Client websocket (utilisé par le connecteur)
 */
JSOperisFlexConnect.prototype.OPERIS_RetourGetImage = function (_base64, _codeErreur, _message, _requeteID, _to, _websocket) {

    // Vérifications préalables     
    _codeErreur = this.preVerifications(this.APPLICATION_OPERIS, _message);
    if (_codeErreur < 0)
       return;

	if (websocket_activer == 1) {
		wsEnvoyer(toJSON(this.FONCTION_OPERIS_RETOUR_GETIMAGE, [_base64], _requeteID, _to), _websocket);
	} else {    
		this.__oOperisFlexConnect.AppelFonction(this.FONCTION_OPERIS_RETOUR_GETIMAGE, [_base64]);
    }
}

/**
 * Appel de l'application OPERIS : DemanderIdentifiantSession
 * @param _codeErreur Code d'erreur (0 si OK)
 * @param _message Potentiel message d'erreur
 */
JSOperisFlexConnect.prototype.OPERIS_DemanderIdentifiantSession = function (_codeErreur, _message) {

    // Vérifications préalables     
    _codeErreur = this.preVerifications(this.APPLICATION_OPERIS, _message);
    if (_codeErreur < 0)
       return;

	this.AppelFonction(this.FONCTION_OPERIS_ECOUTER_JAVASCRIPT, ["opeConnectdemanderIdentifiantSession"]);
}

/**
 * Appel de l'application OPERIS : Exit
 * 
 * @param _codeErreur Code d'erreur (0 si OK)
 * @param _message Potentiel message d'erreur
 */
JSOperisFlexConnect.prototype.OPERIS_Exit = function (_codeErreur, _message) {

    // Vérifications préalables     
    _codeErreur = this.preVerifications(this.APPLICATION_OPERIS, _message);
    if (_codeErreur < 0)
       return;

	if (websocket_activer == 1) {
		for (var i = 0; i < websockets.length; i++) {
			if (websockets[i].websocket != null && websockets[i].websocket.readyState == WebSocket.OPEN) {
				websockets[i].websocket.close(1000, this.FONCTION_OPERIS_EXIT);
			}
		}
	} else {
		this.__oOperisFlexConnect.AppelFonction(this.FONCTION_OPERIS_EXIT, []);
	}
}

/**
 * Appel de l'application DDC : RetourImprimerDossier
 * 
 * @param _dossier Objet Dossier
 * @param _parcelles Tableau des parcelles
 * @param _url URL de l'image retournée
 * @param _idImage
 * @param _echelle
 * @param _largeur
 * @param _hauteur
 * @param _codeErreur Code d'erreur (0 si OK)
 * @param _message Potentiel message d'erreur
 * @param _requeteID Identifiant de la requête (utilisé par OperisFlexEngine)
 * @param _to Destinataire de la requête (utilisé par le serveur websocket pour distribuer le message)
 * @param _websocket Client websocket (utilisé par le connecteur)
 */
JSOperisFlexConnect.prototype.DDC_RetourImprimerDossier = function (_dossier, _parcelles, _url, _idImage, _echelle, _largeur,_hauteur, _codeErreur, _message, _requeteID, _to, _websocket) {

    // Vérifications préalables     
    _codeErreur = this.preVerifications(this.APPLICATION_OPERIS, _message);
    if (_codeErreur < 0)
       return;
	
	if (websocket_activer == 1) {
		wsEnvoyer(toJSON(this.FONCTION_DDC_RETOUR_IMPRIMER_DOSSIER, [_dossier, _parcelles, _url, _idImage, _echelle, _largeur,_hauteur], _requeteID, _to), _websocket);
	} else {
		alert("Fonctionnalité non supportée");
	}
}

/**
 * Appel l'application DDC : RetourLancerIMC
 * 
 * @param _xml XML retourné par Arcopole
 * @param _urlxml url de l'XML retourné par Arcopole
 * @param _dossier Objet Dossier concerné
 * @param _codeErreur Code d'erreur (0 si OK)
 * @param _message Potentiel message d'erreur
 * @param _requeteID Identifiant de la requête (utilisé par OperisFlexEngine)
 * @param _to Destinataire de la requête (utilisé par le serveur websocket pour distribuer le message)
 * @param _websocket Client websocket (utilisé par le connecteur)
 */
JSOperisFlexConnect.prototype.DDC_RetourLancerIMC = function (_xml, _urlxml, _dossier, _codeErreur, _message, _requeteID, _to, _websocket) {

    // Vérifications préalables     
    _codeErreur = this.preVerifications(this.APPLICATION_DDC, _message);
    if (_codeErreur < 0)
       return;

   	if (websocket_activer == 1) {
		wsEnvoyer(toJSON(this.FONCTION_DDC_RETOUR_LANCER_IMC, [_dossier, _xml, _urlxml], _requeteID, _to), _websocket);
	} else {
		alert("Fonctionnalité non supportée");
	}
}

/**
 * Appel de l'application DDC : RechercherDossiersParcelles
 * 
 * @param _dossiers  Tableau des dossiers à rechercher
 * @param _parcelles Tableau des parcelles à rechercher
 * @param _codeErreur Code d'erreur (0 si OK)
 * @param _message Potentiel message d'erreur
 */
JSOperisFlexConnect.prototype.DDC_RechercherDossiersParcelles = function (_dossiers, _parcelles, _codeErreur, _message) {

    // Vérifications préalables     
    _codeErreur = this.preVerifications(this.APPLICATION_OPERIS, _message);
    if (_codeErreur < 0)
       return;

    this.AppelFonction(this.FONCTION_OPERIS_ECOUTER_JAVASCRIPT, [this.FONCTION_DDC_RECHERCHER_DOSSIERS_PARCELLES, _dossiers, _parcelles], [APPLI_DDC]);
}

/**
 * Appel de l'application DDC : MajReglementsParcelle du dossier en cours, pour chaque parcelle
 * 
 * @param _parcelle Parcelle pour laquelle sont retournés les règlements
 * @param _reglements Tableau des règlements de la parcelle
 * @param _codeErreur Code d'erreur (0 si OK)
 * @param _message Potentiel message d'erreur, ou PLU_MajReglementsParcelle_debut ou PLU_MajReglementsParcelle_fin
 * 				   pour indiquer le début ou la fin de l'envoi des règlements du dossier
 * @param _requeteID Identifiant de la requête (utilisé par OperisFlexEngine)
 * @param _to Destinataire de la requête (utilisé par le serveur websocket pour distribuer le message)
 * @param _websocket Client websocket (utilisé par le connecteur) 
 */
JSOperisFlexConnect.prototype.PLU_MajReglementsParcelle = function (_parcelle, _reglements, _codeErreur, _message, _requeteID, _to, _websocket) {

    // Vérifications préalables     
    _codeErreur = this.preVerifications(this.APPLICATION_DDC, _message);
    if (_codeErreur < 0)
       return;

   	if (websocket_activer == 1) {
		if (_message == this.FONCTION_PLU_MAJ_REGLEMENT_PARCELLE_DEBUT) {
			wsEnvoyer(toJSON(this.FONCTION_OPERIS_ECOUTER_JAVASCRIPT, [this.FONCTION_PLU_MAJ_REGLEMENT_PARCELLE_DEBUT], _requeteID, _to), _websocket);
		} else if (_message == this.FONCTION_PLU_MAJ_REGLEMENT_PARCELLE_FIN) {
			wsEnvoyer(toJSON(this.FONCTION_OPERIS_ECOUTER_JAVASCRIPT, [this.FONCTION_PLU_MAJ_REGLEMENT_PARCELLE_FIN], _requeteID, _to), _websocket);
		} else {
			wsEnvoyer(toJSON(this.FONCTION_OPERIS_ECOUTER_JAVASCRIPT, [this.FONCTION_PLU_MAJ_REGLEMENT_PARCELLE, _parcelle, _reglements], _requeteID, _to), _websocket);
		}
	} else {
		alert("Fonctionnalité non supportée");
	}	
}

/**
 * Appel de l'application DDC : AfficherFicheParcelle
 * 
 * @param _parcelle Parcelle dont on demande la fiche
 * @param _codeErreur Code d'erreur (0 si OK)
 * @param _message Potentiel message d'erreur
 */
JSOperisFlexConnect.prototype.DDC_AfficherFicheParcelle = function (_parcelle, _codeErreur, _message) {

    // Vérifications préalables     
    _codeErreur = this.preVerifications(this.APPLICATION_OPERIS, _message);
    if (_codeErreur < 0)
       return;

	this.AppelFonction(this.FONCTION_OPERIS_ECOUTER_JAVASCRIPT, [this.FONCTION_DDC_AFFICHER_FICHE_PARCELLE, _parcelle], [APPLI_DDC]);
}

/**
 * Appel de l'application DDC : AfficherFicheDossier
 * 
 * @param _dossier Dossier dont on demande la fiche
 * @param _codeErreur Code d'erreur (0 si OK)
 * @param _message Potentiel message d'erreur
 */
JSOperisFlexConnect.prototype.DDC_AfficherFicheDossier = function (_dossier, _codeErreur, _message) {

    // Vérifications préalables     
    _codeErreur = this.preVerifications(this.APPLICATION_DDC, _message);
    if (_codeErreur < 0)
       return;
    
	this.AppelFonction(this.FONCTION_OPERIS_ECOUTER_JAVASCRIPT, [this.FONCTION_DDC_AFFICHER_FICHE_DOSSIER, _dossier], [APPLI_DDC]);
}

/**
 * Appel de l'application VISDGI : RechercherParcelles
 * 
 * @param _parcelles Liste des parcelles à rechercher (séparateur ;)
 * @param _codeErreur Code d'erreur (0 si OK)
 * @param _message Potentiel message d'erreur
 */
JSOperisFlexConnect.prototype.VISDGI_RechercherParcelles = function (_parcelles, _codeErreur, _message) {

    // Vérifications préalables     
    _codeErreur = this.preVerifications(this.APPLICATION_VISDGI, _message);
    if (_codeErreur < 0)
       return;

    this.AppelFonction(this.FONCTION_OPERIS_ECOUTER_JAVASCRIPT, [this.FONCTION_VISDGI_RECHERCHER_PARCELLES, _parcelles], [APPLI_DDC]);
}

/**
 * Appel de l'application VISDGI : RelevePropriete
 * 
 * @param _parcelle Parcelle dont on demande le relevé de propriété
 * @param _codeErreur Code d'erreur (0 si OK)
 * @param _message Potentiel message d'erreur
 */
JSOperisFlexConnect.prototype.VISDGI_AfficherRelevePropriete = function (_parcelle, _codeErreur, _message) {

    // Vérifications préalables     
    _codeErreur = this.preVerifications(this.APPLICATION_VISDGI, _message);
    if (_codeErreur < 0)
       return;

    this.AppelFonction(this.FONCTION_OPERIS_ECOUTER_JAVASCRIPT, [this.FONCTION_VISDGI_AFFICHER_RELEVE_PROPRIETE, _parcelle], [APPLI_DDC]);
}

/**
 * Appel de l'application OPERIS : fonction intermédiaire au cas où les partenaires
 * appelaient directement la fonction AppelFonction du swf (et non pas OPERIS_RechercherDossiersParcelles)
 * @param _fonction				Nom de la fonction à exécuter
 * @param _param				Tableau des paramètres à transmettre à la fonction
 * @param _appliDestinataire	Tableau contenant les noms des applications destinataires (envoi à toutes les applications si non renseigné) //DDC 
 */
JSOperisFlexConnect.prototype.AppelFonction = function (_fonction, _param, _appliDestinataire) {
	if (websocket_activer == 1) {
		wsEnvoyer(toJSON(_fonction, _param), null, _appliDestinataire);
	} else {
		this.__oOperisFlexConnect.AppelFonction(_fonction, _param);
	}	
}

//================== Fonctions SIG appelées par OPERIS (OPERIS -> JS) ou le serveur websocket

/**
 * Appel du SIG : SIG_TraiterDemande (dispatche l'ensemble des demandes à la réception d'un message)
 * 
 * @param _action Action demandée par l'application OPERIS ou notification envoyée par le serveur websocket
 * @param _parametres Paramètres liés à l'action demandée
 * @param _requeteID Identifiant de la requête (utilisé par OperisFlexEngine)
 * @param _from Expéditeur de la requête (se transforme en _to pour l'envoi des réponses à une requête)
 * @param _websocket Client websocket (utilisé par le connecteur)
 */
JSOperisFlexConnect.prototype.SIG_TraiterDemande = function (_action, _parametres, _requeteID, _from, _websocket) {
	var opWebSocket = getOpWebSocketFromUrl(_websocket.url);
	
	if (opWebSocket == null) {
		if (websocket_debug == 1)
			alert("Le connecteur websocket sig_OPERIS a rencontré une erreur :\n" + "Aucun websocket n'est à l'écoute");
		
		return;
	}
	
	if (_action == this.FONCTION_SIG_CADRER) {
		opWebSocket.cancelPair = false;
		
		if (_parametres.length == 3) {
			if (opWebSocket.application.toLowerCase() == APPLI_DDC.toLowerCase()) {
				SIG_CadrerDDC(_parametres[0], _parametres[1], _parametres[2]);
			} else {			
				SIG_Cadrer(_parametres[0], _parametres[1], _parametres[2]);
			}
		} else {
			if (websocket_debug == 1)
				alert("Le connecteur websocket sig_" + opWebSocket.application + " a rencontré une erreur :\n" + "L'action " + _action + " attend 3 paramètres (" + _parametres.length + " reçu(s))");
		}
	} else if (_action == this.FONCTION_SIG_CADRERDOSSIERS) {
		if (_parametres.length == 1) {
			SIG_CadrerDossiersDDC(_parametres[0]);		
		} else {
			if (websocket_debug == 1)
				alert("Le connecteur websocket sig_" + opWebSocket.application + " a rencontré une erreur :\n" + "L'action " + _action + " attend 1 paramètre (" + _parametres.length + " reçu(s))");
		}
	} else if (_action == this.	FONCTION_SIG_MAJREGLEMENTS) {
		if (_parametres.length == 2) {
			SIG_MiseAJourReglementsDossierParcellesDDC(_parametres[0], _parametres[1], _requeteID, _from, _websocket);		
		} else {
			if (websocket_debug == 1)
				alert("Le connecteur websocket sig_" + opWebSocket.application + " a rencontré une erreur :\n" + "L'action " + _action + " attend 2 paramètres (" + _parametres.length + " reçu(s))");
		}			
	} else if (_action == this.FONCTION_SIG_COORDONNEESCADRER) {
		opWebSocket.cancelPair = false;
		
		if (_parametres.length == 2) {
			SIG_CoordonneesCadrer(_parametres[0], _parametres[1]);
		} else {
			if (websocket_debug == 1)
				alert("Le connecteur websocket sig_" + opWebSocket.application + " a rencontré une erreur :\n" + "L'action " + _action + " attend 2 paramètres (" + _parametres.length + " reçu(s))");
		}
	} else if (_action == this.FONCTION_SIG_IMPLANTERDOSSIER) {
		opWebSocket.cancelPair = false;
		
		if (opWebSocket.application.toLowerCase() == APPLI_DDC.toLowerCase()) {
			if (_parametres.length == 2) {
				SIG_ImplanterDossierDDC(_parametres[0], _parametres[1]);
			} else {
				if (websocket_debug == 1)
					alert("Le connecteur websocket sig_" + opWebSocket.application + " a rencontré une erreur :\n" + "L'action " + _action + " attend 2 paramètres (" + _parametres.length + " reçu(s))");
			}
		} else {		
			if (_parametres.length == 3) {
				SIG_ImplanterDossier(_parametres[0], _parametres[1], _parametres[2]);
			} else {
				if (websocket_debug == 1)
					alert("Le connecteur websocket sig_" + opWebSocket.application + " a rencontré une erreur :\n" + "L'action " + _action + " attend 3 paramètres (" + _parametres.length + " reçu(s))");
			}
		}
	} else if (_action == this.FONCTION_SIG_IMPRIMERDOSSIER) {
		opWebSocket.cancelPair = false;
		
		if (opWebSocket.application.toLowerCase() == APPLI_DDC.toLowerCase()) {
			if (_parametres.length == 7) {
				SIG_ImprimerDossierDDC(_parametres[0], _parametres[1], _parametres[2], _parametres[3], _parametres[4], _parametres[5], _parametres[6], _requeteID, _from, _websocket);
			} else {
				if (websocket_debug == 1)
					alert("Le connecteur websocket sig_" + opWebSocket.application + " a rencontré une erreur :\n" + "L'action " + _action + " attend 7 paramètres (" + _parametres.length + " reçu(s))");
			}
		} else {		
			if (_parametres.length == 2 || _parametres.length == 3) {
				SIG_ImprimerDossier(_parametres[0], _parametres[1], _requeteID, _from, _websocket);
			} else {
				if (websocket_debug == 1)
					alert("Le connecteur websocket sig_" + opWebSocket.application + " a rencontré une erreur :\n" + "L'action " + _action + " attend 2 ou 3 paramètres (" + _parametres.length + " reçu(s))");
			}
		}
	} else if (_action == this.FONCTION_SIG_LANCERIMC) {
		opWebSocket.cancelPair = false;
		
		if (_parametres.length == 1) {
			if (opWebSocket.application.toLowerCase() == APPLI_DDC.toLowerCase()) {
				SIG_LancerIMCDDC(_parametres[0], _requeteID, _from, _websocket);
			} else {			
				SIG_LancerIMC(_parametres[0], _requeteID, _from, _websocket);
			}
		} else {
			if (websocket_debug == 1)
				alert("Le connecteur websocket sig_" + opWebSocket.application + " a rencontré une erreur :\n" + "L'action " + _action + " attend 1 paramètre (" + _parametres.length + " reçu(s))");
		}
	} else if (_action == this.FONCTION_SIG_RECHERCHERREGLEMENTS) {
		opWebSocket.cancelPair = false;
		
		if (_parametres.length == 1) {
			SIG_RechercherReglements(_parametres[0], _requeteID, _from, _websocket);
		} else {
			if (websocket_debug == 1)
				alert("Le connecteur websocket sig_" + opWebSocket.application + " a rencontré une erreur :\n" + "L'action " + _action + " attend 1 paramètre (" + _parametres.length + " reçu(s))");
		}
	} else if (_action == this.FONCTION_SIG_GETIMAGE) {
		opWebSocket.cancelPair = false;
		
		if (_parametres.length == 7) {
			SIG_GetImage(_parametres[0], _parametres[1], _parametres[2], _parametres[3], _parametres[4], _parametres[5], _parametres[6], _requeteID, _from, _websocket);
		} else {
			if (websocket_debug == 1)
				alert("Le connecteur websocket sig_" + opWebSocket.application + " a rencontré une erreur :\n" + "L'action " + _action + " attend 7 paramètres (" + _parametres.length + " reçu(s))");
		}
	} else if (_action == this.FONCTION_SIG_SETUSERINFO) {
		opWebSocket.cancelPair = false;
		
		if (_parametres.length == 7) {
			SIG_SetUserInfo(_parametres[0], _parametres[1], _parametres[2], _parametres[3], _parametres[4], _parametres[5], _parametres[6], _requeteID, _from, _websocket);
		} else {
			if (websocket_debug == 1)
				alert("Le connecteur websocket sig_" + opWebSocket.application + " a rencontré une erreur :\n" + "L'action " + _action + " attend 7 paramètres (" + _parametres.length + " reçu(s))");
		}
	} else if (_action == this.NOTIFICATION_WS_DECONNEXION && _parametres.length == 1 && websockets.length > 0) {
		opWebSocket.cancelPair = false;
		
		var application = _parametres[0];
		
		if (opWebSocket.application.toLowerCase() != application.toLowerCase()) {
			if (websocket_debug == 1)
				alert("Le connecteur websocket sig_" + opWebSocket.application + " a reçu un message qui ne lui est pas destiné :\n" + "Le destinataire était sig_" + application);
		}		
	} else if (_action == this.NOTIFICATION_WS_CONNEXION && _parametres.length == 2) {
		// Récupération de la clé de connexion retournée par le serveur
		var application = _parametres[0];
		var cle = _parametres[1];
		
		if (opWebSocket.application.toLowerCase() == application.toLowerCase()) {
			opWebSocket.cle = cle;
			opWebSocket.cancelPair = false;
			
			var url = getShortUrl(_websocket.url);
			setCookie("OPWS_CLESIG_" + opWebSocket.application.toUpperCase(), cle + CLE_SEPARATEUR + url, 365);

			if (websocket_debug == 1)
				alert("Le connecteur websocket sig_" + application + " a récupéré la clé de connexion :\n" + cle);	
		} else {
			if (websocket_debug == 1)
				alert("Le connecteur websocket sig_" + opWebSocket.application + " a reçu un message qui ne lui est pas destiné :\n" + "Le destinataire était sig_" + application);
		}
	} else if (_action == this.NOTIFICATION_WS_NONDISTRIBUE) {
		if (!opWebSocket.cancelPair) {
			requestPair(opWebSocket);
		}
	}
}

/**
 * Notification de déconnexion au websocket
 *
 * @param _websocket Client websocket objet de la déconnexion
 * @param _code Information sur la déconnexion : le code
 * @param _reason Information sur la déconnexion : la raison
 * @param _timestamp Information sur la déconnexion : l'horodatage
 */
JSOperisFlexConnect.prototype.WS_TraiterDeconnexion = function (_websocket, _code, _reason, _timestamp) {
	// Déconnexion normale, la clé de connexion n'est plus valide
	if (_reason == this.NOTIFICATION_WS_DECONNEXION || _reason == this.FONCTION_OPERIS_EXIT) {
		var opWebSocket = getOpWebSocketFromUrl(_websocket.url);

		if (opWebSocket != null) {
			if (websocket_timer_activer == 1) {
				clearTimeout(timeout);
				if (websocket_applis.length > 0) {
					for (var i = 0; i < websocket_applis.length; i++) {
						timer_applis.push(websocket_applis[i]);
					}
				}
				var app = {};
				app.NOM = opWebSocket.application;
				app.URL = opWebSocket.url;
				timer_applis.push(app);
				lancerTimer();
			}			

			if (websocket_debug == 1)
				alert("Le connecteur websocket sig_" + opWebSocket.application + " a été déconnecté :\nCode : " + _code + "\nRaison : " + _reason);
			
			opWebSocket.application = null;
			opWebSocket.cle = null;
			opWebSocket.url = null;
			opWebSocket.websocket = null;
		}	
	// Déconnexion inopinée => on tente une reconnexion
	} else {
		var opWebSocket = getOpWebSocketFromUrl(_websocket.url);
		if (opWebSocket) {
			tracer("Le connecteur websocket sig_" + opWebSocket.application + " a été déconnecté", _timestamp);
			timerReconnexion = setTimeout(function() {wsConnecter(opWebSocket.application, null, _websocket.url);}, RECONNEXION_TIMEOUT);
		} else {
			tracer("opWebSocket null ?");
		}
	}
}

//================== Code propre au connecteur websocket
var DEMANDE_REAPPAIRAGE = "OPWS_REAPPAIRAGE";
var ISALIVE = "ISALIVE";
var ISALIVE_TIMEOUT = 60000;
var RECONNEXION_TIMEOUT = 30000;
var tentativeConnexion = false;
var infosAppairage = null;
var opWebSocketAppairage = null;
var websocket_pairs = [];
var websocket_applis = [];
var websocket_appli = null;
var nom_appli = null;
var websockets = [];
var timer_applis = [];
var CLE_SEPARATEUR = "$";
var timerIsAlive = 0;
var timerReconnexion = 0;
var timeout = setTimeout(initialisation, 5000);

/**
 * Fonction d'initialisation au cas où l'objet JSOperisFlexConnect ne soit
 * pas créé dès le départ par le SIG
 */
function initialisation() {
	clearTimeout(timeout);
	if (websocket_activer == 1) {
		var jsOperisFlexConnect = new JSOperisFlexConnect();	
	}
}

/**
 * Fonction destinée à maintenir la connexion websocket active
 * Envoie le message ISALIVE au serveur à intervalles réguliers
 */
function isAlive() {
	wsEnvoyer(ISALIVE);
}

/**
 * Connexion au serveur websocket d'une application OPERIS
 */
 function wsConnecterAppli(_websocket_appli) {
	if (websocket_timer_activer == 1) {
		clearTimeout(timeout);
	}
	
	if (_websocket_appli) {
		websocket_appli = _websocket_appli;
	} else {
		websocket_appli = websocket_applis.shift();
	}
	
	var cookieValue = null;

	// Les informations de connexion sont lues si possible dans le cookie enregistré par l'application OPERIS
	// (ok si même navigateur + même domaine)
	cookieValue = getCookie("OPWS_CLE_" + websocket_appli.NOM.toUpperCase());
	
	// Si non trouvé
	if (cookieValue == null) {
		// Les informations de connexion sont lues si possible dans le cookie propre au connecteur
		cookieValue = getCookie("OPWS_CLESIG_" + websocket_appli.NOM.toUpperCase());
	}
	
	// Lancement de la connexion
	wsConnecter(websocket_appli.NOM, cookieValue);
 }
 
/**
 * Connexion au serveur websocket
 *
 * @param _application Nom de l'application OPERIS à laquelle se connecter
 * @param _infosConnexion Informations de connexion (clé de connexion + URL d'accès au serveur websocket)
 * @param _url Url complète de connexion au serveur websocket (cas des reconnexions)
 */
function wsConnecter(_application, _infosConnexion, _url) {
	var infosConnexion = null;
	var verification = true;
	
	if (_infosConnexion == null || _infosConnexion == "") {
		verification = false;
	} else {
		infosConnexion = _infosConnexion.split(CLE_SEPARATEUR);
		
		if (infosConnexion.length != 3) {
			verification = false;
			
			if (websocket_debug == 1)
				alert("Les informations de connexion récupérées par le connecteur websocket sig_" + _application + " sont erronées.");
		}
	}

	if (verification == true || _url != null) {
		var url = _url;
		
		if (verification == true) {
			var cle = infosConnexion[0] + CLE_SEPARATEUR + infosConnexion[1];
			var uri = infosConnexion[2];
		
			if (websocket_debug == 1) 
				alert("Le connecteur websocket sig_" + _application + " va se connecter avec la clé " + cle);
		
			var querystring = "type=sig&application=" + _application + "&cle=" + cle;
			var checksum = new String(querystring + "OPWS_SALAGE").hashcode();
			url = uri + "?" + querystring + "&controle=" + checksum;
		} else {
			tracer("Le connecteur websocket sig_" + _application + " va tenter de se reconnecter avec l'url " + url);
		}
		tentativeConnexion = true;
		websocket = new WebSocket(url, 'pont_sig');
		websocket.onopen = function(evt) { wsOnOpen(evt) };
		websocket.onclose = function(evt) { wsOnClose(evt) };
		websocket.onerror = function(evt) { wsOnError(evt) };
		websocket.onmessage = function(evt) { wsOnMessage(evt) };
	} else {
		if (websocket_timer_activer == 1) {
			var app = {};
			app.NOM = _application;
			timer_applis.push(app);
		}
		
		// Le cas échéant, on passe à l'application suivante
		if (websocket_applis.length > 0) {
			wsConnecterAppli();
		} else {
			if (timer_applis.length > 0) {
				lancerTimer();
			}
		}
	}
}

/**
 * Envoi d'un message au serveur websocket
 *
 * @param _message Message au format JSON
 * @param _websocket Client websocket envoyant le message
 * @param _appliDestinataire Tableau contenant les noms des applications destinataires du message (envoi à toutes les applications si non renseigné) 
 */
function wsEnvoyer(_message, _websocket, _appliDestinataire) {
	// Envoi à une application bien précise
	if (_websocket) {
		if (_websocket.readyState == WebSocket.OPEN) {
			_websocket.send(_message);
			if (websocket_debug == 1) {	
				var opWebSocket = getOpWebSocketFromUrl(_websocket.url);
				
				if (opWebSocket != null) {
					alert("Le connecteur websocket sig_" + opWebSocket.application + " a envoyé le message ci-dessous :\n" + _message);		
				}				
			}
		} else {
			if (websocket_debug == 1) {
				var opWebSocket = getOpWebSocketFromUrl(_websocket.url);
				
				if (opWebSocket != null) {
					alert("Le connecteur websocket sig_" +  opWebSocket.application + " n'est pas connecté");
				}				
			}
		}	
	// Envoi à toutes les applications
	} else {
		var message = null;
		var action = null;
		var param = null;
		if (_message != ISALIVE) {		
			message = JSON.parse(_message);
			action = message.ACTION;
			params = message.PARAMS;
		}
		var trouve = false;
		for (var i = 0; i < websockets.length; i++) {
			if (websockets[i].websocket != null && websockets[i].websocket.readyState == WebSocket.OPEN) {
				if (_appliDestinataire == null || (_appliDestinataire != null && _appliDestinataire.indexOf(websockets[i].application) != -1)) {
					if (_message != ISALIVE) {
						_message = toJSON(action, params, websockets[i].requeteID, websockets[i].to);
					}
					websockets[i].websocket.send(_message);
					trouve = true;
					if (websocket_debug == 1 && _message != ISALIVE)
						alert("Le connecteur websocket sig_" +  websockets[i].application + " a envoyé le message ci-dessous :\n" + _message);
				}
			}
		}		
		
		if (!trouve && timerReconnexion == 0 && _message != ISALIVE) {
			requestPair();
		// TODO else reconnexion
		}
	}
}

/**
 * Gestion de l'événement onopen de l'objet websocket
 *
 * @param _evt Evénement
 */
function wsOnOpen(_evt) {
	tentativeConnexion = false;
	infosAppairage = null;
	
	// Cas reconnexion
	var opWebSocket = getOpWebSocketFromUrl(_evt.currentTarget.url);
	if (opWebSocket != null) {
		opWebSocket.websocket = _evt.currentTarget;
		opWebSocket.requeteID = "";
		opWebSocket.to = "";
		opWebSocket.cancelPair = false;	
		tracer("Le connecteur websocket sig_" + opWebSocket.application + " est connecté");
	// Cas nouvelle connexion
	} else {
		opWebSocket = new OpWebSocket(_evt.currentTarget, _evt.currentTarget.url, websocket_appli.NOM, "", "", "", false);
		websockets.push(opWebSocket);
		tracer("Le connecteur websocket sig_" + websocket_appli.NOM + " est connecté");
	}
	
	clearInterval(timerIsAlive);
	timerIsAlive = setInterval(isAlive, ISALIVE_TIMEOUT);
	
	if (websocket_applis.length > 0) {
		wsConnecterAppli();
	} else {
		if (timer_applis.length > 0) {
			lancerTimer();
		}
	}

	// Background du bouton Oxalis en vert pour visualiser la connexion
	document.getElementById('button-Oxalis').classList.add('connected');
}

/**
 * Gestion de l'événement onclose de l'objet websocket
 *
 * @param _evt Evénement
 */
function wsOnClose(_evt) {
	getOperisFlexConnect().WS_TraiterDeconnexion(_evt.currentTarget, _evt.code, _evt.reason, _evt.timeStamp);

	// Background du bouton Oxalis par défaut pour visualiser la déconnexion
	document.getElementById('button-Oxalis').classList.remove('connected');
}

/**
 * Gestion de l'événement onerror de l'objet websocket
 *
 * @param _evt Evénement
 */
function wsOnError(_evt) {
	if (tentativeConnexion) {
		tentativeConnexion = false;
		
		// Uniquement s'il ne s'agissait pas d'une connexion suite à une demande de code d'appairage
		if (infosAppairage == null) {
			// On passe à l'application suivante s'il en reste
			if (websocket_applis.length > 0) {
				wsConnecterAppli();
			}
		} else {
			infosAppairage = null;
		}
	} else {
		if (websocket_debug == 1) {
			var opWebSocket = getOpWebSocketFromUrl(_evt.currentTarget.url);
			
			if (opWebSocket != null) {
				alert("Le connecteur websocket sig_" + opWebSocket.application + " a reçu l''erreur ci-dessous :\n" + _evt);		
			}
		}
	}
}

/**
 * Gestion de l'événement onmessage de l'objet websocket
 *
 * @param _evt Evénement
 */	
function wsOnMessage(_evt) {
	if (_evt.data == ISALIVE) {
		return;
	}
	
	if (websocket_debug == 1) {
		var opWebSocket = getOpWebSocketFromUrl(_evt.currentTarget.url);

		if (opWebSocket.url != null) {
			alert("Le connecteur websocket sig_" + opWebSocket.application + " a reçu le message ci-dessous :\n" + _evt.data);	
		}
	}
	
	//Analyse du message json reçu
	try {
		var message = JSON.parse(_evt.data);
		if (message) {
			var action = message.ACTION;
			var id = message.ID_REQUETE;
			var params = message.PARAMS;
			var from = message.FROM;
			getOperisFlexConnect().SIG_TraiterDemande(action, params, id, from, _evt.currentTarget);
		}		
	} catch (e) {
		if (websocket_debug == 1) {
			var opWebSocket = getOpWebSocketFromUrl(_evt.currentTarget.url);
			
			if (opWebSocket.url != null) {				
				alert("Le connecteur websocket opWebSocket.application n'a pas pu interpréter le message reçu ci-dessous :\n" + _evt.data + "\n\n" + e);	
			}
		}
	}
}

/**
 * Lance les nouvelles tentatives des connexions échouées au bout de websocket_timer millisecondes
 */
function lancerTimer() {
	websocket_applis = timer_applis;
	timer_applis = [];
	timeout = setTimeout(wsConnecterAppli, websocket_timer);
}

/**
 * Retour d'un objet XMLHttpRequest
 */	
function getXMLHttpRequest() {
	var xhr = null;

	if (window.XMLHttpRequest || window.ActiveXObject) {
		if (window.ActiveXObject) {
			try {
				xhr = new ActiveXObject("Msxml2.XMLHTTP");
			} catch(e) {
				xhr = new ActiveXObject("Microsoft.XMLHTTP");
			}
		} else {
			xhr = new XMLHttpRequest(); 
		}
	} else {
		alert("Le connecteur websocket OPERIS a rencontré une erreur : \n" + "Votre navigateur ne supporte pas l'objet XMLHTTPRequest !");
		return null;
	}

	return xhr;
}

/**
 * Envoi d'une requête XMLHttpRequest
 */
function sendXMLHttpRequest(_xhr, _type, _url, _param, _callback) {
	_xhr.open(_type, _url, true);

	if (_type == 'GET') {
		_xhr.onload = function() {
			_callback(_xhr.response);
		};
	} else if (_type == 'POST') {
		_xhr.onreadystatechange = function() {
			if (_xhr.readyState == 4 /*&& (_xhr.status == 200 || _xhr.status == 0)*/) {
				_callback(_xhr.response);
			}
		};	
		_xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	}

	_xhr.responseType = 'text';
	_xhr.send(_param);
}

/**
 * Demande d'appairage
 */
function requestPair(_opWebsocket) {
	// Une fenêtre d'appairage est déjà en cours (cas du multi-application)
	if (opWebSocketAppairage != null) {
		websocket_pairs.push(_opWebsocket);
		return;
	}
	
	opWebSocketAppairage = _opWebsocket;
	
	var application = "OPERIS";
	if (_opWebsocket) {
		application = _opWebsocket.application;
	} else {
		if (nom_appli != null) {
			application = nom_appli;
		}
	}
	
	if (document.getElementById('opws_pairform')) {
		document.getElementById("opws_pairerreur").innerHTML = "";
		document.getElementById('opws_pairapplication').innerHTML = "<b>" + application + "</b>";
		// Les informations de connexion sont lues si possible dans le cookie enregistré par l'application OPERIS
		// (ok si même navigateur + même domaine)
		cookieValue = getCookie("OPWS_CLE_" + application.toUpperCase());
		if (cookieValue == null) {
			cookieValue = "";
		}
		document.getElementById('opws_code').value = cookieValue;
		document.getElementById('opws_pairform').style.display='block';
	} else {
		code = prompt("Veuillez coller le code d'appairage fourni par l'application " + application + " :", code);
		responsePair(code);
	}
}

/**
 * Retour de la demande d'appairage (code saisi par l'utilisateur)
 */ 
function responsePair(_infosConnexion) {
	if (_infosConnexion != null) {
		infosConnexion = _infosConnexion.split(CLE_SEPARATEUR);
		
		if (infosConnexion.length == 3) {
			// Récupération du nom de l'application envoyant un code d'appairage, du code et de l'url d'accès au serveur websocket
			var application = infosConnexion[0];
			var code = infosConnexion[0] + CLE_SEPARATEUR + infosConnexion[1];
			var url = infosConnexion[2];
			
			var opWebSocket = null;
			if (opWebSocketAppairage) {
				// Connexion websocket ayant reçu la notification de non distribution
				opWebSocket = opWebSocketAppairage;
				opWebSocketAppairage = null;
			} else {
				// Recherche de l'application parmi les connexions websocket en cours
				opWebSocket = getOpWebSocketFromUrl(url, application);
			}
			
			// Une connexion correspond à l'application envoyant un code d'appairage, elle est
			// fermée puis réouverte avec les informations transmises
			if (opWebSocket != null) {
				opWebSocket.cancelPair = false;
				document.getElementById('opws_pairform').style.display='none';
				setCookie("OPWS_CLESIG_" + opWebSocket.application.toUpperCase(), _infosConnexion, 365);
				if (opWebSocket.websocket.readyState == WebSocket.OPEN) {
					wsEnvoyer(DEMANDE_REAPPAIRAGE + code, opWebSocket.websocket);
				}
			// Aucune connexion en cours ne correspond à l'application envoyant un code d'appairage,
			// un candidat à l'appairage est recherché parmi les applications paramétrées
			} else {
				var ws_appli = null;
				var deja = (getOpWebSocketFromAppli(application) != null);
				
				// Uniquement si une application portant le même nom n'est pas déjà appairée
				if (!deja) {
					websocket_applis = (JSON.parse(websocket_applis_param)).APPLIS;
					if (Array.isArray(websocket_applis) && websocket_applis.length > 0) {
						for (var i = 0; i < websocket_applis.length; i++) {
							if (websocket_applis[i].NOM.toLowerCase() == application.toLowerCase()) {
								ws_appli = websocket_applis[i];
								websocket_applis = [];
								break;
							}
						}					
					}
				}
				
				// Un candidat à l'appairage a été trouvé, on lance la connexion
				if (ws_appli != null) {
					ws_appli.cancelPair = false;
					ws_appli.URL = url;
					document.getElementById('opws_pairform').style.display='none';
					setCookie("OPWS_CLESIG_" + ws_appli.NOM.toUpperCase(), _infosConnexion, 365);
					codeAppairage = _infosConnexion;
					wsConnecterAppli(ws_appli);
				} else {
					var message = "Aucun candidat à l'appairage !";
					if (deja) {
						message = "Application déjà appairée !";
					}
					
					if (document.getElementById('opws_pairform')) {
						document.getElementById("opws_pairerreur").innerHTML = message;
					} else {					
						alert(message);
					}
				}
			}
			nextPair();
		} else {
			if (document.getElementById('opws_pairform')) {
				document.getElementById("opws_pairerreur").innerHTML = "Code erroné !";
			} else {
				alert("Code erroné !");
			}
		}
	}
}

/**
 * Annulation de la saisie du code d'appairage
 */	
function noPair() {
	if (opWebSocketAppairage) {
		// Dans le cas où des websockets sont connectés, ne plus demander
		// l'appairage à la réception d'un message de non distribution
		// Cas typique où l'utilisateur a lancé deux applications OPERIS
		// (par exemple Oxalis et Tulipe), puis en a quitté une des deux
		// => ne pas lui demander indéfiniment de se reconnecter à l'application quittée
		var cancel = false;
		for (var i = 0; i < websockets.length; i++) {
			if (websockets[i].websocket != null && websockets[i].websocket.readyState == WebSocket.OPEN && websockets[i].application.toLowerCase() != opWebSocketAppairage.application.toLowerCase()) {
				cancel = true;
				break;
			}
		}
		opWebSocketAppairage.cancelPair = cancel;
		opWebSocketAppairage = null;
	}
			
	document.getElementById('opws_pairform').style.display='none';
	nextPair();
}

/**
 * Lance les demandes d'appairage en attente
 */
function nextPair() {
	if (websocket_pairs.length > 0) {
		requestPair(websocket_pairs.shift());
	}		
}

/**
 * Hashage
 */
String.prototype.hashCode = function() {
	var hash = 0, i = 0, len = this.length;
	while ( i < len ) {
	hash  = ((hash << 5) - hash + this.charCodeAt(i++)) << 0;
	}
	return hash;
};   

/**
 * Hashage retournant une valeur positive
 */
String.prototype.hashcode = function() {
	return (this.hashCode() + 2147483647) + 1;
};

/**
 * Traduit au format JSON une action à envoyer à l'application OPERIS
 */
function toJSON(_action, _params, _requeteID, _to) {
	var json = '{"ACTION":"' + _action + '", "PARAMS":[';
	
	for (var param in _params) {
		if (json.substring(json.length - 1) != '[') {
			json = json + ',';
		}
		if (!Array.isArray(_params[param])) {
			json = json + JSON.stringify(_params[param]);
		} else {
			json = json + '[';
			
			for (var item in _params[param]) {
				if (json.substring(json.length - 1) != '[') {
					json = json + ',';
				}			
				
				json = json + JSON.stringify(_params[param][item]);
			}
			
			json = json + ']';
		}			
	}
	
	json = json + ']';
	
	if (_to) {
		json = json + ',' + '"TO":"' + _to + '"';
	}
	
	if (_requeteID) {
		json = json + ',' + '"ID_REQUETE":"' + _requeteID + '"';
	}
	
	json = json + '}';
	
	return json;
}

/**
 * Retourne la valeur d'un cookie
 */
function getCookie(_name) {
	if (document.cookie.length == 0)
		return null;

	var regSepCookie = new RegExp('(; )', 'g');
	var cookies = document.cookie.split(regSepCookie);

	for (var i = 0; i < cookies.length; i++) {
		var regInfo = new RegExp('=', 'g');
		var infos = cookies[i].split(regInfo);

		if (infos[0] == _name) {
			return unescape(infos[1]);
		}
	}
	
	return null;
}

/**
 * Stocke une valeur dans un cookie
 */
function setCookie(_name, _value, _days) {
	var expires = "";
	if (_days) {
		var date = new Date();
		date.setTime(date.getTime() + (_days*24*60*60*1000));
		expires = "; expires=" + date.toUTCString();
	}
	
	document.cookie = _name + "=" + _value + expires + "; path=/";
}

/**
 * Crée un objet de type OpWebSocket
 */
function OpWebSocket(_websocket, _url, _application, _cle, _requeteID, _to, _cancelPair) {
	this.websocket = _websocket;
	this.url = _url;
	this.application = _application;
	this.cle = _cle;
	this.requeteID = _requeteID;
	this.to = _to;
	this.cancelPair = _cancelPair;
}
 
/**
 * Retourne un objet OpWebSocket en fonction de son url
 * et éventuellement de l'application
 */
function getOpWebSocketFromUrl(_url, _application) {
	var shortUrl = false;
	var pos = _url.indexOf("?");
	if (pos == -1) {
		shortUrl = true;
	}
	
	var opWebSocket = null;
	for (var i = 0; i < websockets.length; i++) {
		var url = websockets[i].url;
		var application = getApplicationFromUrl(url);
		if (shortUrl) {
			url = getShortUrl(url);
		}

		if (_application) {
			url = url + "#" + application.toLowerCase();
			_url = _url + "#" + _application.toLowerCase();
		}
		
		if (url == _url) {
			opWebSocket = websockets[i]; 
			break;
		}
	}	
	return opWebSocket;
}
 
/**
 * Retourne un objet OpWebSocket en fonction de son application
 */
function getOpWebSocketFromAppli(_application) {
	var opWebSocket = null;
	for (var i = 0; i < websockets.length; i++) {
		if (websockets[i].application.toLowerCase() == _application.toLowerCase()) {
			opWebSocket = websockets[i]; 
			break;
		}
	}	
	return opWebSocket;
}

/**
 * Retourne une url allégée de ses paramètres de requête
 */
function getShortUrl(_url) {
	var ret = _url;
	
	var pos = ret.indexOf("?");
	if (pos != -1) {
		ret = ret.substring(0, pos);
	}
	
	return ret;
}

/**
 * Retourne un nom d'application en fonction de son url
 */
function getApplicationFromUrl(_url) {
	var ret = "";
	
	var pos = _url.indexOf("?");
	if (pos != -1) {
		var params = _url.substring(pos + 1).toLowerCase().split("&");
		for (var i = 0; i < params.length; i++) {
			if (params[i].toLowerCase().indexOf("application=") != -1) {
				pos = params[i].indexOf("=");
				if (pos != -1) {
					ret = params[i].substring(pos + 1);
				}
				break;
			}
		}
	}
	
	return ret;
}

 /**
  * Fonction qui affiche des messages de log
  */
function tracer(_message, _timestamp)
{
	if (websocket_debug == 1) 
		alert(_message);
	
	var date = null;
	if (_timestamp) {
		date = new Date(_timestamp);
		if (date.getFullYear() == 1970) {
			date = new Date();
		}
	} else {
		date = new Date();
	}
	
    var dateToString =
                ("00" + date.getDate()).slice(-2)
                + "/" + ("00" + (date.getMonth() + 1)).slice(-2)
                + "/" + date.getFullYear() + " "
                + ("00" + date.getHours()).slice(-2) + ":"
                + ("00" + date.getMinutes()).slice(-2) + ":"
                + ("00" + date.getSeconds()).slice(-2) + ":"
				+ ("00" + date.getMilliseconds()).slice(-2);
		
	console.log(dateToString + "  " + _message);
}
