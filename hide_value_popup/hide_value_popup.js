lizMap.events.on({
  'lizmappopupdisplayed': function(e){
    //For a public user
    if( $('#info-user-login').text()=="" ){
    //Hide a value in the popup
    $("div.menu-content div.lizmapPopupContent td:contains('Test1')").html("**********");
    $("div.menu-content div.lizmapPopupContent td:contains('Test2')").html("**********");
    }
    else {
    }
}
});
