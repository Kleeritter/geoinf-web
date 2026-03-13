const API_URL = "https://negative-sybille-tubsgeoinfp-ffb32b8c.koyeb.app";

let tempMarker = null;
let selectedMarkerId = null;

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
var positron = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  },
);

const map = L.map("map", {
  center: [52.27, 10.53],
  zoom: 12,
  layers: [voyager],
});

let markers = {};
let klim_heatlayer;
let laerm_well_layer;
let aesthatic_layer;
let secure_well_layer;
let final_score_layer;
let boundaryPolygon = null;

const idwLegend = L.control({ position: "bottomleft" });

idwLegend.onAdd = function () {
  const div = L.DomUtil.create("div", "idw-legend");
  div.innerHTML = `
    <div class="idw-legend-title">Wohlfühlwert</div>
    <div class="idw-legend-gradient"></div>
    <div class="idw-legend-labels">
      <span>Unwohl</span>
      <span>Neutral</span>
      <span>Wohl</span>
    </div>
  `;
  return div;
};

var baseMaps = { voyager: voyager, OpenStreetMap: osm, Hell: positron };
var layerControl = L.control.layers(baseMaps, {}).addTo(map);

async function initMap() {
  const response = await fetch("./assets/BRUNS.geojson");
  const braunschweigGeoJSON = await response.json();

  boundaryPolygon = braunschweigGeoJSON;

  const boundaryLayer = L.geoJSON(braunschweigGeoJSON, {
    filter: (feature) =>
      feature.geometry.type === "Polygon" ||
      feature.geometry.type === "MultiPolygon",
    style: {
      color: "#3d6b44",
      weight: 3,
      fillColor: "transparent",
      opacity: 0.65,
    },
  }).addTo(map);

  const bounds = boundaryLayer.getBounds();
  map.fitBounds(bounds);
  //map.setMaxBounds(bounds);
  map.options.minZoom = 11;
  // Welt-Rechteck mit Stadtgrenze als Loch
  const worldCoords = [
    [
      [-90, -180],
      [-90, 180],
      [90, 180],
      [90, -180],
      [-90, -180],
    ],
  ];

  // Stadtgrenze-Koordinaten als Loch hinzufügen
  const rings = [];
  braunschweigGeoJSON.features
    ? braunschweigGeoJSON.features.forEach((f) => {
        const geom = f.geometry;
        if (geom.type === "Polygon") rings.push(...geom.coordinates);
        if (geom.type === "MultiPolygon")
          geom.coordinates.forEach((p) => rings.push(...p));
      })
    : (() => {
        const geom = braunschweigGeoJSON.geometry || braunschweigGeoJSON;
        if (geom.type === "Polygon") rings.push(...geom.coordinates);
        if (geom.type === "MultiPolygon")
          geom.coordinates.forEach((p) => rings.push(...p));
      })();

  const maskGeoJSON = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [...worldCoords, ...rings],
    },
  };

  L.geoJSON(maskGeoJSON, {
    style: {
      color: "none",
      weight: 0,
      fillColor: "white",
      fillOpacity: 1,
    },
  }).addTo(map);
  loadMarkers();
}

initMap();

/* // Button für "Marker am aktuellen Standort erstellen"
L.Control.LocateAndAddMarker = L.Control.extend({
  options: {
    position: 'topleft'
  },
  onAdd: function (map) {
    const container = L.DomUtil.create('div', 'leaflet-control-locate-and-add');

    container.innerHTML = '<button title="Marker am aktuellen Standort erstellen"><img src="./libs/gps-button/img/icon_gps_active.png" alt="Standort"></button>';

    container.onclick = function (event) {

        // Leaflet's Methode zum Stoppen der Event-Weitergabe, verhindert,
        //dass on klick auf dem Standort Button ein Marker beim Cursor erstellt wird
      L.DomEvent.stop(event);

      if (!navigator.geolocation) {
        alert("Geolocation wird von deinem Browser nicht unterstützt.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          createTempMarkerWithForm(latitude, longitude);
        },
        (error) => {
          let errorMessage = "Standort konnte nicht ermittelt werden.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Standortzugriff wurde verweigert. Bitte erlaube den Zugriff in den Browsereinstellungen.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Standortinformationen sind nicht verfügbar.";
              break;
            case error.TIMEOUT:
              errorMessage = "Die Standortabfrage hat zu lange gedauert.";
              break;
          }
          alert(errorMessage);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    return container;
  }
});

// Standort-Button zur Karte hinzufügen
map.addControl(new L.Control.LocateAndAddMarker()); */

