// API URL
const API_URL = "http://localhost:5000";

// Speichere temporären Marker für Erstellung
let tempMarker = null;

// Aktuell ausgewählter Marker
let selectedMarkerId = null;

// Karte erstellen und auf Braunschweig zentrieren
const map = L.map("map").setView([52.26, 10.52], 12);

// OpenStreetMap als Hintergrundkarte einbinden
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Camera Button einbinden
createCameraButton();

// Speichere Marker-Objekte für später
let markers = {};

// ============================================================
// INITIALIZATION: Lade alle Marker beim Laden der Seite
// ============================================================
loadMarkers();

// ============================================================
// MARKER CREATION WITH POPUP
// ============================================================

/**
 * Erstellt einen temporären Marker mit Eingabeformular im Popup
 */
function createTempMarkerWithForm(lat, lng) {
    // Entferne alten temporären Marker falls vorhanden
    if (tempMarker) {
        map.removeLayer(tempMarker);
    }
    
    // Erstelle temporären Marker
    tempMarker = L.marker([lat, lng], {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(map);
    
    // Erstelle Popup mit Formular
    const popupContent = `
        <div style="width: 300px;">
            <h3>Neuer Marker</h3>
            <div style="margin: 10px 0;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Name *</label>
                <input type="text" id="tempMarkerName" placeholder="z.B. Rathaus" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box;">
            </div>
            <div style="margin: 10px 0;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Beschreibung</label>
                <textarea id="tempMarkerDesc" placeholder="Optionale Beschreibung..." style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; resize: vertical; height: 60px; box-sizing: border-box;"></textarea>
            </div>
            <div style="margin: 10px 0;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">📸 Foto</label>
                <div id="cameraButtonContainer" style="margin: 10px 0;"></div>
            </div>
            <div style="margin-top: 15px; display: flex; gap: 5px;">
                <button onclick="saveTempMarker(${lat}, ${lng})" style="flex: 1; padding: 8px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Speichern</button>
                <button onclick="cancelTempMarker()" style="flex: 1; padding: 8px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Abbrechen</button>
            </div>
        </div>
    `;
    
    tempMarker.bindPopup(popupContent);
    tempMarker.openPopup();
    
    // Nach dem Öffnen des Popups: Camera Button einfügen
    setTimeout(() => {
        const cameraContainer = document.getElementById("cameraButtonContainer");
        if (cameraContainer) {
            createCameraButtonInElement(cameraContainer, (imageData) => {
                // Speichere das Foto temporär
                window.tempMarkerPhoto = imageData;
            });
        }
        // Focusiere Name-Input
        document.getElementById("tempMarkerName").focus();
    }, 100);
}

/**
 * Speichert den temporären Marker
 */
async function saveTempMarker(lat, lng) {
    const name = document.getElementById("tempMarkerName").value.trim();
    const description = document.getElementById("tempMarkerDesc").value.trim();
    
    if (!name) {
        alert("Bitte geben Sie einen Marker-Namen ein");
        return;
    }
    
    // Hole das Foto aus der globalen Variable
    const photo = window.tempMarkerPhoto || null;
    
    // Erstelle Marker in der DB (mit Foto)
    await createMarkerInDB(name, description, lat, lng, photo);
    
    // Entferne temporären Marker
    if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
    }
    
    // Lösche das temporäre Foto
    window.tempMarkerPhoto = null;
}

/**
 * Bricht das Erstellen ab
 */
function cancelTempMarker() {
    if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
    }
}

// ============================================================
// MARKER MANAGEMENT FUNCTIONS
// ============================================================

/**
 * Lädt alle Marker von der API und zeigt sie auf der Karte an
 */
async function loadMarkers() {
    try {
        const response = await fetch(`${API_URL}/markers`);
        const geoJSON = await response.json();
        
        console.log("Markers loaded:", geoJSON);
        
        // Entferne alte Marker
        Object.values(markers).forEach(marker => map.removeLayer(marker.leafletMarker));
        markers = {};
        
        // Füge neue Marker zur Karte hinzu
        geoJSON.features.forEach(feature => {
            const { id, name, description, photo } = feature.properties;
            const [lng, lat] = feature.geometry.coordinates;
            
            console.log(`Marker ${id}: photo vorhanden?`, !!photo, `photo type:`, typeof photo);
            addMarkerToMap(id, name, description, lat, lng, photo);
        });
    } catch (err) {
        console.error("Error loading markers:", err);
        alert("Fehler beim Laden der Marker");
    }
}

/**
 * Fügt einen Marker zur Karte hinzu
 */
