// ============================================================
// funksForApiInteraction.js
// Funktionen für die Interaktion der Karte mit der API
// ============================================================

// Erstellen eines Markers in der DB
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
        image, // Image Base64 code wird direkt überreicht und in API verwendet
      }),
    });

    if (!response.ok) throw new Error("Error creating marker", response);
    // Wenn response fehlerfrei dann erstellen des neuen Markers auf der Karte
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

// Funktion um alle gespeicherten Werte eines Markers durch angabe der ID
// zu laden. Gibt ein Objekt zurück mit den Werten des Markers.
async function getMarkerByID(id) {
  try {
    const response = await fetch(`${API_URL}/markers/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Error getting Marker by ID");
    let markus = await response.json();
    return markus;
  } catch (err) {
    console.error("Error updating marker:", err);
    alert("Fehler beim Aktualisieren des Markers");
  }
}

// Funktion zum aktualiseren eines Markers in der DB
// hier ist das relativ ineffizient gelöst aber durch
// Zeitmangel konnte das nicht weiter optimiert werden
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

// Funktion zum Löschen eines Markers in der DB
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

// Funktion zur Erstellung eines "zufälligen" "Passwortes" für die
// Verschlüsselung der Marker Bearbeitung
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