async function saveTempMarker(lat, lng) {
  const name = document.getElementById("tempMarkerName").value.trim();
  const description = document.getElementById("tempMarkerDesc").value.trim();

  if (!name) {
    alert("Bitte geben Sie einen Marker-Namen ein");
    return;
  }

  await createMarkerInDB(name, description, lat, lng);

  if (tempMarker) {
    map.removeLayer(tempMarker);
    tempMarker = null;
  }
}

function cancelTempMarker() {
  if (tempMarker) {
    map.removeLayer(tempMarker);
    tempMarker = null;
  }
}

async function loadMarkers() {
  try {
    const response = await fetch(`${API_URL}/markers`);
    const geoJSON = await response.json();

    Object.values(markers).forEach((marker) =>
      map.removeLayer(marker.leafletMarker),
    );
    markers = {};

    geoJSON.features.forEach((feature) => {
      const {
        id,
        name,
        description,
        sec,
        klim_well,
        user_score,
        laerm_score,
        image_score,
        final_score,
        q1,
        q2,
        q3,
        q4,
        q5,
        q6,
        q7,
        q8,
        q9,
        q10,
        laerm_well,
        aesthatic_well,
        secure_well,
        image,
      } = feature.properties;
      const [lng, lat] = feature.geometry.coordinates;
      addMarkerToMap(
        id,
        name,
        description,
        lat,
        lng,
        sec,
        klim_well,
        user_score,
        laerm_score,
        image_score,
        final_score,
        q1,
        q2,
        q3,
        q4,
        q5,
        q6,
        q7,
        q8,
        q9,
        q10,
        laerm_well,
        aesthatic_well,
        secure_well,
        image,
      );
    });

    if (final_score_layer) {
      map.removeLayer(final_score_layer);
      layerControl.removeLayer(final_score_layer);
    }

    const points = geoJSON.features.map((f) => ({
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      value: f.properties.final_score,
    }));

    final_score_layer = createIDWLayer(points);
    final_score_layer.addTo(map);
    layerControl.addOverlay(final_score_layer, "Heatmap Final");
    idwLegend.addTo(map);
    klim_heatlayer = add_idw_layer(
      klim_heatlayer,
      "klim_well",
      geoJSON,
      "Heatmap Klima",
    );

    laerm_well_layer = add_idw_layer(
      laerm_well_layer,
      "laerm_well",
      geoJSON,
      "Heatmap Lärm",
    );

    aesthatic_layer = add_idw_layer(
      aesthatic_layer,
      "aesthatic_well",
      geoJSON,
      "Heatmap Aesthetic",
    );
    secure_well_layer = add_idw_layer(
      secure_well_layer,
      "secure_well",
      geoJSON,
      "Heatmap Secure",
    );
  } catch (err) {
    console.error("Error loading markers:", err);
    alert("Fehler beim Laden der Marker");
  }
}

function add_idw_layer(layer, proper, geoJSON, label) {
  if (layer) {
    map.removeLayer(layer);
    layerControl.removeLayer(layer);
  }
  const points = geoJSON.features.map((f) => ({
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    value: f.properties[proper],
  }));
  const newLayer = createIDWLayer(points);
  layerControl.addOverlay(newLayer, label);
  return newLayer;
}

var mIcon = L.icon({
  iconUrl: "./assets/location-dot-solid.png",
  //shadowUrl: "leaf-shadow.png",

  iconSize: [38, 38], // size of the icon
  //shadowSize: [50, 64], // size of the shadow
  //iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
  //shadowAnchor: [4, 62], // the same for the shadow
  //popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
});

