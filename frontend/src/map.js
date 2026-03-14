// ============================================================
// MAP.Js
// Initialisierung der Karte und des einladens der
// Daten von der API
// ============================================================

// Initialisierung

let tempMarker = null;
let selectedMarkerId = null;
let markers = {};
let klim_heatlayer;
let laerm_well_layer;
let aesthatic_layer;
let secure_well_layer;
let final_score_layer;
let laerm_layer;
let boundaryPolygon = null;

// Initialisierung der API
const API_URL = "https://negative-sybille-tubsgeoinfp-ffb32b8c.koyeb.app";

// Initialisierung der Karte
var osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
});

var voyager = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  },
);

const map = L.map("map", {
  center: [52.27, 10.53],
  zoom: 12,
  layers: [osm],
});

// OSM ist die Baselayer Karte, wird NUR dargestellt wenn kein Layer aktiv

const overlayLayers = new Set();
map.on("overlayadd", (e) => {
  overlayLayers.add(e.name);
  if (overlayLayers.size > 0) {
    map.removeLayer(osm);
    if (!map.hasLayer(voyager)) map.addLayer(voyager);
  }
});
map.on("overlayremove", (e) => {
  overlayLayers.delete(e.name);
  if (overlayLayers.size === 0) {
    map.removeLayer(voyager);
    if (!map.hasLayer(osm)) map.addLayer(osm);
  }
});

// Initialisierung der Legende

const idwLegend = L.control({ position: "bottomleft" });

idwLegend.onAdd = function () {
  const div = L.DomUtil.create("div", "idw-legend");
  div.innerHTML = `
    <div class="idw-legend-title">Wohlfühlwert</div>
    <div class="idw-legend-gradient"></div>
    <div class="idw-legend-labels">
      <div>Unwohl</div>
      <div>Neutral</div>
      <div>Wohl</div>
    </div>
  `;
  return div;
};

// Initialisierung der Layerkontroll
// Controll ist leer und wird erst gefüllt wenn interpolierte Werte berechnet werden

var layerControl = L.control.layers({}, {}).addTo(map);

// Definition des Icons
var mIcon = L.icon({
  iconUrl: "./assets/location-dot-solid.png",
  iconSize: [38, 38],
});

// Finale Karten Initialisierung

initMap();

// Nur wenn im Auschnitt (also in Braunschweig) geklickt wird kann ein Marker erzeugt werden
map.on("click", function (e) {
  const { lat, lng } = e.latlng;
  if (!isInsideBoundary(lat, lng)) return;
  createTempMarkerWithForm(lat, lng);
});
