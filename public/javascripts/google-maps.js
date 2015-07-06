

function setMarkers(map, locations) {
  for (var i = 0; i < locations.length; i++) {
    var myLatLng = new google.maps.LatLng(locations[i].latitude, locations[i].longitude);
    var marker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        title: locations[i].name
    });
  }
}

function initialize() {
    var stockholm = new google.maps.LatLng(59.325965, 18.067056);
    var mapOptions = {
        zoom: 12,
        center: stockholm
    };
    var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    $.getJSON('/tunnelbana/red/', function(data) {
        var tunnelbana = data;
        //console.log(JSON.stringify(data));
        setMarkers(map, tunnelbana);
    });
}


google.maps.event.addDomListener(window, 'load', initialize);