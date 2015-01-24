//NYU School of Medicine Virtual Microscopy Functions - NYUSM Division of Educational Informatics//Global Variablesvar map, manager;var centerLat = 0, centerLong = 0, initialZoom = 3;var currentopenmarker = nullvar markersArray = {};var intervalId = nullvar followrefreshinterval = 3000;var followsidebarinterval = 7000;var markersvisible = truevar pointervisible = falsevar pointermarker = nullvar chatvisible = falsevar followmarkerevenodd = false//Global Eventswindow.onresize = handleResize;window.onload = init;//we use a single infowindow for all marker popupsvar infoWindow = new google.maps.InfoWindow({content: "",maxWidth: 800});//if we are loading the page using a link that conveys a pre-specified view, lets set our variablescenterLat = {{lat|default_if_none:"0"}};centerLong = {{lng|default_if_none:"0"}};initialZoom = {{zoom|default_if_none:"2"}};function getCookie(name) {    var cookieValue = null;    if (document.cookie && document.cookie != '') {        var cookies = document.cookie.split(';');        for (var i = 0; i < cookies.length; i++) {            var cookie = jQuery.trim(cookies[i]);            // Does this cookie string begin with the name we want?            if (cookie.substring(0, name.length + 1) == (name + '=')) {                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));                break;            }        }    }    return cookieValue;}var csrftoken = getCookie('csrftoken');function csrfSafeMethod(method) {    // these HTTP methods do not require CSRF protection    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));}$.ajaxSetup({    beforeSend: function(xhr, settings) {        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {            xhr.setRequestHeader("X-CSRFToken", csrftoken);        }    }});//MAP UTILITY FUNCTIONSfunction windowHeight() {  // Standard browsers (Mozilla, Safari, etc.)  if (self.innerHeight) {    return self.innerHeight;  }  // IE 6  if (document.documentElement && document.documentElement.clientHeight) {   return document.documentElement.clientHeight;  }  // IE 5  if (document.body) {    return document.body.clientHeight;  }  // Just in case.   return 0;}function handleResize() {	var height = windowHeight() - $("#map").position().top;	document.getElementById('map').style.height = height + 'px';}//The actual mapping to the slide tiles created by the tiling scriptfunction customGetTileURL(a,b) {	return "{{slide.url}}/" + b + "/" + a.y + "/" + a.x + ".jpg";}//Initialize the Google Map Canvasfunction init() {	handleResize();		var myOptions = {		zoom: parseInt(initialZoom),		center: new google.maps.LatLng(centerLat,centerLong),		mapTypeControl: false,		navigationControl: true,		streetViewControl: false,		mapTypeId: google.maps.MapTypeId.ROADMAP,		backgroundColor:'black'	}	map = new google.maps.Map(document.getElementById("map"), myOptions);	var VM_Map = new google.maps.ImageMapType({				name: 'NYU Virtual Microscope', 				alt: 'NYU Virtual Microscope',				getTileUrl: function(coord, zoom) {return customGetTileURL(coord, zoom);},				tileSize: new google.maps.Size(256, 256),				minZoom: 1, 				maxZoom: {{slide.maxzoomlevel}}, 				isPng: false			});	map.mapTypes.set('VM_Map', VM_Map);	map.setMapTypeId('VM_Map');		//When marker windows close, clear out the variable	google.maps.event.addListener(map, 'click', function(){		infoWindow.close();		currentopenmarker = null;	});	//When marker windows close, clear out the variable	google.maps.event.addListener(infoWindow,'closeclick',function(){		currentopenmarker = null;	});	//Copyright	copyrightNode = document.createElement('div');	copyrightNode.id = 'copyright-control';	copyrightNode.style.fontSize = '13px';	copyrightNode.style.color = 'white';	copyrightNode.style.fontFamily = 'Arial, sans-serif';	copyrightNode.style.margin = '0 2px 2px 0';	copyrightNode.style.whiteSpace = 'nowrap';	copyrightNode.index = 0;	copyrightNode.innerHTML = 'Slide images property and copyright NYU'; 	map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(copyrightNode);		{% if not compact %}	//Mini Map	var miniOptions = {		zoom: 1,		streetViewControl: false ,		center: new google.maps.LatLng(0,0),		disableDefaultUI: true,		mapTypeId: google.maps.MapTypeId.ROADMAP	}		var mini_Map = new google.maps.Map(document.getElementById('mini_map'),miniOptions);	mini_Map.mapTypes.set('VM_Map', VM_Map);	mini_Map.setMapTypeId('VM_Map');		mini_Map.bindTo('center', map, 'center');	var overDiv = mini_Map.getDiv();	map.getDiv().appendChild(overDiv);	overDiv.style.position = "absolute";	overDiv.style.left = "0px";	overDiv.style.bottom = "0px";	overDiv.style.zIndex = 10;		var collapse = document.getElementById('collapse_mini_map');	mini_Map.getDiv().appendChild(collapse);	collapse.style.position = "absolute";	collapse.style.left = "0px";	collapse.style.top = "0px";	collapse.style.zIndex = 9;	google.maps.event.addListener(mini_Map, 'idle', function() {	  mini_Map.getDiv().style.zIndex = 10;	});	{% endif %}		homeControlDiv = document.getElementById('mapbutton')	map.controls[google.maps.ControlPosition.TOP_RIGHT].push(homeControlDiv);	//if this is a follow, add its controls to the map	{% if follow %}		followControlDiv = document.getElementById('followControlDiv')		map.controls[google.maps.ControlPosition.RIGHT_TOP].push(followControlDiv);		{%endif%}	//if this is a follow transcript, add its control to the map	{% if transcript %}		transcriptdiv = document.getElementById('transcriptdiv')		map.controls[google.maps.ControlPosition.RIGHT_TOP].push(transcriptdiv);		{%endif%}	//set zoom	map.setZoom(parseInt(initialZoom));		//set background color	document.getElementById('map').style.backgroundColor = 'black';	{% if collectionslide %}			{% if user.is_authenticated %}			//draw the markers if needed		showmarkers();		{% endif %}				//activate mini		$('#mini_map').toggle();				//activate mini collapse control		$('#collapse_mini_map').toggle();				//activate button panel		$('#mapbutton').toggle();					//is the chat already on, if so go for it				{% if follow and follow.chat_visible %}			chatvisible=true;			$('#followControlDiv').toggle();		{%endif%}			{% if follow %}			//If a follow is in process, lets activate the xyz sync ajax call			intervalId = window.setInterval(function() {syncfollow()}, followrefreshinterval);			//If a follow is in process, lets activate the chat ajax call			window.setInterval(function() {refreshchat()}, followsidebarinterval);			//Do an initial sync with the follow server			syncfollow();						//if a follow is in process, lets add a pointer if its turned on			{% if follow.pointer_visible %}				pointer_visible=true;				togglepointer();			{%endif%}					{% endif %}				//if a marker id was passed as a url variable, ?m=x, then click it now		{% if m %}			sidebarlistclick({{m}});		{%endif%}			{%endif%}    {% ifequal question.question.question_type 3 %}		//If this is an exam question of the find on map type		//add marker to map		var myLatlng = new google.maps.LatLng({{question.lat|default_if_none:0}},{{question.lng|default_if_none:0}});		var marker = new google.maps.Marker({			position: myLatlng, 			map: map,			title:"Drag this marker to answer the question above"			{% ifequal user question.student %},			draggable:true			{% endifequal %}		});				//add a handler so the student answer is set on every dragend		google.maps.event.addListener(marker, "dragend", function(position) {        	var params = "lat=" + marker.getPosition().lat();			params = params + "&lng=" + marker.getPosition().lng();			params = params + "&zoom=" + map.getZoom();			$('#lat').val(marker.getPosition().lat())			$('#lng').val(marker.getPosition().lng())			$('#zoom').val(map.getZoom())									$.post("{{URL_ROOT}}/exam/take/{{exam.id}}/{{question.id}}/", params, function(data) {});		});		//set the question zoom		map.setZoom({{question.zoom|default_if_none:2}}); 		//set the question center		map.setCenter(myLatlng)				//set the form variables?		$('#lat').val(marker.getPosition().lat())		$('#lng').val(marker.getPosition().lng())		$('#zoom').val(map.getZoom())						    {%endifequal%}  	}  //END OF INIT FUNCTIONfunction linktoview() {	currentcenter = new google.maps.LatLng();	currentcenter = map.getCenter();		var currenturl='';	currenturl="{{URL_ROOT}}/v/{{collectionslide.id}}/?lat="+currentcenter.lat()+"&lng="+currentcenter.lng()+"&zoom="+map.getZoom(); 	maillink ='mailto:?body={% if user.is_authenticated %}{{user.first_name}} sent you{%else%}Check out {% endif %} this link to a slide within the NYU Virtual Microscope:%0d%0A%0d%0A{{URL_ROOT}}/v/{{collectionslide.id}}/?lat='+currentcenter.lat()+'%26lng='+currentcenter.lng()+'%26zoom='+map.getZoom()+'&subject=NYU Virtual Microscope Link';	//put links in modal	$("#emaillink").attr("href",maillink)	document.getElementById('linktoviewbody').innerHTML='<a href='+currenturl+'>'+currenturl+'</a>';							//show modal	$('#linktoview').modal('show')}//From Google Sample Code - functions needed to get the center custom tile for the 'save view to favs'.function bound(value, opt_min, opt_max) {if (opt_min != null) value = Math.max(value, opt_min);if (opt_max != null) value = Math.min(value, opt_max);return value;}function degreesToRadians(deg) {return deg * (Math.PI / 180);}function radiansToDegrees(rad) {return rad / (Math.PI / 180);}function MercatorProjection() {	this.pixelOrigin_ = new google.maps.Point(256 / 2,		256 / 2);	this.pixelsPerLonDegree_ = 256 / 360;	this.pixelsPerLonRadian_ = 256 / (2 * Math.PI);}MercatorProjection.prototype.fromLatLngToPoint = function(latLng,opt_point) {	var me = this;	var point = opt_point || new google.maps.Point(0, 0);	var origin = me.pixelOrigin_;		point.x = origin.x + latLng.lng() * me.pixelsPerLonDegree_;		// NOTE(appleton): Truncating to 0.9999 effectively limits latitude to 89.189.  This is about a third of a tile past the edge of the world tile.	var siny = bound(Math.sin(degreesToRadians(latLng.lat())), -0.9999,		0.9999);	point.y = origin.y + 0.5 * Math.log((1 + siny) / (1 - siny)) *		-me.pixelsPerLonRadian_;	return point;};MercatorProjection.prototype.fromPointToLatLng = function(point) {	var me = this;	var origin = me.pixelOrigin_;	var lng = (point.x - origin.x) / me.pixelsPerLonDegree_;	var latRadians = (point.y - origin.y) / -me.pixelsPerLonRadian_;	var lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) -		Math.PI / 2);	return new google.maps.LatLng(lat, lng);};//get the custom tile from the latlngfunction tilefromlatlng() {	currentcenter = map.getCenter();		//currentzoom = map.getZoom();	var numTiles = 1 << map.getZoom();	var projection = new MercatorProjection();	var worldCoordinate = projection.fromLatLngToPoint(currentcenter);	var pixelCoordinate = new google.maps.Point(		worldCoordinate.x * numTiles,		worldCoordinate.y * numTiles);	var tileCoordinate = new google.maps.Point(		Math.floor(pixelCoordinate.x / 256),		Math.floor(pixelCoordinate.y / 256));	return( "tile_" + map.getZoom() + "_"+ tileCoordinate.x  + "_" + tileCoordinate.y+ ".jpg");}//End Google Sample Code//Marker Functionsfunction showmarkers() {	//close any open infowindows	infoWindow.close()	//destroy all markers in advance of refresh	if (markersArray) {		for (var i in markersArray ) {			markersArray[i].setMap(null);		}	}	markersArray = [];	var facmarkerlist = '<li><a href="#" onclick="javascript:showmarkers();"><i class="icon-refresh"></i> Refresh Markers</a></li><li class="divider"></li>';	var studmarkerlist = '<li><a href="#" onclick="javascript:showmarkers();"><i class="icon-refresh"></i> Refresh Markers</a></li><li class="divider"></li>';	var marker = new google.maps.Marker();	var myLatlng = new google.maps.LatLng();   	$.ajax({				async: false,				url: "{{URL_ROOT}}/serializemarkers/{{collectionslide.id}}/&r=" + Math.random(),				dataType: "json",				success: function(resp) { marker = resp;}		});				var faccounter = 1		var studcounter = 1		var strcounter =''		var iconstring = ''		var tmpstring = ''		var isfaculty = false		var is_draggable = false		var aid = [{% for a in collectionslide.collection.authors.all %}{{a.id}}{%if not forloop.last%},{%endif%}{%endfor%}]				$.each(marker, function(i,item) {			tmpstring = ''			isfaculty = false			is_draggable = false						if (jQuery.inArray(this.fields.author, aid)>-1){isfaculty = true}							if (isfaculty){				counter = faccounter;				is_draggable=true			} else {				counter = studcounter;			}									{% if user.is_authenticated %}			if (this.fields.author == {{user.id}}){ is_draggable=true }			{%endif%}						myLatlng = new google.maps.LatLng(parseFloat(this.fields.lat),parseFloat(this.fields.lng ));			var options = {}			options["markerid"] =this.pk;			options["position"] =myLatlng;			if (this.fields.label) {options["title"] = this.fields.label }			options["zoom"]=this.fields.zoom 			options["draggable"]=is_draggable			//for icon file naming			if (String(counter).length< 2) {				strcounter = "0"+String(counter)			} else {				strcounter = String(counter)			}			if (isfaculty){				if (this.fields.public) {					if (this.fields.label) {						iconstring = 	'{{STATIC_URL}}images/numeric/red'+strcounter+'.png'					} else {						iconstring = 	'{{STATIC_URL}}images/numeric/error'+strcounter+'.png'					}				} else {					if (this.fields.label) {						iconstring = 	'{{STATIC_URL}}images/numeric/private'+strcounter+'.png'					} else {						iconstring = 	'{{STATIC_URL}}images/numeric/error'+strcounter+'.png'					}								}							} else {				if (this.fields.public) {					if (this.fields.label) {						iconstring = 	'{{STATIC_URL}}images/numeric/black'+strcounter+'.png'					} else {						iconstring = 	'{{STATIC_URL}}images/numeric/error'+strcounter+'.png'					}				} else {					if (this.fields.label) {						iconstring = 	'{{STATIC_URL}}images/numeric/private'+strcounter+'.png'					} else {						iconstring = 	'{{STATIC_URL}}images/numeric/error'+strcounter+'.png'					}						}			}			marker = new google.maps.Marker({				position:myLatlng, 				maxWidth:700,				icon: iconstring,				map: map,				draggable:is_draggable,				nyuvmid:this.pk							}); 									{% if user.is_authenticated %}						//draggable			if (is_draggable) {				google.maps.event.addListener(marker, "dragstart", function() {					infoWindow.close();				});				google.maps.event.addListener(marker, "dragend", updatemarkerpostion(this.pk));			}				{%endif%}							//add the newly created marker to the global array  			markersArray[String(this.pk)] = marker;						//add the newly created marker to the dropdown list with nice icons			tmpstring = tmpstring + '<li><a href="#" onclick="javascript:sidebarlistclick('+this.pk+');">'+String(counter)+'. ' 									if (this.fields.type ==1) {				tmpstring = tmpstring + '<i class="icon-screenshot"></i> '			} else if (this.fields.type ==2) {				tmpstring = tmpstring + '<i class="icon-question-sign"></i> '			} else {				tmpstring = tmpstring + '<i class="icon-exclamation-sign"></i> '			}			if (this.fields.label) {				if (this.fields.public) {					tmpstring = tmpstring + this.fields.label+'</a></li>'				} else {					tmpstring = tmpstring +this.fields.label+' <i class="icon-lock"></i></a></li>'				}							} else {				tmpstring = tmpstring +'<font color="red">Untitled</font></a></li>'			}						if (isfaculty){				faccounter ++;				facmarkerlist=facmarkerlist+tmpstring;			} else {				studcounter ++;				studmarkerlist=studmarkerlist+tmpstring;			}					google.maps.event.addListener(marker, 'click',makeInfoWindowEvent(map,marker, infoWindow,options));			google.maps.event.addListener(infoWindow, 'domready', function (e) {});   			});		//populate the dropdown menu		if (faccounter>1) {			$('#faculty-menu').html(facmarkerlist);			$('#faculty-menu-container').show();		} else {			//no markers so hide list item			$('#faculty-menu-container').hide();		}		if (studcounter>1) {			$('#student-menu').html(studmarkerlist);			$('#student-menu-container').show();		} else {			//no markers so hide list item			$('#student-menu-container').hide();		}		$('#addmarkerbutton').show();						}function togglemarkers() {	if (markersvisible){		//close any open infowindows		infoWindow.close()		//destroy all markers in advance of refresh		if (markersArray) {			for (var i in markersArray ) {				markersArray[i].setMap(null);			}		}		markersArray = [];		$('#faculty-menu-container').hide();		$('#student-menu-container').hide();		$('#addmarkerbutton').hide();		markersvisible=false	} else {		markersvisible=true		showmarkers() 	}}function makeInfoWindowEvent(map, marker, infowindow, options) {     return function() {   	var ajax_response = "<p><h4 class='alert alert-error'>Error loading marker information</h4></p>";	$.ajax({				async: false,				url: "{{URL_ROOT}}/markercontent/"+options["markerid"]+"/&r=" + Math.random(),				success: function(resp) { ajax_response = resp;}		});			var $infoWindowContent = $(ajax_response);	infowindow.setContent($infoWindowContent[0]);	// infowindow.setmaxWidth(350);   	map.setZoom(options["zoom"])   	map.setCenter(marker.getPosition())	infowindow.open(map, marker);   	currentopenmarker = marker	$('#publicitytogglelink').tooltip({placement:"bottom"});   };  } function sidebarlistclick(m) {	google.maps.event.trigger(markersArray[ String(m)], "click");}{% if user.is_authenticated %}function addmarker() {		currentcenter = map.getCenter();			currentzoom = map.getZoom();		var params = "lat=" + currentcenter.lat()+ "&lng=" + currentcenter.lng()+ "&zoom=" + map.getZoom();		$.post( "{{URL_ROOT}}/addmarker/{{collectionslide.id}}/", params, function(data) { 			var newmarkerid =parseInt(data); 			showmarkers() 			google.maps.event.trigger(markersArray[ String(newmarkerid)], 'click');  		});	}function deletmarker(id) {	bootbox.confirm("Are you sure you want to delete this marker?  This cannot be undone.", function(result) {			if (result) {				$.get( "{{URL_ROOT}}/deletemarker/"+id+"/", function(data) { showmarkers();});			}		});	}function adoptmarker(id) {	bootbox.confirm("Are you sure you want to adopt this marker?  This cannot be undone.", function(result) {			if (result) {				$.get( "{{URL_ROOT}}/adoptmarker/"+id+"/", function(data) { showmarkers();});			}		});	}function showmarkereditor(id) { 	$.get('{{URL_ROOT}}/editmarkerform/'+id+'/', function(data) {  $('#markereditformdiv').html(data); }).success(function(result) {});	$('#markereditmodal').modal('show');}function updatemarkerpostion(id) {     return function() {  		var params = "lat=" + markersArray[id].getPosition().lat();		params = params + "&lng=" + markersArray[id].getPosition().lng();		params = params + "&zoom=" + map.getZoom();		$.post("{{URL_ROOT}}/editmarkerposition/"+id+"/", params, function(data) {showmarkers();});   };  } function togglemarkerpublicity(id) { 	$.get('{{URL_ROOT}}/togglemarkerpublicity/'+id+'/').success(function(result) { 			showmarkers();		sidebarlistclick(id);	});}function validatemarkereditor(formData, jqForm, options) { 	var form = jqForm[0]; 	if (!form.markerlabelinput.value) { 		$('#markertitleerror').show();		return false; 	}  	if ((!form.markertypeinput1.checked) && (!form.markertypeinput2.checked) )  { 		$('#markertypeerror').show();		return false; 	}  	   return true;}function markereditsuccess() { 	$('#markereditmodal').modal('hide');	infoWindow.close();	showmarkers();	google.maps.event.trigger(currentopenmarker, 'click');}function addmarkertofavs(markerid) {	var params = "markerid=" +markerid;	$.post( "{{URL_ROOT}}/editmyslides/addmarker/", params, function(data) {		$('#addmarkertofavslink').html('');	});}function voteonmarker(markerid,vote) {	var params = "";	$.post( "{{URL_ROOT}}/voteonmarker/"+markerid+"/"+vote+"/", params, function(data) {		google.maps.event.trigger(markersArray[ String(markerid)], "click");	});}{% endif %}	function processassessmentsubmission() {	if ($('#userresponse').val()){			$('#inputarea').hide();		$('#responsepreamble').show();		$('#userresponse2').html($('#userresponse').val());		$('#htmlcontent').show();			} else{		$('#errormessage').html("Please enter a response.");	}	} //Slide Fuctions{% if user.is_authenticated %}function addviewtofavs(title) {	$('#saveviewmodal').hide();	currentcenter = map.getCenter();		currentzoom = map.getZoom();	var params = "lat=" + currentcenter.lat()+ "&lng=" + currentcenter.lng()+ "&zoom=" + map.getZoom()+ "&tile=" + tilefromlatlng()+ "&title=" + title;	$.post( "{{URL_ROOT}}/editmyslides/addview/{{collectionslide.id}}/", params, function(data) {		$('#viewtitle').val("");		$('#saveviewform').hide();		$('#linktoview').modal('hide');	});}{% endif %}				//Follow Functions{% if user.is_authenticated %}	{% if follow %}		function syncfollow() {		//gets or sets follow xyz and toggles		var params = null		{% ifequal follow.author user %}			currentcenter = map.getCenter();				currentzoom = map.getZoom();			params = "lat=" + currentcenter.lat()+ "&lng=" + currentcenter.lng()+ "&zoom=" + map.getZoom();			if (currentopenmarker) {				params = params + '&marker='+currentopenmarker.nyuvmid			}		{%endifequal%}				$.get( "{{URL_ROOT}}/syncfollow/{{follow.id}}/{{collectionslide.id}}/", params, function(data) {			if (data == 'inactive'){endfollow();}				for(var i=0; i<data.length; i++) {				//togglemarkers as per follow leader only if there is a change in status					if (data[i].fields.markers_visible != markersvisible) {					togglemarkers();									} else {					if (data[i].fields.markers_visible){						//if markers are toggled on and there is an open info window, do nothing.						if (data[i].fields.current_open_marker_id){													{% ifnotequal follow.author user %}								//if the leaders marker is not clicked AND its a marker this user has access to, click it.							if (currentopenmarker != markersArray[ data[i].fields.current_open_marker_id]) {								if (markersArray[ data[i].fields.current_open_marker_id]) {										google.maps.event.trigger(markersArray[ data[i].fields.current_open_marker_id], 'click'); 									} else {										//user cant see this marker so refresh until they are able										showmarkers();									}							}													{%endifnotequal%}												} else {							//otherwise refresh							if (followmarkerevenodd) {								showmarkers();								followmarkerevenodd = false;							} else {								followmarkerevenodd = true;							}															}												}				}				{% ifnotequal follow.author user %}						//if leader has changed slides, lets go there								if (data[i].fields.collectionslide != {{collectionslide.id}}){						document.location.href='{{URL_ROOT}}/v/'+data[i].fields.collectionslide+'/';										}									//update xyz					map.setZoom(data[i].fields.zoom)					map.setCenter(new google.maps.LatLng(data[i].fields.lat,data[i].fields.lng));				{%endifnotequal%}									if (data[i].fields.pointer_visible != pointervisible) {					togglepointer(data[i].fields.pointer_visible);									}								//if the image changed, also refresh				if (pointermarker) {				if (('{{STATIC_URL}}images/'+data[i].fields.pointer_image) != pointermarker.icon) {					pointermarker.setIcon('{{STATIC_URL}}images/'+data[i].fields.pointer_image)							}					}				if (data[i].fields.chat_visible != chatvisible) {					chatvisible = data[i].fields.chat_visible;					togglechat();									}			}													});		}			function modifyfollow(action){			if (action=='togglemarkers'){				togglemarkers();			}				if (action=='togglepointer'){				togglepointer();			}							if (action=='togglechat'){				if (chatvisible == true) {					chatvisible == false				} else {					chatvisible == true				}								togglechat();			}								$.get('{{URL_ROOT}}/modifyfollow/{{follow.id}}/'+action+'/', function(data) {					if (data == 'inactive'){						endfollow();					}					});		}		function endfollow() {			$.get('{{URL_ROOT}}/endfollow/', function(data) {				location.reload(true);			});		}		function togglechat() {			if (chatvisible) {				$('#followControlDiv').show();			} else {				$('#followControlDiv').hide();				}		}		function refreshchat() {			if (chatvisible) {				$('#chat').load('{{URL_ROOT}}/followsidebar/{{follow.id}}/chat/');				$('#followers').load('{{URL_ROOT}}/followsidebar/{{follow.id}}/followers/');				//fix heights				var bodyheight = $('#followControlDiv').height();				$("#chat").height(bodyheight-170);				$("#followers").height(bodyheight-100);				//scroll to bottom of chat				$('#chat').scrollTop($('#chat').height())					}			}		function togglepointer(onoff) {			if (onoff) {				pointervisible = onoff			} else {							if (pointervisible) {					pointervisible=false				} else {					pointervisible=true				}			}			if (pointervisible) {				var crosshairShape = {coords:[0,0,0,0],type:'rect'};				pointermarker = new google.maps.Marker({				map: map,				icon: '{{STATIC_URL}}images/{{follow.pointer_image}}',				shape: crosshairShape				});				pointermarker.bindTo('position', map, 'center'); 					} else {				if (pointermarker != null) {					pointermarker.setMap(null);				}			}		}	{% endif %}	{% endif %}		