
// http://map-icons.com/
function getMarkerWithColor ( color ) {
    var marker = {
        path: 'M0-165c-27.618 0-50 21.966-50 49.054C-50-88.849 0 0 0 0s50-88.849 50-115.946C50-143.034 27.605-165 0-165z',
        fillColor: color,
        fillOpacity: 1,
        scale: 0.2,
        strokeWeight: 0
    };

    return marker;
}

var blueMarker = getMarkerWithColor('#428BCA');
var redMarker = getMarkerWithColor('#DF482B');
var greenMarker = getMarkerWithColor('#689f38');
var yellowMarker = getMarkerWithColor('#FEE530');


var infowindow = new google.maps.InfoWindow();

function makeInfoWindowEvent(map, infowindow, contentString, marker) {
  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(contentString);
    infowindow.open(map, marker);
  });
}

function setMarkers(map, locations, key, markerIcon) {
    for (var i = 0; i < locations.length; i++) {
        if ( 'latitude' in locations[i] && 'longitude' in locations[i] ) {
            var myLatLng = new google.maps.LatLng(locations[i].latitude, locations[i].longitude);
            var marker = new google.maps.Marker({
                position: myLatLng,
                map: map,
                title: locations[i][key],
                icon: markerIcon
            });

            var content = "<h3>"+ locations[i][key] +"</h3>";
            if ( 'uri' in locations[i] ) {
                content = '<a href="'+ locations[i].uri +'"><h3>' + locations[i][key] + '</h3></a>';
                if ( 'image' in locations[i] )
                    content += '<img src="'+ locations[i].image +'">';

                if ( 'price' in locations[i] )
                    content += '<p>'+ locations[i].price +' SEK/month</p>';
            }

            makeInfoWindowEvent(map, infowindow, content, marker);
        }
    }
}

// function initialize() {
//     var stockholm = new google.maps.LatLng(59.325965, 18.067056);
//     var mapOptions = {
//         zoom: 12,
//         center: stockholm
//     };
//     var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);


//     $.getJSON('/blocket/'+ lineOrColor +"/"+ distance + "/" + price + "/" + days, function(ads) {
//         setMarkers(map, ads, 'title', yellowMarker);



//         $.getJSON('/blocket/tunnelbana/blue/', function(tunnelbanaStations) {
//             setMarkers(map, tunnelbanaStations, 'name', blueMarker);
//         });
//         $.getJSON('/blocket/tunnelbana/green/', function(tunnelbanaStations) {
//             setMarkers(map, tunnelbanaStations, 'name', greenMarker);
//         });
//         $.getJSON('/blocket/tunnelbana/red/', function(tunnelbanaStations) {
//             setMarkers(map, tunnelbanaStations, 'name', redMarker);
//         });
//     });
// }

function initialize() {
    var stockholm = new google.maps.LatLng(59.325965, 18.067056);
    var mapOptions = {
        zoom: 12,
        center: stockholm
    };
    var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);


    $.getJSON('/blocket/'+ duration + "/" + price, function(ads) {
        setMarkers(map, ads, 'title', yellowMarker);



        $.getJSON('/blocket/tunnelbana/blue/', function(tunnelbanaStations) {
            setMarkers(map, tunnelbanaStations, 'name', blueMarker);
        });
        $.getJSON('/blocket/tunnelbana/green/', function(tunnelbanaStations) {
            setMarkers(map, tunnelbanaStations, 'name', greenMarker);
        });
        $.getJSON('/blocket/tunnelbana/red/', function(tunnelbanaStations) {
            setMarkers(map, tunnelbanaStations, 'name', redMarker);
        });
    });
}



google.maps.event.addDomListener(window, 'load', initialize);