function addMarkerToMap(id, name, description, latitude, longitude, photo = null) {
    const marker = L.marker([latitude, longitude]).addTo(map);
    
    // Erstelle Popup-Inhalt mit Foto falls vorhanden
    let popupContent = `
        <div style="width: 300px;">
            <h3>${escapeHtml(name)}</h3>
            <p>${escapeHtml(description || "Keine Beschreibung")}</p>
    `;
    
    // Wenn ein Foto vorhanden ist, zeige es an
    if (photo) {
        popupContent += `<img src="${photo}" style="width: 100%; height: auto; margin-top: 10px; border-radius: 4px;">`;
    }
    
    // Füge Aktions-Buttons hinzu
    popupContent += `
            <div style="margin-top: 12px; display: flex; gap: 5px; flex-wrap: wrap;">
                <button onclick="editMarker(${id})" style="flex: 1; min-width: 70px; padding: 6px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">✏️ Edit</button>
                <button onclick="showNotes(${id})" style="flex: 1; min-width: 70px; padding: 6px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">📝 Notes</button>
                <button onclick="deleteMarkerPopup(${id})" style="flex: 1; min-width: 70px; padding: 6px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">🗑️ Delete</button>
            </div>
        </div>
    `;
    
    marker.bindPopup(popupContent);
    
    // Klick auf Marker → Auswählen im Kontrollpanel
    marker.on("click", () => {
        selectMarker(id);
        marker.openPopup();
    });
    
    // Speichere Marker
    markers[id] = {
        leafletMarker: marker,
        name: name,
        description: description,
        latitude: latitude,
        longitude: longitude,
        photo: photo
    };
    
    // Aktualisiere Statistiken
    updateMarkerCount();
}

/**
 * Wählt einen Marker aus und zeigt seine Details im Kontrollpanel
 */
function selectMarker(id) {
    selectedMarkerId = id;
    const marker = markers[id];
    
    // Update Marker Details im Panel
    document.getElementById("detailName").textContent = escapeHtml(marker.name);
    document.getElementById("detailDescription").textContent = escapeHtml(marker.description || "-");
    document.getElementById("detailCoordinates").textContent = `${marker.latitude.toFixed(4)}, ${marker.longitude.toFixed(4)}`;
    
    // Zeige Marker Details Section
    document.getElementById("markerDetailsSection").style.display = "block";
}

/**
 * Erstellt einen neuen Marker in der Datenbank
 */
async function createMarkerInDB(name, description, latitude, longitude, photo = null) {
    try {
        const response = await fetch(`${API_URL}/markers`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                description: description,
                latitude: latitude,
                longitude: longitude,
                photo: photo
            })
        });
        
        if (!response.ok) {
            throw new Error("Error creating marker");
        }
        
        const newMarker = await response.json();
        addMarkerToMap(newMarker.id, newMarker.name, newMarker.description, newMarker.latitude, newMarker.longitude, newMarker.photo);
        
        return newMarker.id;
    } catch (err) {
        console.error("Error creating marker:", err);
        alert("Fehler beim Erstellen des Markers");
    }
}

/**
 * Aktualisiert einen Marker
 */
