// JavaScript Document
 /* LOCAL FUNCTIONS FOR FINDINGAIDS PAGE
  * ======================================================= */



$(document).ready(function(){
	
	/* LORIS stuff */
	var SERVER = 'http://libimages.princeton.edu/loris/'
	var CB = '/info.json?callback=?'
	var SAMPLES = [
	'pudl0001%2F5138415%2F00000011.jp2'
	]
	
	var osd_config = {
		id: "viewer",
		prefixUrl: "/static/openseadragon/images/",
		preserveViewport: true,
		showNavigator:  true,
		visibilityRatio: 1,
		minZoomLevel: 1,
		tileSources: []
	}
	
	function updateTileSources(data) {
		// osd_config.tileSources.push(data);
		osd_config.tileSources = data;
	}
	/* end LORIS stuff */
	
	if (getCookie("showEAD") != 'true'){
		$("#eadtoggle").html("Show EAD Tools");
		$(".eadinfo").hide();
	}else{		
		$("#eadtoggle").html("Hide EAD Tools");
		$(".eadinfo").show();
	}
	
	$(".alert").alert()

	$("#eadtoggle").on("click", function(){
		//$(".eadinfo").toggle(flipCookie("showEAD"));
		$(".eadinfo").toggle(
			function() {
				
				if(flipCookie("showEAD")){
					$("#eadtoggle").html("Hide EAD Tools");
				}else{
					$("#eadtoggle").html("Show EAD Tools");
				}
				
			});
		
		
	});
	
	$(".swatch").on("click", function(){
		
		$(".swatch").removeClass("active");
		$(this).addClass("active");
		$("#bg").css("background-color", $(this).css("background-color"));
		$("#bg").css("color", $(this).css("color"));
		
	});
	
	function clientCoords() {
		var dimensions = {width: 0, height: 0};
		if (document.body && document.body.offsetWidth) {
		 dimensions.width = document.body.offsetWidth;
		 dimensions.height = document.body.offsetHeight;
		}
		if (document.compatMode=='CSS1Compat' &&
		    document.documentElement &&
		    document.documentElement.offsetWidth ) {
		 dimensions.width = document.documentElement.offsetWidth;
		 dimensions.height = document.documentElement.offsetHeight;
		}
		if (window.innerWidth && window.innerHeight) {
		 dimensions.width = window.innerWidth;
		 dimensions.height = window.innerHeight;
		}
		return dimensions;
	}


	$(".resource").on("click", function(){
		
		$(".resource").removeClass("active");
		$(this).addClass("active");
		
		var thumb = $(this).find(".thumb");
		var label = $(this).find(".caption").text();
		
		$('.modal').css({
			width: clientCoords().width - 100,
			height: "auto",
			top: 290,
			'margin-left': function () {
			    return -((clientCoords().width - 100) / 2);
			}
		});
		
		$('.modal-body').css('max-height', clientCoords().height - 190)
		
		$('#viewer').width( clientCoords().width - 100 );
		$('#viewer').height( clientCoords().height - 190 );
		$('.toolbar').width( clientCoords().width - 100 );
		
		var url = thumb.attr("src").replace("http://libimages.princeton.edu/loris/","");
		urn = url.substring(0, url.indexOf('/'));
		
		// update the modal title
		$("#imgZoomLabel").text(label);
		
		// change the djatoka url to a level 5
		// $("#viewer").attr("src", url.substring(0, url.length - 1) + "5");
		//$("#viewer").html(url);
		
		$.when (
			$.getJSON(SERVER + urn + CB,
			      function(data) {
				      /* Need to test if OpenSeaDragon exists and destroy it if it is?	
				      if(OpenSeadragon.isOpen()){
					OpenSeadragon.destroy();	
				      }
				      */
				      
				      updateTileSources(data);
			      }
			)
		).then( function() {
			OpenSeadragon(osd_config)
		}) 
		
	});

	$("#rotate").on("click", function(event){
		event.preventDefault();
		var url = $.url($("#zoomImg").attr("src"));
		var cur_rotation = (url.param('svc.rotate') == undefined) ? 0 : parseInt(url.param('svc.rotate'));
		var new_rotation = cur_rotation + 90;
		new_rotation = (new_rotation == 360) ? 0: new_rotation;
		
		url.param('svc.rotate', new_rotation);
		$("#zoomImg").attr("src", url);
	});
	
	  /* attach a submit handler to the form */
	  $("#eadForm").submit(function(event) {

	    /* stop form from submitting normally */
	    event.preventDefault(); 
	        
	    /* get some values from elements on the page: */
	    var $form = $( this ),
	        c = $form.find( 'input[name="component_uri"]' ).val(),
	        n = $form.find( 'textarea[name="note"]' ).val(),
	        url = $form.attr( 'action' );

	    
	    $.ajax({
	    	  url: window.location.href,
	    	  type: "POST",
	    	  headers: { 
	    	        Accept : "text/plain",
	    	        "Content-Type": "application/x-www-form-urlencoded"
	    	    },
	    	  data: { component_uri: c, note: n },
	    	  error: function (xhr, thrownError) {
	    		  $( "#msg" ).empty().append( xhr.responseText );
	    		  $(".alert").addClass("alert-error");
	    		  $(".alert").fadeIn('fast');
	    	      },
	    	  success: function(data) {
	    		if(data == 'Success!'){
	    			$(".alert").addClass("alert-success");
	    		}else{
	    			$(".alert").addClass("alert-error");
	    		}
	    		
		        $( "#msg" ).empty().append( data );
		        $(".alert").fadeIn('fast');
		        
		        // only keep the error around if it's something they need to take action on.
		        if(data == 'Success!'){
			        setTimeout(function() {
			            $('.alert').fadeOut('slow');
			        }, 1000);
		        }
	    	  }
	    	});

	  });
	
	
/* Cookie Stuff
 * 
 */	
	function getCookie(c_showEAD)
	{
		var i,x,y,ARRcookies=document.cookie.split(";");
		for (i=0;i<ARRcookies.length;i++)
		  {
		  x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
		  y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
		  x=x.replace(/^\s+|\s+$/g,"");
		  if (x==c_showEAD)
		    {
		    return unescape(y);
		    }
		  }
	}

	function setCookie(c_showEAD,value,exdays)
	{
		var exdate=new Date();
		exdate.setDate(exdate.getDate() + exdays);
		var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString())+"; path=/";
		document.cookie=c_showEAD + "=" + c_value;
	}

	function flipCookie()
	{
		var showEAD = getCookie("showEAD");
		
		if (showEAD==undefined) // if no cookie
		  {

		    setCookie("showEAD",true,365);
			
		  }
		else 
		  {
			
			if (showEAD==null || showEAD==false || showEAD=='false'){
				showEAD = true;
			}
			else if (showEAD == "true" || showEAD==true){
				showEAD = false;
		  	}
			setCookie("showEAD",showEAD,365);
		  
		  }
		  return showEAD;
	}
	
	function eraseCookie(name) {
		setCookie(name,"",-1);
	}

});