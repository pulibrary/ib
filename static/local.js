// JavaScript Document
 /* LOCAL FUNCTIONS FOR FINDINGAIDS PAGE
  * ======================================================= */



$(document).ready(function(){
	
	
	
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

	$(".overlay").on("click", function(){
		$(".overlay").hide();
		$(".mod").hide();
	});
	
	$(".resource").on("click", function(event){
		event.preventDefault();
		$(".overlay").show();
		$(".mod").show();
		$(".resource").removeClass("active");
		$(this).addClass("active");
		
		var thumb = $(this).find(".thumb");
		var label = $(this).find(".caption").text();
		var url = thumb.attr("data-info");
		
		// update the modal title
		$("#imgZoomLabel").text(label);
	        var promises = []
		promises.push(setOverlaySize());
		promises.push( $.getJSON(url + CB,
			      function(data) {
				      if(typeof o !== 'undefined'){
					o.destroy();
				      }
				      updateTileSources(data);
				    
			      }
			)
		)
		$.when.apply($, promises).done(function() {
			o = OpenSeadragon(osd_config);
		});
		
		
		
	});
	
	/* LORIS stuff */
	var CB = '?callback=?'
	var rotation = 0;
	
	var osd_config = {
		id: "viewer",
		prefixUrl: "/static/openseadragon/images/",
		preserveViewport: true,
		showNavigator:  true,
		visibilityRatio: 1,
		tileSources: [{"profile": "http://library.stanford.edu/iiif/image-api/1.1/compliance.html#level2", "scale_factors": [1, 2, 4, 8, 16], "tile_height": 256, "height": 3600, "width": 2676, "tile_width": 256, "qualities": ["native", "bitonal", "grey", "color"], "formats": ["jpg", "png", "gif"], "@context": "http://library.stanford.edu/iiif/image-api/1.1/context.json", "@id": "http://libimages.princeton.edu/loris/pudl0001%2F5138415%2F00000011.jp2"}]
	}
	
	// initialize OpenSeadragon
	// o = OpenSeadragon(osd_config);
	
	function isCanvasSupported(){
	  var elem = document.createElement('canvas');
	  return !!(elem.getContext && elem.getContext('2d'));
        }  
	      
	function updateTileSources(data) {
		// osd_config.tileSources.push(data);
		osd_config.tileSources = data;
	}
	
	function setOverlaySize() {
		var height = jQuery(window).height();
		var width = jQuery(window).width();
		
		var c = $('#container');
		var v = $('#viewer');

		c.width( width );
		c.height( height );	
		v.width( width );
		v.height( height );
		v.css("margin", "40px");
		v.css("background-color", $("#bg").css("background-color"));
		v.css("color", $("#bg").css("color"));

		$('.toolbar').width( width );	
	}
	
	function setViewerSize() {
			var dfd = new jQuery.Deferred();
		
			var m = $('#imgZoom'); //modal
			var c = $('#container');
			var v = $('#viewer');
		
			m.css({
				width: clientCoords().width - 100,
				height: "auto",
				top: 290,
				'margin-left': function () {
				    return -((clientCoords().width - 100) / 2);
				}
			});

			c.css("background-color", $("#bg").css("background-color"));
			c.css("color", $("#bg").css("color"));
			
			c.css('max-height', clientCoords().height - 190)
			
			// c.width( clientCoords().width - 100 );
			// c.height( clientCoords().height - 190 );
			v.width( clientCoords().width - 100 );
			v.height( clientCoords().height - 190 );
			$('.toolbar').width( clientCoords().width - 100 );
			
			dfd.resolve( "hurray" );
			
			return dfd.promise();
		}
	
	/* end LORIS stuff */
	
	$("#rotate").on("click", function(event){
		event.preventDefault();
		if(isCanvasSupported()){
			rotation = rotation + 90;
			if(rotation == 360){ rotation = 0; }
			o.viewport.setRotation(rotation);
		}else{
		    alert("Sorry, your browser doesn't support rotation.");
		}
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