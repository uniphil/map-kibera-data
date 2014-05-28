
var map = L.map('map', {
  center: [-1.313, 36.788],
  zoom: 15,
  attributionControl: false
});
L.tileLayer('http://{s}.tiles.mapbox.com/v3/pschleihauf.ibp74ddd/{z}/{x}/{y}.png').addTo(map);
