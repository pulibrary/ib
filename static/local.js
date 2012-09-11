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
	
	  /* attach a submit handler to the form */
	  $("#eadForm").submit(function(event) {

	    /* stop form from submitting normally */
	    event.preventDefault(); 
	        
	    /* get some values from elements on the page: */
	    var $form = $( this ),
	        c = $form.find( 'input[name="component_uri"]' ).val(),
	        n = $form.find( 'input[name="note"]' ).val(),
	        url = $form.attr( 'action' );
	        //alert(url);

	    $.ajax({
	    	  url: window.location.href,
	    	  type: "POST",
	    	  headers: { 
	    	        Accept : "text/html",
	    	        "Content-Type": "text/html"
	    	    },
	    	  data: { component_uri: c, note: n },
	    	  success: function(data) {
	    		var content = $( data ).find( '.error' );
	    		//alert(content);
	    		console.log(content);
		        $( "#result" ).empty().append( content );
	    	    //$('#result').html(data);
	    	    //alert(data);
	    	  }
	    	});
	    
	    /* Send the data using post and put the results in a div */
	    /*
	    $.post( window.location.href, { component_uri: c, note: n },
	      function( data ) {
	          var content = $( data ).find( 'body' );
	          $( "#result" ).empty().append( content );
	      }
	    );
	    */
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