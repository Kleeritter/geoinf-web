// ============================================================
// funksForMap.Js
// Funktionen für die Darstellung der Karte und des Hinzufügens
// von Markern
// ============================================================

// Hinzufügen von Markern
function addMarkerToMap(
  id,
  name,
  description,
  latitude,
  longitude,
  sec,
  final_score,
  image,
) {
  const marker = L.marker([latitude, longitude], { icon: mIcon }).addTo(map);
  // Kürzen der Koordinaten für die Darstellung
  let lati =
    typeof latitude === "number"
      ? latitude.toFixed(4)
      : Number(latitude).toFixed(4);
  let longi =
    typeof longitude === "number"
      ? longitude.toFixed(4)
      : Number(longitude).toFixed(4);
  // Popup-Darstellung beim anklicken eines Bestehenden Markers
  // Einträge können bearbeitet werden wenn der User das Passwort kennt
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

  marker.bindPopup(popupContent, { maxWidth: 260, minWidth: 260 }); //Popup dem Marker hinzufügen

  // Für den Finalenscore gibt es im Popup eine kleine Plotlygrafik.
  // Weill Plotly aber erst einen bestehden Canvas braucht muss kurz gewartet werden bis dieser Verfügbar
  // ist.
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
          // Einstellungen für den Plot
          margin: { t: 10, b: 0, l: 20, r: 20 },
          paper_bgcolor: "transparent",
          font: { family: "DM Sans" },
          height: 110,
          width: 220,
        },
        { displayModeBar: false, staticPlot: true, responsive: false },
      );
      // Dem Popup wird auch ein Image hinzugefügt in den Bestehenden
      // Imagecontainer
      if (image) {
        const imgEl = document.getElementById(`img-${id}`);
        if (imgEl)
          imgEl.src = `https://negative-sybille-tubsgeoinfp-ffb32b8c.koyeb.app/${image}`;
      } else {
        const imgEl = document.getElementById(`img-${id}`);
        imgEl.src = "./assets/placeholder.png";
      }
    }, 50);
  });

  marker.bindPopup(popupContent);
  // Wenn auf einen Marker geklickt wird öfnet Leaflet das Popup
  marker.on("click", () => {
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

// Hilfsfunktion um zuverhindern das Html Code injected wird in das Popup
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

// Funktion um zu prüfen ob Koordinate in der Stadt sind
function isInsideBoundary(lat, lng) {
  if (!boundaryPolygon) return true;

  const rings = [];
  // Funktion extrahiert hier mehrere Polygone aus einem vorgegeben geojson
  //
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
// Funktion überprüft ob gegebener Punkt sich im Stadtpolygon befindet
function pointInPolygon(lat, lng, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside; // Wenn es Überschneidung der Mengen gibt ist es drinne
  }
  return inside;
}

//Funktion um die Marker einzuladen
async function loadMarkers() {
  try {
    // Abfragen aller Marker in DB und speichern in GeoJson
    const response = await fetch(`${API_URL}/markers`);
    const geoJSON = await response.json();

    // Bestehende Marker leeren
    Object.values(markers).forEach((marker) =>
      map.removeLayer(marker.leafletMarker),
    );
    markers = {};
    // Aus dem Geojson werden die notwendingen Features extrahiert und der Karte hinzugefügt
    geoJSON.features.forEach((feature) => {
      const { id, name, description, sec, final_score, image } =
        feature.properties;
      const [lng, lat] = feature.geometry.coordinates;
      addMarkerToMap(id, name, description, lat, lng, sec, final_score, image);
    });

    // Interpolierte Layer hinzufügen
    /// Erst Alte Layer removen
    if (final_score_layer) {
      map.removeLayer(final_score_layer);
      layerControl.removeLayer(final_score_layer);
    }
    /// Dann Messpunkte aus Layer extrahieren und zu tripel
    const points = geoJSON.features.map((f) => ({
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      value: f.properties.final_score,
    }));
    /// Aufrufen der Inverse Distance Interpolation
    final_score_layer = createIDWLayer(points);
    /// Final hinzufügen zur Karte und dem Overlay
    final_score_layer.addTo(map);
    layerControl.addOverlay(final_score_layer, "Gesamtwohlfühlscore");
    //Legende hinzufügen
    idwLegend.addTo(map);
    // Widerholen des IDW Interpolierens für klim_well
    klim_heatlayer = add_idw_layer(
      klim_heatlayer,
      "klim_well",
      geoJSON,
      "Wohlfühlscore Klima",
    );

    // Widerholen des IDW Interpolierens für laerm_well
    laerm_well_layer = add_idw_layer(
      laerm_well_layer,
      "laerm_well",
      geoJSON,
      "Wohlfühlscore Lärm",
    );

    // Widerholen des IDW Interpolierens für laerm_score
    laerm_layer = add_idw_layer(
      laerm_layer,
      "laerm_score",
      geoJSON,
      "Gemessemer Lärm",
    );

    // Widerholen des IDW Interpolierens für aesthatic_well
    aesthatic_layer = add_idw_layer(
      aesthatic_layer,
      "aesthatic_well",
      geoJSON,
      "Wohlfühlscore Ästhetik",
    );

    // Widerholen des IDW Interpolierens für secure_well
    secure_well_layer = add_idw_layer(
      secure_well_layer,
      "secure_well",
      geoJSON,
      "Wohlfühlscore Sicherheit",
    );
  } catch (err) {
    console.error("Error loading markers:", err);
    alert("Fehler beim Laden der Marker");
  }
}

// Funktion zur autmatisierten Hinzufügung von IDW Layern
function add_idw_layer(layer, proper, geoJSON, label) {
  // Bestehnden Layer löschen
  if (layer) {
    map.removeLayer(layer);
    layerControl.removeLayer(layer);
  }
  /// Dann Messpunkte aus Layer extrahieren und zu tripel
  const points = geoJSON.features.map((f) => ({
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    value: f.properties[proper],
  }));

  // IDW Ausführen und dem Layer hinzufügen
  const newLayer = createIDWLayer(points);
  layerControl.addOverlay(newLayer, label);
  return newLayer;
}

// Finale Map Initialisierung
async function initMap() {
  // Laden des Braunschweigauschnits
  // Wurde von https://overpass-turbo.eu mit der Query
  //
  //  [out:json][timeout:25];
  //  relation["name"="Braunschweig"]["admin_level"="6"];
  //  out geom;
  //
  // bestimmt
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

  // Zoomen der Karte so das ganz Braunschweig sichtbar
  const bounds = boundaryLayer.getBounds();
  map.fitBounds(bounds);
  map.options.minZoom = 11;

  // Welt-Rechteck mit Stadtgrenze als Loch, wenn user rauzoomt bleibt der Baselayer verdeckt da wo nicht
  // Braunschweig ist
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
  // Hinzufügen des weißen Hintergrundlayers der über Basemap angezeigft wird
  L.geoJSON(maskGeoJSON, {
    style: {
      color: "none",
      weight: 0,
      fillColor: "white",
      fillOpacity: 1,
    },
  }).addTo(map);
  loadMarkers();
  map.addLayer(voyager);
}
