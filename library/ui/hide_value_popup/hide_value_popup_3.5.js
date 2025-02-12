/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

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
