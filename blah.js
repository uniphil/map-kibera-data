
var map = L.map('map', {
  center: [-1.313, 36.789],
  zoom: 15,
  zoomControl: false,
  attributionControl: false
});
L.tileLayer('http://{s}.tiles.mapbox.com/v3/pschleihauf.ic00e0o5/{z}/{x}/{y}.png').addTo(map);


var schools = [];
var properties = {};


// load data
getJSON('schools.geojson', function loadSchools(data) {
  data.features.forEach(function loadSchool(geo) {
    // fix coordinates order
    geo.geometry.coordinates.forEach(function swapCoords(c) { c.reverse(); });
    var circle = L.circle(geo.geometry.coordinates[0], 18, {
      color: '#400',
      stroke: false,
      fillOpacity: 0.75
    });
    circle.addTo(map);
    geo.circle = circle;
    geo.osm = Object.keys(geo.properties).some(function(key) { return startsWith(key, 'osm:') });
    geo.kenyaopendata = Object.keys(geo.properties).some(function(key) { return startsWith(key, 'kenyaopendata:') });
    schools.push(geo);
    Object.keys(geo.properties).forEach(function(key) {
      if (! (key in properties)) {
        properties[key] = {};
      }
      if (! (geo.properties[key] in properties[key])) {
        properties[key][geo.properties[key]] = 0;
      } else {
        properties[key][geo.properties[key]] += 1;
      }
    });
  });
  Object.keys(properties).forEach(function collapseObjKeys(propKey) {
    // turn the objects into arrays of the keys, sorted desc by the value (count)
    var propKeyArray = [];
    for (key in properties[propKey]) {
      propKeyArray.push([key, properties[propKey][key]]);
    }
    properties[propKey] = propKeyArray.sort(function sortProps(a, b) {
      return a[1] - b[1];
    }).reverse().map(function justProp(arr) {
      return arr[0];
    });
  })
  showPropertiesControl();
});


function showPropertiesControl() {
  var controlsContainer = document.getElementById('controls');
  controlsContainer.innerHTML += Object.keys(properties).map(function(key) {
    return '<a class="showproperty" href="#">' + key + '</a>';
  }).join('<br/>');
  document.getElementById('show-sources').addEventListener('click', handleShowSources);
  var propLinks = document.querySelectorAll('.showproperty');
  Array.prototype.forEach.call(propLinks, function registerShowHander(link) {
    link.addEventListener('click', function handleShowProperty() {
      var property = this.text;
      view(property, showProperty(property));
      return false;
    });
  });
}


// do stuff
var showSources = function showSources() {
  colorizer = keyColorizer(['osm', 'kenyaopendata']);
  schools.forEach(function (school) {
    school.circle.setLatLng(school.geometry.coordinates[0]);
    if (school.kenyaopendata) {
      school.circle.setStyle({color: colorizer['kenyaopendata']});
    } else {
      school.circle.setStyle({color: colorizer['osm']});
    }
  });
  return colorizer;
};


function showProperty(property) {
  colorizer = keyColorizer(properties[property]);
  schools.forEach(function showSchoolProperty(school) {
    if (property in school.properties) {
      school.circle.setStyle({color: colorizer[school.properties[property]]})
    } else {
      school.circle.setStyle({color: '#400'});
    }
  });
  return colorizer;
}


// helpful info
var legendKey = document.getElementById('legend-key');
var legendValues = document.getElementById('legend-values');
function view(key, colorizer) {
  legendKey.innerHTML = key;
  legendValues.innerHTML = Object.keys(colorizer).map(function(key) { return '<span class="circle" style="color: ' + colorizer[key] + '"> ' + key + '</span>' }).join('');
}


// bind controls
function handleShowSources() {
  view('source', showSources());
  return false;
}

// useful stuff...

function keyColorizer(keys) {
  var colorMap = {},
      palate = [
        //'#f00',
        '#f70',
        '#ff0',
        //'#8f0',
        '#0f0',
        '#0f8',
        '#0ff',
        '#08f',
        '#00f',
        '#80f',
        '#f0f',
        '#f08',
      ], others = '#999';
  for (var i=0; i<keys.length; i++) {
    var key = keys[i]
    if (i > (palate.length - 1)) {
      colorMap[key] = others;
    } else {
      colorMap[key] = palate[i];
    }
  }
  return colorMap;
}

function startsWith(str, startsWith) {
  return str.lastIndexOf(startsWith, 0) === 0;
};

function getJSON(url, callback) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.onload = function gotGet() {
    if (request.status >= 200 && request.status < 400) {
      data = JSON.parse(request.responseText);
      callback(data);
    } else {
      console.error('GET failed for url ' + url +
                    '; not running callback ' + callback);
    }
  };
  request.send();
}