async function updateMarkerInDB(id, name, description, latitude, longitude, photo = null) {
    try {
        const response = await fetch(`${API_URL}/markers/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                description: description,
                latitude: latitude,
                longitude: longitude,
                photo: photo
            })
        });
        
        if (!response.ok) {
            throw new Error("Error updating marker");
        }
        
        loadMarkers(); // Lade Marker neu
    } catch (err) {
        console.error("Error updating marker:", err);
        alert("Fehler beim Aktualisieren des Markers");
    }
}

/**
 * Löscht einen Marker
 */
async function deleteMarkerFromDB(id) {
    if (!confirm("Wirklich löschen?")) return;
    
    try {
        const response = await fetch(`${API_URL}/markers/${id}`, {
            method: "DELETE"
        });
        
        if (!response.ok) {
            throw new Error("Error deleting marker");
        }
        
        loadMarkers(); // Lade Marker neu
    } catch (err) {
        console.error("Error deleting marker:", err);
        alert("Fehler beim Löschen des Markers");
    }
}

// ============================================================
// NOTES MANAGEMENT FUNCTIONS
// ============================================================

/**
 * Zeigt alle Notizen für einen Marker an
 */
async function showNotes(markerId) {
    try {
        const response = await fetch(`${API_URL}/markers/${markerId}/notes`);
        const notes = await response.json();
        
        let notesHTML = `<div style="width: 300px; max-height: 400px; overflow-y: auto;">
            <h3>Notizen</h3>`;
        
        if (notes.length === 0) {
            notesHTML += `<p>Keine Notizen vorhanden</p>`;
        } else {
            notesHTML += `<ul>`;
            notes.forEach(note => {
                const date = new Date(note.created_at).toLocaleString('de-DE');
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
        
        // Zeige Modal
        const modal = document.getElementById("notesModal");
        modal.innerHTML = notesHTML;
        modal.style.display = "block";
        modal.dataset.markerId = markerId;
    } catch (err) {
        console.error("Error loading notes:", err);
        alert("Fehler beim Laden der Notizen");
    }
}

/**
 * Fügt eine Notiz zu einem Marker hinzu
 */
async function addNoteToMarker(markerId) {
    const noteText = document.getElementById("noteText").value;
    
    if (!noteText.trim()) {
        alert("Bitte geben Sie eine Notiz ein");
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/markers/${markerId}/notes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                note_text: noteText
            })
        });
        
        if (!response.ok) {
            throw new Error("Error adding note");
        }
        
        // Lade Notizen neu
        showNotes(markerId);
    } catch (err) {
        console.error("Error adding note:", err);
        alert("Fehler beim Hinzufügen der Notiz");
    }
}

/**
 * Löscht eine Notiz
 */
async function deleteNoteFromDB(noteId) {
    const markerId = document.getElementById("notesModal").dataset.markerId;
    
    try {
        const response = await fetch(`${API_URL}/notes/${noteId}`, {
            method: "DELETE"
        });
        
        if (!response.ok) {
            throw new Error("Error deleting note");
        }
        
        // Lade Notizen neu
        showNotes(markerId);
    } catch (err) {
        console.error("Error deleting note:", err);
        alert("Fehler beim Löschen der Notiz");
    }
}

/**
 * Schließt das Notizen-Modal
 */
function closeNotesModal() {
    document.getElementById("notesModal").style.display = "none";
}

// ============================================================
// MARKER EDITING
// ============================================================

/**
 * Bearbeitet den ausgewählten Marker
 */
function editSelectedMarker() {
    if (!selectedMarkerId) {
        alert("Kein Marker ausgewählt");
        return;
    }
    editMarker(selectedMarkerId);
}

/**
 * Löscht den ausgewählten Marker
 */
function deleteSelectedMarker() {
    if (!selectedMarkerId) {
        alert("Kein Marker ausgewählt");
        return;
    }
    
    if (!confirm("Wirklich löschen? Alle Notizen werden ebenfalls gelöscht.")) return;
    
    deleteMarkerFromDB(selectedMarkerId);
    selectedMarkerId = null;
    document.getElementById("markerDetailsSection").style.display = "none";
}

/**
 * Löscht einen Marker direkt über das Popup
 */
function deleteMarkerPopup(markerId) {
    if (!confirm("Wirklich löschen? Alle Notizen werden ebenfalls gelöscht.")) return;
    
    deleteMarkerFromDB(markerId);
    selectedMarkerId = null;
    document.getElementById("markerDetailsSection").style.display = "none";
}

/**
 * Zeigt die Notizen des ausgewählten Markers
 */
function showSelectedMarkerNotes() {
    if (!selectedMarkerId) {
        alert("Kein Marker ausgewählt");
        return;
    }
    showNotes(selectedMarkerId);
}

/**
 * Aktualisiert die Marker-Statistik
 */
function updateMarkerCount() {
    const count = Object.keys(markers).length;
    document.getElementById("markerCount").textContent = count;
}

/**
 * Bearbeitet einen bestehenden Marker mit Popup-Formular
 */
function editMarker(markerId) {
    const marker = markers[markerId];
    const leafletMarker = marker.leafletMarker;
    
    // Erstelle Popup mit Bearbeitungsformular
    const popupContent = `
        <div style="width: 250px;">
            <h3>Marker bearbeiten</h3>
            <div style="margin: 10px 0;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Name *</label>
                <input type="text" id="editMarkerName_${markerId}" value="${escapeHtml(marker.name)}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box;">
            </div>
            <div style="margin: 10px 0;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Beschreibung</label>
                <textarea id="editMarkerDesc_${markerId}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; resize: vertical; height: 60px; box-sizing: border-box;">${escapeHtml(marker.description)}</textarea>
            </div>
            <div style="margin-top: 15px; display: flex; gap: 5px;">
                <button onclick="saveEditedMarker(${markerId})" style="flex: 1; padding: 8px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Speichern</button>
                <button onclick="closeEditMarker(${markerId})" style="flex: 1; padding: 8px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Abbrechen</button>
            </div>
        </div>
    `;
    
    leafletMarker.bindPopup(popupContent);
    leafletMarker.openPopup();
    
    // Focusiere Name-Input
    setTimeout(() => {
        document.getElementById(`editMarkerName_${markerId}`).focus();
    }, 100);
}

/**
 * Speichert die bearbeiteten Marker-Daten
 */
async function saveEditedMarker(markerId) {
    const marker = markers[markerId];
    const name = document.getElementById(`editMarkerName_${markerId}`).value.trim();
    const description = document.getElementById(`editMarkerDesc_${markerId}`).value.trim();
    
    if (!name) {
        alert("Bitte geben Sie einen Marker-Namen ein");
        return;
    }
    
    // Update in DB
    await updateMarkerInDB(markerId, name, description, marker.latitude, marker.longitude);
    
    // Schließe Popup
    marker.leafletMarker.closePopup();
}

/**
 * Schließt das Bearbeitungs-Popup
 */
function closeEditMarker(markerId) {
    if (markers[markerId]) {
        markers[markerId].leafletMarker.closePopup();
    }
}

// ============================================================
// MAP INTERACTION - Click to create Marker
// ============================================================

/**
 * Listener für Klick auf die Karte - erstelle Marker mit Popup-Formular
 */
map.on("click", function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    
    // Erstelle temporären Marker mit Eingabeformular im Popup
    createTempMarkerWithForm(lat, lng);
});

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Escape HTML um XSS zu verhindern
 */
function escapeHtml(text) {
    if (!text) return "";
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

