import 'normalize.css';
import './main.scss';

import * as turf from '@turf/turf';
import leaflet from 'leaflet';


function getIcon(allegiance: string): leaflet.Icon {
  const allegianceMap = {
    'K.D.': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    'K.L.': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    'Sabbat': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
    'Thinbloods': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
    'default': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  };

  return new leaflet.Icon({
    iconUrl: allegianceMap[allegiance] || allegianceMap['default'],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
}

async function downloadGeoJSON() {
  const index = await (await fetch('/static/index.json')).json();
  const kyivData = {
    'type': 'FeatureCollection',
    'features': [],
  };


  for (const file of index.filenames) {
    const data = await (await fetch(`/static/${file}`)).json();
    kyivData.features = [
      ...kyivData.features,
      ...data.features,
    ]
  }

  return kyivData;
}

function initMap(): leaflet.Map {
  const map = leaflet.map('map').setView([50.4470, 30.4865], 11.5);
  leaflet.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=sk.eyJ1Ijoia25pZGFya25lc3MiLCJhIjoiY2t6b2FjYnhvMDl3azJycGUyNGhkZHZndSJ9.kXUOPY3a4H0APG7MiDNVXA', {
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      id: 'mapbox/streets-v11',
      tileSize: 512,
      zoomOffset: -1,
      accessToken: 'sk.eyJ1Ijoia25pZGFya25lc3MiLCJhIjoiY2t6b2FjYnhvMDl3azJycGUyNGhkZHZndSJ9.kXUOPY3a4H0APG7MiDNVXA'
  }).addTo(map);

  return map;
}

function calculateArea(domain) {
  domain.features.forEach(f => {
    f.properties.area = f.geometry.type !== 'Polygon' ? 0 : turf.area(turf.polygon(f.geometry.coordinates));
  })
}

function drawMap(map, domain) {
  leaflet.geoJSON(domain, {
    style: (f) => {
      return {
        color: f.properties.color || 'blue',
        // interactive: !!f.properties.name,
      }
    },
    pointToLayer: function (feature, latlng) {
      
      return leaflet.marker(latlng, {
        icon: getIcon(feature.properties.allegiance),
      }); // The basic style
    },
    onEachFeature: (f, layer) => {
      if (f.properties.name) {
        layer.bindPopup(f.properties.name + '<br> Сторона: ' + f.properties.allegiance);
      }
    }
  }).addTo(map);
}

function getLegend(): leaflet.Control {
  const legend = new leaflet.Control({position: 'bottomleft'});

  legend.onAdd = (map: leaflet.Map) => {
    const div = leaflet.DomUtil.create('div', 'legend-block'),
          labels =  ['K.D', 'K.L', 'Thinbloods', 'Sabbat'];

    for (const item of labels) {
      div.innerHTML += `<div class="legend-row"><i class=${item.replace('.', '')}></i>${item}<br></div>`
    }

    return div;
  };

  return legend;
}

async function loaded() {
  const map = initMap();
  const domain = await downloadGeoJSON();
  calculateArea(domain);  

  domain.features = domain.features.sort((a, b) => {
    return a.properties.area > b.properties.area ? -1 : 1;
  })

  drawMap(map, domain);
  getLegend().addTo(map);

}

window.onload = loaded;