function addMarkerToMap(
  id,
  name,
  description,
  latitude,
  longitude,
  sec,
  klim_well,
  user_score,
  laerm_score,
  image_score,
  final_score,
  q1,
  q2,
  q3,
  q4,
  q5,
  q6,
  q7,
  q8,
  q9,
  q10,
  laerm_well,
  aesthatic_well,
  secure_well,
  image,
) {
  const marker = L.marker([latitude, longitude], { icon: mIcon }).addTo(map);
  let lati =
    typeof latitude === "number"
      ? latitude.toFixed(4)
      : Number(latitude).toFixed(4);
  let longi =
    typeof longitude === "number"
      ? longitude.toFixed(4)
      : Number(longitude).toFixed(4);

  const popupContent = `
    <div class="mp">
      <img class="mp-img" alt="Foto" id="img-${id}">
      <div class="mp-body">
        <div class="mp-title-row">
          <span class="mp-title">${escapeHtml(name)}</span>
          <span class="mp-coords">${lati}, ${longi}</span>
        </div>
        <p class="mp-desc">${escapeHtml(description || "Keine Beschreibung")}</p>
        <div class="mp-gauge-label">Wohlfühlwert</div>
        <div id="gauge-${id}" class="mp-gauge"></div>
        <button class="mp-edit-btn" onclick="createTempMarkerWithForm(${latitude}, ${longitude}, true, ${id}, '${name}', '${sec}')">
          <i class="fa-solid fa-pen-to-square"></i> Eintrag bearbeiten
        </button>
      </div>
    </div>
  `;

  marker.bindPopup(popupContent, { maxWidth: 260, minWidth: 260 });

  marker.on("popupopen", () => {
    setTimeout(() => {
      const el = document.getElementById(`gauge-${id}`);
      if (!el || !window.Plotly) return;
      Plotly.newPlot(
        el,
        [
          {
            type: "indicator",
            mode: "gauge+number",
            value: final_score ?? 5,
            number: {
              suffix: "/10",
              font: { size: 18, color: "#1a2e1c", family: "DM Sans" },
            },
            gauge: {
              axis: {
                range: [0, 10],
                tickfont: { size: 8, color: "#bbb" },
                nticks: 6,
              },
              bar: { color: "#3d6b44", thickness: 0.28 },
              bgcolor: "white",
              borderwidth: 0,
              steps: [
                { range: [0, 3.5], color: "#fde8e8" },
                { range: [3.5, 6.5], color: "#fef9e7" },
                { range: [6.5, 10], color: "#e8f5e9" },
              ],
              threshold: {
                line: { color: "#2d5233", width: 3 },
                thickness: 0.75,
                value: final_score ?? 5,
              },
            },
          },
        ],
        {
          margin: { t: 10, b: 0, l: 20, r: 20 },
          paper_bgcolor: "transparent",
          font: { family: "DM Sans" },
          height: 110,
          width: 220,
        },
        { displayModeBar: false, staticPlot: true, responsive: false },
      );

      if (image) {
        const imgEl = document.getElementById(`img-${id}`);
        if (imgEl) imgEl.src = `http://localhost:5001${image}`;
      } else {
        const imgEl = document.getElementById(`img-${id}`);
        imgEl.src = "./assets/placeholder.png";
      }
    }, 50); // kurze Verzögerung damit DOM bereit ist
  });

  marker.bindPopup(popupContent);
  marker.on("click", () => {
    //selectMarker(id);
    marker.openPopup();
  });

  markers[id] = {
    leafletMarker: marker,
    name,
    description,
    latitude,
    longitude,
  };
}

/**
 * Bild eines Markers aktualisieren (löschen + neu hochladen)
 */
