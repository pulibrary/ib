// JavaScript Document
 /* LOCAL FUNCTIONS FOR FINDINGAIDS PAGE
  * ======================================================= */

$(function () {
	
	if (getCookie("showEAD") == 'true'){
		$(".eadinfo").show();
		$("#eadtoggle").html("Hide EAD Tools");
	}else{
		$(".eadinfo").hide();
		$("#eadtoggle").html("Show EAD Tools");
	}
	
	$("#eadtoggle").click(function () {
		//$(".eadinfo").toggle(flipCookie("showEAD"));
		$(".eadinfo").toggle(
			function() {
				
				if(flipCookie("showEAD")){
					$("#eadtoggle").html("Show EAD Tools");
				}else{
					$("#eadtoggle").html("Hide EAD Tools");
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
		var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
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