/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

lizMap.events.on({
	'lizmappopupdisplayed': function(e) {	
		//get table parent if h4 = Dossiers des Géomètres Experts
		let popupGE = $('#popupcontent .lizmapPopupContent').find('h4:contains("Dossiers des Géomètres Experts")').parent();

		if(popupGE.length > 0){
			$('.lizmapPopupContent .table').hide();			
			$('.lizmapPopupContent .table > tbody  > tr').each(function(index, tr) {
				if(this.firstElementChild.textContent === 'enr_api'){
					 let enr_api = this.lastElementChild.textContent ;
					 let geoFoncierAPIurl = `https://api2.geofoncier.fr/api/dossiersoge/dossiers/mini/${enr_api}`;
					 $('.lizmapPopupContent .lizmapPopupDiv .table').empty();	
					 $('.lizmapPopupContent .lizmapPopupDiv .table').show();
					 //get geofoncier info based on enr_api	
					 $.get( geoFoncierAPIurl ).done(function(data) {			 	
					 	let html = "";
					 	html = `
					 		<tr><th>Cabinet GE</th><td>${data.nom_cabcreateur}</td></tr>
					 		<tr><th>Géomètre</th><td>${data.nom_gecreateur}</td></tr>
					 		<tr><th>Date du dossier</th><td>${data.enr_date_dossier}</td></tr>
					 	`;					 	
					 	if(data.dmpc_ref.length>0){
					 		aDMPC = [];
					 		$.each(data.dmpc_ref, function(i, dmpc){
					 			aDMPC.push(dmpc.dmpc_ref);	
					 		});					 		
					 		html = html + `<tr><th>Ref DMPC</th><td>${aDMPC.join()}</td></tr>`;
					 	}					 	
					 	if(data.operation.length>0){			 		
					 		html = html + `<tr><th>Operation</th><td>${data.operation.join()}</td></tr>`;
					 	}					 	
					 	html = html + `<tr><th>Contact</th><td><a target="_blank" href="${data.contact_cabdetenteur}">Page du cabinet GE</a></td></tr>`;					 	
					 	$('.lizmapPopupContent .lizmapPopupDiv .table').append(html);				 	
					 });
				}				
			});
		}		
	}	
});