async function updateMarkerImage(id, newImageBase64) {
  try {
    // 1. Altes Bild löschen (über API)
    await fetch(`${API_URL}/markers/${id}/image`, {
      method: "DELETE",
    });

    // 2. Marker-Daten abrufen
    const marker = await getMarkerByID(id);

    // 3. Marker mit aktualisierten Daten (neues Bild) speichern
    const response = await fetch(`${API_URL}/markers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...marker,
        image: newImageBase64,
      }),
    });

    if (!response.ok) throw new Error("Fehler beim Aktualisieren des Bildes");

    // Marker neu laden
    await loadMarkers();
    return true;
  } catch (err) {
    console.error("Error updating marker image:", err);
    alert("Fehler beim Aktualisieren des Bildes");
    return false;
  }
}

/**
 * Bild eines Markers nur löschen
 */
async function deleteMarkerImageOnly(id) {
  if (!confirm("Möchtest du das Bild wirklich löschen?")) return false;

  try {
    const response = await fetch(`${API_URL}/markers/${id}/image`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Fehler beim Löschen des Bildes");

    // Marker neu laden
    await loadMarkers();
    return true;
  } catch (err) {
    console.error("Error deleting marker image:", err);
    alert("Fehler beim Löschen des Bildes");
    return false;
  }
}

async function createMarkerInDB(
  name,
  description,
  latitude,
  longitude,
  klim_well,
  sec,
  user_score,
  laerm_score,
  image_score,
  final_score,
  q1,
  q2,
  q3,
  q4,
  q5,
  q6,
  q7,
  q8,
  q9,
  q10,
  laerm_well,
  aesthatic_well,
  secure_well,
  image,
) {
  try {
    //const image_without_base = image.replace(/^data:image\/[a-z]+;base64,/, "");
    //console.log(image_without_base);

    const response = await fetch(`${API_URL}/markers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        latitude,
        longitude,
        klim_well,
        sec,
        user_score,
        laerm_score,
        image_score,
        final_score,
        q1,
        q2,
        q3,
        q4,
        q5,
        q6,
        q7,
        q8,
        q9,
        q10,
        laerm_well,
        aesthatic_well,
        secure_well,
        image, //.replace(/^data:image\/[a-z]+;base64,/, ""),
      }),
    });

    if (!response.ok) throw new Error("Error creating marker", response);

    const newMarker = await response.json();
    addMarkerToMap(
      newMarker.id,
      newMarker.name,
      newMarker.description,
      newMarker.latitude,
      newMarker.longitude,
      newMarker.klim_well,
      newMarker.sec,
      newMarker.user_score,
      newMarker.laerm_score,
      newMarker.image_score,
      newMarker.final_score,
      newMarker.q1,
      newMarker.q2,
      newMarker.q3,
      newMarker.q4,
      newMarker.q5,
      newMarker.q6,
      newMarker.q7,
      newMarker.q8,
      newMarker.q9,
      newMarker.q10,
      newMarker.laerm_well,
      newMarker.aesthatic_well,
      newMarker.secure_well,
      newMarker.image,
    );
    return newMarker.id;
  } catch (err) {
    console.error("Error creating marker:", err);
    alert("Fehler beim Erstellen des Markers");
  }
}

async function getMarkerByID(id) {
  try {
    const response = await fetch(`${API_URL}/markers/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Error getting Marker by ID");
    //loadMarkers();
    let markus = await response.json();
    return markus;
  } catch (err) {
    console.error("Error updating marker:", err);
    alert("Fehler beim Aktualisieren des Markers");
  }
}

async function updateMarkerInDB(
  id,
  name,
  description,
  latitude,
  longitude,
  klim_well,
  sec,
  user_score,
  laerm_score,
  image_score,
  final_score,
  q1,
  q2,
  q3,
  q4,
  q5,
  q6,
  q7,
  q8,
  q9,
  q10,
  laerm_well,
  aesthatic_well,
  secure_well,
  image,
) {
  try {
    const response = await fetch(`${API_URL}/markers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        latitude,
        longitude,
        klim_well,
        sec,
        user_score,
        laerm_score,
        image_score,
        final_score,
        q1,
        q2,
        q3,
        q4,
        q5,
        q6,
        q7,
        q8,
        q9,
        q10,
        laerm_well,
        aesthatic_well,
        secure_well,
        image,
      }),
    });

    if (!response.ok) throw new Error("Error updating marker");
    loadMarkers();
  } catch (err) {
    console.error("Error updating marker:", err);
    alert("Fehler beim Aktualisieren des Markers");
  }
}

