/** 
	Test script for Covid-19 project.
	@date: 2020-06-22
	@author: B. Verchère
**/

var toolName = 'timetool';
var infoDateHtml = "<div id=\""+toolName+"-date-label\" class=\"label\"><span id=\"dateValue\"></span></div>";
var legendHtml = "<div id=\""+toolName+"-legend-div\" class=\"legendGraphics\"><img id=\""+toolName+"-legend\" src=\"\"></div>";
var captureHtml = "<script src=\"https://cdnjs.cloudflare.com/ajax/libs/html2canvas/0.4.1/html2canvas.min.js\"></script>";

lizMap.events.on({
   uicreated: function(e) {
	   
	   var map = lizMap.map;
	   var urls = lizUrls;
	   var lzParams = lizUrls.params;
	   var urlPrefix = urls.media+'?'+ new URLSearchParams(lzParams).toString()+'&path=media/';
	   
	   var selectedGrp = undefined;
	   var groups = [];
	   var geoTimeLayers = [];
	   var nbLayers = 0;
	   var visibleLayerIndex = undefined;
	   var toolOpt = {opened: false, frameDuration: 3000, playing: false, loop: false, wGif: false};
	   var gif = undefined;
	   
	   // Get HTLM code of the toolbox
	   fetch(urlPrefix+'js/'+lzParams.project+'/'+toolName+'.html')
		.then(r => r.text())
		.then(r => {
			// Set API
			$('head').append(captureHtml);
			$('head').append('<script src=\"'+urlPrefix+'js/gif.js-0.2.0/gif.js\"></script>');
			// Set tool
			let icon = urlPrefix+'images/'+toolName+'20.png';
			$("#map-content #mini-dock-content").append(r);
		    lizMap.addDock(toolName,'Group Time Tool', 'mini-dock', r, '');
			$('#map-content').append(infoDateHtml);//Date value label
			$('#map-content').append(legendHtml);
			// Icons
		    $('#mapmenu li.'+toolName+' span').css('background-image', 'url(\"'+icon+'\")');
			$('#'+toolName+' span.icon').css('background-image', 'url(\"'+icon+'\")');
			$('#'+toolName+' span.icon').css('background-position', '0 0');//or removeAttr()?
			// List groups
			setGroupsSelector();
			// Open/close listener
		    $('#mapmenu li.'+toolName).click(function(e){
			    if(!toolOpt.opened){openTimetool();}
			    else{closeTimetool();}
		    })
	    })
	   
	   function openTimetool(){
		   $('#'+toolName).get(0).classList.add('active');
		   $('li.'+toolName).get(0).classList.add('active');
		   $('#'+toolName+'-menu').show();
		   toolOpt.opened = true;
		   $('#'+toolName+' button.btn-'+toolName+'-clear').click(function(e){closeTimetool()});
		   activeTimetoolOptions();
		}
		
		function activeTimetoolOptions(){
			// Options
			$('#groupSelector').change(function(e){selectedGrp = e.target;initGroup();});
			$('#w-loop').change(function(){toolOpt.loop = this.checked;});
			$('#'+toolName+'-menu #frame-dur').change(function(){toolOpt.frameDuration = this.value;});
			// Navigation buttons
			$('#playGroup').click(function(e){
				if(toolOpt.playing){stop();}
				else{play();}
			});
			$('#nextDate').click(function(){next();});
			$('#previousDate').click(function(){previous();});
			$('#firstDate').click(function(){first();});
			$('#lastDate').click(function(){last();});
			$('#w-gif').change(function(){toolOpt.wGif = this.checked;});
			document.querySelector('#downloadGif').addEventListener('click', download, false);
		}

		function closeTimetool(){
			$('#'+toolName).get(0).classList.remove('active');
			$('li.'+toolName).get(0).classList.remove('active');
			selectedGrp = undefined;
			$("#groupSelector").get(0).selectedIndex = 0;
			toolOpt.opened = false;
			resetTimetool();
			$('#'+toolName+'-menu #frame-dur').get(0).value = 3000;
			$('#w-loop').get(0).checked = false;
			$('#w-gif').get(0).checked = false;
		}
		
		function resetTimetool(){
			$('#dateValue').get(0).textContent = '';
			$('#'+toolName+'-date-label').css('display', 'none');
			for(l in geoTimeLayers){hideLayer(l);}
			setStateNavButtons(true, true, true, true, true);
			$('#'+toolName+'-legend').attr('src', '');
			visibleLayerIndex = undefined;
			geoTimeLayers = [];
			nbLayers = 0;
			toolOpt.playing = false;
			$('#downloadGif').attr('disabled', true);
			$('#aGif').attr('href', "");
			$('#aGif').attr('download', "");
			gif = undefined;
		}
		
		function isGeoTemporalLayer(layerName, config){
			/**
				Test if the layer name has a date format 
				(such as alphaCharYYYY-MM-DD or alphaCharYYYY_MM_DD )
				and has a valid geometry type.
			**/
			var regex = /^[a-zA-Z]{1}[0-9]{4}_*-*[0-9]{2}_*-*[0-9]{2}/;
			return config.type == 'layer' && regex.test(layerName) && config.geometryType != 'none' && config.geometryType != 'undefined' && config.geometryType != '';
		}

		function isGeoTemporalGroup(groupLayers){
			for(i in groupLayers){if(isGeoTemporalLayer(groupLayers[i].name, groupLayers[i].config)){return true;}}
			return false;
		}
		
		function sortingByDate(strDate1, strDate2){
			/**
			Sorting two layers by the date contained in their name.
			**/
			let date1 = new Date(strDate1.substr(1).split(/_|-/));
			let date2 = new Date(strDate2.substr(1).split(/_|-/));
			return date1.getTime() - date2.getTime();
		}
		
		function setStateNavButtons(btnPlay, btnPrev, btnNext, btnFirst, btnLast){
			$('#'+toolName+'-menu #playGroup').attr('disabled', btnPlay);
			$('#'+toolName+'-menu #previousDate').attr('disabled', btnPrev);
			$('#'+toolName+'-menu #nextDate').attr('disabled', btnNext);
			$('#'+toolName+'-menu #firstDate').attr('disabled', btnFirst);
			$('#'+toolName+'-menu #lastDate').attr('disabled', btnLast);
		}
		
		function addMessage(textMsg, duration){
			$('#message').append('<p class=\"'+toolName+'-message\">'+textMsg+'</p>');
			setTimeout(function(){removeMessage();}, duration);
		}
		
		function removeMessage(){$('.'+toolName+'-message').remove();}	

		function setGroupsSelector(){
			var children = lizMap.tree.children;
			for(c in children){
				if(children[c].config.type == 'group' && isGeoTemporalGroup(children[c].children)){
					$("<option>"+children[c].config.name+"</option>").insertAfter('#'+toolName+' #defaultOpt');
					groups.unshift({grp: children[c], loaded: false, blob: undefined});
				}
			}
		}

		function loadLayers(){
			var loadedLayers = 0;
			for(i in geoTimeLayers){
				var currentLay = map.getLayersByName(geoTimeLayers[i].cleanname)[0];
				if(typeof currentLay !== 'undefined'){currentLay.setVisibility(true);}
				currentLay.events.on({
					loadend: function(e){
						loadedLayers++;
						if(loadedLayers <= nbLayers){addMessage('Loaded: '+loadedLayers+'/'+nbLayers, 1500);}
						if(loadedLayers == nbLayers){
							setStateNavButtons(false, false, false, false, false);
							groups[selectedGrp.selectedIndex -1].loaded = true;
						}
					}
				});
			}
		}
		
		function initGroup(){
			resetTimetool();
			if(selectedGrp != undefined && selectedGrp.value != $('#'+toolName+' #defaultOpt').get(0).value){
				var grpLayers = groups[selectedGrp.selectedIndex -1].grp.children;
				for(i in grpLayers){//Get geometric layer with date information
					if( isGeoTemporalLayer(grpLayers[i].name, grpLayers[i].config) ){ geoTimeLayers.push(grpLayers[i].config); }
				}
				nbLayers = geoTimeLayers.length
				geoTimeLayers.sort(function(e1, e2){return sortingByDate(e1.name, e2.name);})// Sort layers chronologically
				
				if(groups[selectedGrp.selectedIndex -1].loaded){setStateNavButtons(false, false, false, false, false);}// Layers already loaded
				else{loadLayers();}// Load layers
				
				// Init view
				$('#'+toolName+'-date-label').css('display', 'inline');
				$('#'+toolName+'-legend').attr('src',  $('#legend-'+geoTimeLayers[0].cleanname+' img').get(0).dataset.src);
				first();
				// A GIF has already been generated
				if(groups[selectedGrp.selectedIndex -1].blob){$('#downloadGif').attr('disabled', false);}

				return 0;
			}else{addMessage('Invalid group selected.', 5000);}
			return 1;
		}

		function showLayer(idx){
			if(idx < nbLayers && idx >= 0){
				var currentLay = map.getLayersByName(geoTimeLayers[idx].cleanname)[0];
				$('#dateValue').get(0).textContent = geoTimeLayers[idx].name.substr(1);
				$('#'+toolName+'-legend-div').css('display', 'block');
				if(typeof currentLay !== 'undefined'){
					currentLay.setVisibility(true);
					$('#'+currentLay.id).css('display', 'block');
				}
			}
		}
		
		function hideLayer(idx){
			if(idx < nbLayers && idx >= 0){
				var currentLay = map.getLayersByName(geoTimeLayers[idx].cleanname)[0];
				$('#'+toolName+'-legend-div').css('display', 'none');
				if(typeof currentLay !== 'undefined'){
					currentLay.setVisibility(false);
					$('#'+currentLay.id).css('display', 'none');
				}
			}	
		}
		
		function next(){
			if(nbLayers > 0){
				var exVisibleIndex = visibleLayerIndex;
				if(visibleLayerIndex + 1 == nbLayers && toolOpt.loop){visibleLayerIndex = 0;}
				else{visibleLayerIndex++;}
				
				if(visibleLayerIndex < nbLayers && visibleLayerIndex >=0){
					hideLayer(exVisibleIndex);
					showLayer(visibleLayerIndex);
				}
				
				if(toolOpt.playing){playSelectedGroup();}
				if(!toolOpt.playing && visibleLayerIndex == nbLayers){visibleLayerIndex--;}
			}
		}
		
		function previous(){
			if(nbLayers > 0){
				var exVisibleIndex = visibleLayerIndex;
				if(visibleLayerIndex == 0 && toolOpt.loop){visibleLayerIndex = nbLayers-1;}
				else{visibleLayerIndex--;}
				
				if(visibleLayerIndex < nbLayers && visibleLayerIndex >= 0){
					hideLayer(exVisibleIndex);
					showLayer(visibleLayerIndex);
				}
				
				if(toolOpt.playing){playSelectedGroup();}
				if(!toolOpt.playing && visibleLayerIndex < 0){visibleLayerIndex++;}
			}
		}
		
		function first(){
			/** Show the first layer of the selected group. **/
			if(nbLayers > 0){
				hideLayer(visibleLayerIndex);
				visibleLayerIndex = 0;
				showLayer(visibleLayerIndex);
			}
		}
		
		function last(){
			/** Show the last layer of the selected group. **/
			if(nbLayers > 0){
				hideLayer(visibleLayerIndex);
				visibleLayerIndex = nbLayers-1;
				showLayer(visibleLayerIndex);
			}
		}
		
		function play(){
			$('#downloadGif').attr('disabled', true);
			toolOpt.playing = true;
			$('#'+toolName+'-menu #playGroup').get(0).innerHTML = "Stop";
			setStateNavButtons(false, true, true, true, true);
			first();
			if(toolOpt.wGif){
				gif = new GIF({
					workers: 3,
					quality: 8,
					workerScript: urlPrefix+'js/gif.js-0.2.0/gif.worker.js'
				});
			}
			playSelectedGroup();
		}
		
		function stop(){
			toolOpt.playing = false;
			previous();
			$('#'+toolName+'-menu #playGroup').get(0).innerHTML = "Play";
			setStateNavButtons(false, false, false, false, false);
		}
		
		function playSelectedGroup(){
			if(visibleLayerIndex < nbLayers && visibleLayerIndex >= 0 && toolOpt.playing){
				if(toolOpt.wGif && typeof gif !== 'undefined'){addMapToGif();}
				setTimeout(function(){next();}, toolOpt.frameDuration);
			}else{stop();}
		}

		function cropCanvas(canvasElement) {
			/** Crop the canvas to keep only the layer, its legend and its date label. **/
			var ctx = canvasElement.getContext('2d');
			let x = Math.round($('#'+toolName+'-date-label').get(0).getBoundingClientRect().x)-40;
			let w = Math.round($('#mini-dock').get(0).getBoundingClientRect().x - $('#'+toolName+'-date-label').get(0).getBoundingClientRect().x )+10;
			let h = Math.round($('#map-content').get(0).getBoundingClientRect().height);
			var croppedImgData = ctx.getImageData(x, 0, w, h);
			
			var newCanvasElement = document.createElement('canvas');
			newCanvasElement.width = w;
			newCanvasElement.height = h;
			newCanvasCtx = newCanvasElement.getContext('2d');
			newCanvasCtx.putImageData(croppedImgData, 0, 0);
			return newCanvasElement;
		}

		function addMapToGif(){
			html2canvas(document.querySelector('#map-content'), {
				onrendered: function(canvasElement){
					if(gif.frames.length < nbLayers){gif.addFrame(cropCanvas(canvasElement), {delay: toolOpt.frameDuration});}
					if(gif.frames.length == nbLayers){renderGif();}
					if(gif.frames.length > nbLayers){console.error('Error: Frame\'s number exceeds the number of layers.');}
				}
			}); 
		}

		function renderGif(){
			gif.on('finished', function(blob) {
				if(typeof groups[selectedGrp.selectedIndex -1].blob === 'undefined' ||  groups[selectedGrp.selectedIndex -1].blob.size != blob.size){
					groups[selectedGrp.selectedIndex -1].blob = blob;
				}
				$('#downloadGif').attr('disabled', false);
			});
			gif.render();
		}

		function download() {
			if(groups[selectedGrp.selectedIndex -1].blob){
				$('#aGif').attr('href', URL.createObjectURL(groups[selectedGrp.selectedIndex -1].blob));
				$('#aGif').attr('download', lzParams.project+'-'+selectedGrp.value.replace(/ /g, "_")+'.gif');
				$('#aGif').get(0).click();
			}
		}
   }	
});