async function deleteMarkerFromDB(id) {
  if (!confirm("Wirklich löschen?")) return;

  try {
    const response = await fetch(`${API_URL}/markers/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Error deleting marker");
    loadMarkers();
  } catch (err) {
    console.error("Error deleting marker:", err);
    alert("Fehler beim Löschen des Markers");
  }
}

async function showNotes(markerId) {
  try {
    const response = await fetch(`${API_URL}/markers/${markerId}/notes`);
    const notes = await response.json();

    let notesHTML = `<div style="width: 300px; max-height: 400px; overflow-y: auto;"><h3>Notizen</h3>`;

    if (notes.length === 0) {
      notesHTML += `<p>Keine Notizen vorhanden</p>`;
    } else {
      notesHTML += `<ul>`;
      notes.forEach((note) => {
        const date = new Date(note.created_at).toLocaleString("de-DE");
        notesHTML += `
          <li>
            <p>${escapeHtml(note.note_text)}</p>
            <small>${date}</small>
            <button onclick="deleteNoteFromDB(${note.id})" style="color: red; font-size: small;">Löschen</button>
          </li>
        `;
      });
      notesHTML += `</ul>`;
    }

    notesHTML += `
      <textarea id="noteText" placeholder="Neue Notiz..."></textarea><br>
      <button onclick="addNoteToMarker(${markerId})">Notiz hinzufügen</button>
      <button onclick="closeNotesModal()">Schließen</button>
    </div>`;

    const modal = document.getElementById("notesModal");
    modal.innerHTML = notesHTML;
    modal.style.display = "block";
    modal.dataset.markerId = markerId;
  } catch (err) {
    console.error("Error loading notes:", err);
    alert("Fehler beim Laden der Notizen");
  }
}

async function addNoteToMarker(markerId) {
  const noteText = document.getElementById("noteText").value;

  if (!noteText.trim()) {
    alert("Bitte geben Sie eine Notiz ein");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/markers/${markerId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note_text: noteText }),
    });

    if (!response.ok) throw new Error("Error adding note");
    showNotes(markerId);
  } catch (err) {
    console.error("Error adding note:", err);
    alert("Fehler beim Hinzufügen der Notiz");
  }
}

async function deleteNoteFromDB(noteId) {
  const markerId = document.getElementById("notesModal").dataset.markerId;

  try {
    const response = await fetch(`${API_URL}/notes/${noteId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Error deleting note");
    showNotes(markerId);
  } catch (err) {
    console.error("Error deleting note:", err);
    alert("Fehler beim Löschen der Notiz");
  }
}

function closeNotesModal() {
  document.getElementById("notesModal").style.display = "none";
}

map.on("click", function (e) {
  const { lat, lng } = e.latlng;
  if (!isInsideBoundary(lat, lng)) return;
  createTempMarkerWithForm(lat, lng);
});

function escapeHtml(text) {
  if (!text) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function isInsideBoundary(lat, lng) {
  if (!boundaryPolygon) return true;

  const rings = [];
  boundaryPolygon.features
    ? boundaryPolygon.features.forEach((f) => {
        const geom = f.geometry;
        if (geom.type === "Polygon") rings.push(geom.coordinates[0]);
        if (geom.type === "MultiPolygon")
          geom.coordinates.forEach((p) => rings.push(p[0]));
      })
    : (() => {
        const geom = boundaryPolygon.geometry || boundaryPolygon;
        if (geom.type === "Polygon") rings.push(geom.coordinates[0]);
        if (geom.type === "MultiPolygon")
          geom.coordinates.forEach((p) => rings.push(p[0]));
      })();

  return rings.some((ring) => pointInPolygon(lat, lng, ring));
}

function pointInPolygon(lat, lng, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
