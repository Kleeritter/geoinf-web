// ============================================================
// Popup.js
// Funktionen für die Darstellung des Popups bei Erstellung
// Bearbeitung von Markern.
//
// ============================================================

// Zustand für den Fragebogen Initialisieren
let popupState = { page: 1, stars: { safety: 0, stay: 0, attr: 0, greens: 0 } }; // Zustand der Sterne
const POPUP_TOTAL = 8; // Seiten des Popups die Numeriert werden
let deletediamge; // Wurde Bild gelöscht
let measurednoise;
let imagus;
let originalImageData;
let imagescore;

// Titel der Seiten
const PP_TITLES = [
  { title: "Ort benennen", sub: "Grundlegende Informationen" },
  {
    title: "Umwelt & Klimatologie",
    sub: "Temperatur, Verschattung, Luftqualität",
  },
  { title: "Lärm", sub: "Lautstärke" },
  { title: "Ästhetik", sub: "Attraktivität und Grünflächen" },
  { title: "Sicherheit", sub: "Sicherheit" },
  { title: "Modellkalibrierung", sub: "Kleidung und Bewegung" },
  { title: "Bildeindruck", sub: "Bildliche Bewertung" },
  {
    title: "Grünanteilbestimmung",
    sub: "Pink markierte Bereiche = Als Natur-Grün erkannt.",
  },
];

function createTempMarkerWithForm(
  lat,
  lng,
  editing = false,
  id = null,
  name = "",
  sec = "",
) {
  if (tempMarker) map.removeLayer(tempMarker);
  deletediamge = false;
  // Temporären Marker während des Bearbeitens hinzufügen
  tempMarker = L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: "./assets/location-dot-solid.png",

      iconSize: [38, 38],
    }),
  }).addTo(map);

  //popupstate resetten
  popupState = { page: 1, stars: { safety: 0, stay: 0 } };

  const popupContent = `
    <div class="popup-container">
      <div class="popup-progress-bar" id="popupProgressdiv" >
        <div class="popup-progress-fill" id="popupProgress" style="width:25%"></div>
      </div>

      <div class="popup-header">
        <span class="popup-page-indicator" id="popupIndicator"></span>
      </div>

      <div class="popup-title">
        <h3 id="popupTitle">Ort benennen</h3>
        <p id="popupSubtitle">Grundlegende Informationen</p>
      </div>

      <div class="popup-page"} id="pp-0">
        <div class="popup-field">
          <label>Bearbeitungspasswort</label>
          <input type="text" id="pp-seck">
        </div>
      </div>

      <!-- Seite 1: Basics -->
      <div class="popup-page active" id="pp-1">
        <div class="popup-field">
          <label>Name des Ortes *</label>
          <input type="text" id="pp-name" placeholder="z.B. Stadtpark Nördlich">
        </div>
        <div class="popup-field">
          <label>Kurze Beschreibung</label>
          <textarea id="pp-desc" placeholder="Was befindet sich hier?"></textarea>
        </div>
        <div class="popup-field">
          <label>Koordinaten</label>
          <button class="popup-btn-placeholder" onclick="getCurrentLocationForPopup(this)">
            <i class="fa-solid fa-location-crosshair"></i><i class="fa-solid fa-location-crosshairs"></i> Aktuellen Standort verwenden
          </button>
          <div id="popup-coordinates-display" style="font-size: 11px; color: #777; margin-top: 5px; display: none;">
            Ermittelte Koordinaten: <span id="popup-coords-lat"></span>, <span id="popup-coords-lng"></span>
          </div>
        </div>
        <!--Löschen Button (nur angezeigt wenn im Bearbeiten Modus) -->
        <div class="popup-field" style="${!editing ? "display:none" : "display:block"}">
          <button class="popup-btn-next popup-dng" onclick="deleteMarkerFromDB(${id})">
          <i class="fa-solid fa-trash-can"></i> Marker aus Datenbank löschen
          </button>
        </div>
      </div>

      <!-- Seite 2: Klimatologie -->
      <div class="popup-page" id="pp-2">
        <div class="popup-field">
          <label>Wie angenehm empfinden Sie die Temperatur an diesem Ort?</label>
          <div class="popup-slider-wrap">
            <input type="range" min="1" max="10" value="5" id="pp-q1"
              oninput="document.getElementById('pp-q1Val').textContent=this.value">
            <span class="popup-slider-val" id="pp-q1Val">5</span>
          </div>
          <div class="popup-slider-labels"><span>sehr unangenehm</span><span>sehr angenehm</span></div>
        </div>
        <div class="popup-field">
          <label>Wie gut ist das Verhältnis zwischen Sonne und Schatten an diesem Ort? </label>
          <div class="popup-slider-wrap">
            <input type="range" min="1" max="10" value="5" id="pp-q2"
              oninput="document.getElementById('pp-q2Val').textContent=this.value">
            <span class="popup-slider-val" id="pp-q2Val">5</span>
          </div>
          <div class="popup-slider-labels"><span>sehr schlecht</span><span>sehr gut</span></div>
        </div>
      </div>

      <!-- Seite 3: Lärm -->
      <div class="popup-page" id="pp-3">
        <div class="popup-field">
          <label>Wie störend empfinden Sie den Lärm an diesem Ort</label>
          <div class="popup-slider-wrap">
            <input type="range" min="1" max="10" value="5" id="pp-q3"
              oninput="document.getElementById('pp-q3Val').textContent=this.value">
            <span class="popup-slider-val" id="pp-q3Val">5</span>
          </div>
          <div class="popup-slider-labels"><span>sehr störend</span><span>kaum störend</span></div>
           <button class="popup-btn-placeholder" style="margin-top:7px" onclick="ppMeasureNoise(this)">
             <i class="fa-solid fa-microphone-lines"></i> Lärm jetzt messen
           </button>
           <div id="pp-noiseStatus" style="margin-top:6px; font-size:0.9em;"></div>
        </div>
        <div class="popup-field">
          <label>Wie ruhig empfinden Sie diesen Ort insgesamt? </label>
          <div class="popup-slider-wrap">
            <input type="range" min="1" max="10" value="5" id="pp-q4"
              oninput="document.getElementById('pp-q4Val').textContent=this.value">
            <span class="popup-slider-val" id="pp-q4Val">5</span>
          </div>
          <div class="popup-slider-labels"><span>sehr laut</span><span>sehr ruhig</span></div>
        </div>
      </div>



      <!-- Seite 3: Ästhetik -->
      <div class="popup-page" id="pp-4">
        <div class="popup-field">
          <label>Wie attraktiv finden Sie diesen Ort?</label>
          <div class="popup-stars" id="pp-attrStars">
            <span onclick="ppSetStars('attr',1)"><i class="fa-solid fa-star"></i></span>
            <span onclick="ppSetStars('attr',2)"><i class="fa-solid fa-star"></i></span>
            <span onclick="ppSetStars('attr',3)"><i class="fa-solid fa-star"></i></span>
            <span onclick="ppSetStars('attr',4)"><i class="fa-solid fa-star"></i></span>
            <span onclick="ppSetStars('attr',5)"><i class="fa-solid fa-star"></i></span>
          </div>
        </div>
        <div class="popup-field">
          <label>Wie angenehm ist die Umgebung hinsichtlich Grünflächen oder Natur?</label>
          <div class="popup-stars" id="pp-greensStars">
            <span onclick="ppSetStars('greens',1)"><i class="fa-solid fa-star"></i></span>
            <span onclick="ppSetStars('greens',2)"><i class="fa-solid fa-star"></i></span>
            <span onclick="ppSetStars('greens',3)"><i class="fa-solid fa-star"></i></span>
            <span onclick="ppSetStars('greens',4)"><i class="fa-solid fa-star"></i></span>
            <span onclick="ppSetStars('greens',5)"><i class="fa-solid fa-star"></i></span>
          </div>
        </div>

      </div>
      <!-- Seite 4: Sicherheit und Nutzung -->
      <div class="popup-page" id="pp-5">
        <div class="popup-field">
          <label>Wie sicher fühlen Sie sich an diesem Ort?</label>
          <div class="popup-stars" id="pp-safetyStars">
            <span onclick="ppSetStars('safety',1)"><i class="fa-solid fa-star"></i></span>
            <span onclick="ppSetStars('safety',2)"><i class="fa-solid fa-star"></i></span>
            <span onclick="ppSetStars('safety',3)"><i class="fa-solid fa-star"></i></span>
            <span onclick="ppSetStars('safety',4)"><i class="fa-solid fa-star"></i></span>
            <span onclick="ppSetStars('safety',5)"><i class="fa-solid fa-star"></i></span>
          </div>
        </div>
        <div class="popup-field">
          <label>Wie fühlen Sie sich mit der Anzahl der Menschen an diesem Ort?</label>
          <div class="popup-slider-wrap">
            <input type="range" min="1" max="10" value="5" id="pp-q8"
              oninput="document.getElementById('pp-q8Val').textContent=this.value">
            <span class="popup-slider-val" id="pp-q8Val">5</span>
          </div>
          <div class="popup-slider-labels"><span>sehr unwohl</span><span>sehr wohl</span></div>
        </div>
      </div>

      <!-- Seite 5: Modellkalibrierung -->
      <div class="popup-page" id="pp-6">
     <div class="popup-field" >
        <label">Was trägst du gerade?</label>
        <div class="pp-clothing-grid">
          <button class="pp-cloth-btn" data-value="1" onclick="ppSelectCloth(this)">
            <i class="fa-solid fa-shirt"></i>
            <span>T-Shirt</span>
          </button>
          <button class="pp-cloth-btn" data-value="2" onclick="ppSelectCloth(this)">
            <i class="fa-solid fa-shirt" style="font-size:1.3em"></i>
            <span>Hemd / Bluse</span>
          </button>
          <button class="pp-cloth-btn" data-value="3" onclick="ppSelectCloth(this)">
            <i class="fa-solid fa-user-tie"></i>
            <span>Pullover</span>
          </button>
          <button class="pp-cloth-btn" data-value="4" onclick="ppSelectCloth(this)">
            <i class="fa-solid fa-vest"></i>
            <span>Jacke</span>
          </button>
          <button class="pp-cloth-btn" data-value="5" onclick="ppSelectCloth(this)">
            <i class="fa-solid fa-vest-patches"></i>
            <span>Winterjacke</span>
          </button>
        </div>
        </div>
        <div class="popup-field">
        <label" style="margin-top:16px">Wie bewegst du dich?</label>
        <div class="pp-movement-grid">
          <button class="pp-move-btn" data-value="1" onclick="ppSelectMove(this)">
            <i class="fa-solid fa-chair"></i>
            <span>Sitzen</span>
          </button>
          <button class="pp-move-btn" data-value="2" onclick="ppSelectMove(this)">
            <i class="fa-solid fa-person"></i>
            <span>Stehen</span>
          </button>
          <button class="pp-move-btn" data-value="3" onclick="ppSelectMove(this)">
            <i class="fa-solid fa-person-walking"></i>
            <span>Gehen</span>
          </button>
          <button class="pp-move-btn" data-value="4" onclick="ppSelectMove(this)">
            <i class="fa-solid fa-person-biking"></i>
            <span>Rad</span>
          </button>
          <button class="pp-move-btn" data-value="5" onclick="ppSelectMove(this)">
            <i class="fa-solid fa-person-running"></i>
            <span>Joggen</span>
          </button>
        </div>
        </div>
      </div>

      <!-- Seite 4: Bildeindruck -->
      <div class="popup-page" id="pp-7">
      <div class="imageholder" id="imageholder">
        <img id="pp-preview" style="display:none; width:100%; height:100%; object-fit:scale-down;">
        <div id="imageContainer">
          <div id="imagehint1" class="imagehint" style="display:flex">
            <div class="imagehintico"> <i class="fa-solid fa-layer-group"></i> </div>
            <div class="imagehinttext"> Noch kein Bild. Lade eins hoch        </div>
          </div>
        </div>
      </div>
         <div class="popup-field">
           <div style="display: flex; gap: 8px;">
             <button
               id="pp-deleteImgWrap"
               onclick="deleteExistingImage(${id})"
               style="display:${editing ? "flex" : "none"}; align-items:center; justify-content:center; gap:4px;
                      background:#d32f2f; color:white; border:none; border-radius:7px; padding:8px 12px;
                      font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; cursor:pointer; white-space:nowrap;">
               <i class="fa-solid fa-trash"></i> Löschen
             </button>
             <label class="popup-btn-placeholder" for="pp-cameraInput" style="cursor:pointer; flex:1;">
               <i class="fa-solid fa-image"></i> Foto aufnehmen
             </label>
           </div>
           <input
             type="file"
             id="pp-cameraInput"
             accept="image/*"
             capture="environment"
             style="display:none"
             onchange="imager()">
         </div>
          </div>
        </div>
        </div>
      </div>

      <!-- Seite 4: Bildbewertung -->
      <div class="popup-page" id="pp-8">
      <div style="display: flex; gap: 8px;">
    <div class="imageholder" id="imageholder2" style="height: 80px; background-color: #c8d8c9;object-fit:scale-down;">
       <canvas id="cvs"></canvas>
    </div>
     </div>
      <div class="popup-field">
      <div class="popup-slider-wrap">
        <input type="range" min="0" max="100" value="25"step="1" id="tolerance"
          oninput="document.getElementById('pp-q3Val').textContent=this.value">
        <span class="popup-slider-val" id="toleranceValue">25</span>
      </div>
      <div class="popup-slider-labels"><span>gröberer Filter</span><span>feinerer Filter</span></div>
          <div class="res">Berchneter Grünanteil: <span id="perc">0%</span></div>
        </div>
        </div>
      </div>
      <div class="popup-page" id="pp-thank">
        <div class="pp-thankyou">
          <div class="pp-thankyou-icon"> <i class="fa-regular fa-circle-check"></i></div>
          <p class="pp-thankyou-text">
            Mit diesem Code kannst du deinen Eintrag später bearbeiten – notiere ihn dir!
          </p>
          <div class="pp-password-box">
            <span class="pp-password-label">Dein Bearbeitungscode <i class="fa-solid fa-lock"></i></span>
            <div id="pswd" class="pp-password-value">–</div>
          </div>
        </div>
      </div>

      <div class="popup-dots" id="pp-dots">
        <div class="popup-dot active" onclick="ppGoTo(1)"></div>
        <div class="popup-dot" onclick="ppGoTo(2)"></div>
        <div class="popup-dot" onclick="ppGoTo(3)"></div>
        <div class="popup-dot" onclick="ppGoTo(4)"></div>
        <div class="popup-dot" onclick="ppGoTo(5)"></div>
        <div class="popup-dot" onclick="ppGoTo(6)"></div>
        <div class="popup-dot" onclick="ppGoTo(7)"></div>
        <div class="popup-dot" onclick="ppGoTo(8)"></div>
      </div>

      <div class="popup-nav">
        <button class="popup-btn-back" id="pp-btnBack" onclick="ppPrev()" style="display:none"><i class="fa-solid fa-arrow-left"></i> Zurück</button>
        <button class="popup-btn-next" id="pp-btnNext" onclick="ppNext(${lat}, ${lng},${editing},${id},'${sec}' )" style="${editing ? "display:none" : "display:block"}">Weiter →</button>
        <button class="popup-btn-sec" id="pp-btnSec" onclick="unlock('${sec}')" style="${!editing ? "display:none" : "display:block"}">Entsperren <i class="fa-solid fa-lock-open"></i> </button>

      </div>
    </div>
  `;
  // Popup an Marker binden und öffnen
  tempMarker.bindPopup(popupContent, { maxWidth: 360 });
  tempMarker.openPopup();

  // Tempmarker löschen und popup schließen bei Abbruch
  tempMarker.on("popupclose", () => {
    if (tempMarker) {
      map.removeLayer(tempMarker);
      tempMarker = null;
    }
  });
  // Wenn der Marker editiert wird muss zunächst eine Pasword abfrage
  // erfolgen. Diese braucht aber ein Element das erst erstellt werden
  // muss, daher wird kurz gewartet bis Leaflet fertig ist
  setTimeout(() => {
    if (editing) {
      initsec();
      initedit(id);
    } else {
      ppGoTo(1);
    }
    document.getElementById("pp-name")?.focus();
    const toleranceSlider = document.getElementById("tolerance");
    toleranceSlider.addEventListener("input", () => {
      if (originalImageData) analyzeWithTolerance();
    });
  }, 200);
}

// Funktion die den Imageupload managed
function imager() {
  const input = document.getElementById("pp-cameraInput");
  const file = input?.files[0];
  if (!file) return;
  const reader = new FileReader();
  const cvs = document.getElementById("cvs");
  const ctx = cvs.getContext("2d", { willReadFrequently: true });
  // Neben dem Bild einladen wird auch der Canvas für die Berechnung
  // im nächsten Schritt vorbereitet und analysiert
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 800 / Math.max(img.width, img.height));
      cvs.width = img.width * scale;
      cvs.height = img.height * scale;

      ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
      originalImageData = ctx.getImageData(0, 0, cvs.width, cvs.height);
      analyzeWithTolerance();
    };
    img.src = event.target.result;
    const preview = document.getElementById("pp-preview");
    preview.src = event.target.result;
    preview.style.display = "block";
  };

  reader.readAsDataURL(file);
  document.getElementById("pp-deleteImgWrap").style.display = "flex";
  const hint1 = document.getElementById("imagehint1");
  hint1.style.display = "none";
}

// Funktion um eine bestimmte Seite n anzusteuern in der Navigation
function ppGoTo(n) {
  // Alte Seite deaktivieren neue aktivieren
  document.getElementById(`pp-${popupState.page}`)?.classList.remove("active");
  popupState.page = n;
  document.getElementById(`pp-${n}`)?.classList.add("active");

  // Progressionsleiste aktualisieren
  document.getElementById("popupProgress").style.width =
    (n / POPUP_TOTAL) * 100 + "%";
  document.getElementById("popupIndicator").textContent =
    `Schritt ${n} von ${POPUP_TOTAL}`;
  // Titel und Subtitel anpassen
  document.getElementById("popupTitle").textContent = PP_TITLES[n - 1].title;
  document.getElementById("popupSubtitle").textContent = PP_TITLES[n - 1].sub;
  // Zurückbutton verschwindet auf erster Seite
  document.getElementById("pp-btnBack").style.display =
    n > 1 ? "block" : "none";
  // Weiter button wird bei letzter Seite zu speichern
  document.getElementById("pp-btnNext").innerHTML =
    n === POPUP_TOTAL
      ? 'Speichern <i class="fa-solid fa-upload"></i>'
      : 'Weiter <i class="fa-solid fa-arrow-right"></i>';

  document.querySelectorAll(".popup-dot").forEach((d, i) => {
    d.classList.toggle("active", i === n - 1);
  });
}

// Verschlüsselung vorbereiten für Enstperren
function initsec() {
  document.getElementById(`pp-1`)?.classList.remove("active");
  document.getElementById(`pp-0`)?.classList.add("active");
  document.getElementById("pp-btnNext").style.display = "none";
  document.getElementById("pp-btnSec").style.display = "block";
  document.getElementById("popupIndicator").style.display = "none";
  document.getElementById("popupProgress").style.display = "none";
  document.getElementById("popupTitle").textContent = "Eintrag entsperren";
  document.getElementById("popupSubtitle").textContent =
    "Bitte Kennword eingeben";
}

// Bearbeiten des Markers vorbereiten
async function initedit(id) {
  // Abfragen des Markes in der DB
  const markus = await getMarkerByID(id);
  // Auslesen der Markerwerte und setzen im Popup
  document.getElementById("pp-name").value = markus.name;
  document.getElementById("pp-q1").value = markus.q1;
  document.getElementById("pp-q2").value = markus.q2;
  document.getElementById("pp-q3").value = markus.q3;
  document.getElementById("pp-q4").value = markus.q4;
  ppSetStars("attr", markus.q5);
  ppSetStars("greens", markus.q6);
  ppSetStars("safety", markus.q7);
  document.getElementById("pp-q8").value = markus.q8;
  ppSelectCloth(markus.q9);
  ppSelectMove(markus.q10);

  if (markus.image) {
    // Preview auf Seite 7
    const preview = document.getElementById("pp-preview");
    if (preview) {
      preview.src = `https://negative-sybille-tubsgeoinfp-ffb32b8c.koyeb.app/${markus.image}`;
      preview.style.display = "block";
    }

    // Hint verstecken
    const hint1 = document.getElementById("imagehint1");
    if (hint1) hint1.style.display = "none";

    // Bild auch in Canvas laden (für Grünanteil-Analyse auf Seite 8)
    const cvs = document.getElementById("cvs");
    const ctx = cvs.getContext("2d", { willReadFrequently: true });
    const img = new Image();
    img.crossOrigin = "anonymous"; // Ohne sind Bilder hier kaputt

    img.onload = () => {
      const scale = Math.min(1, 800 / Math.max(img.width, img.height));
      cvs.width = img.width * scale;
      cvs.height = img.height * scale;
      ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
      originalImageData = ctx.getImageData(0, 0, cvs.width, cvs.height);
      analyzeWithTolerance();
    };
    img.src = `http://negative-sybille-tubsgeoinfp-ffb32b8c.koyeb.app/${markus.image}`;
  }
}

// Funktion zum Entsperren des zu berabeiten Layers
function unlock(sec = "") {
  // Eingabe muss dem in der DB gespeicherten Wert entsprechen
  const trial = document.getElementById("pp-seck").value == sec;
  if (trial == true) {
    // Wenn erfolgreich wird Seite 1 angezeigt
    document.getElementById(`pp-0`)?.classList.remove("active");
    document.getElementById(`pp-1`)?.classList.add("active");
    document.getElementById("pp-btnSec").style.display = "none";
    document.getElementById("pp-btnNext").style.display = "block";
    document.getElementById("popupIndicator").style.display = "block";
    document.getElementById("popupProgress").style.display = "block";
    document.getElementById("popupTitle").textContent = PP_TITLES[0].title;
    document.getElementById("popupSubtitle").textContent = PP_TITLES[0].sub;
  } else {
    // Wenn falsch wackelt der Button um Fehler zu markieren
    document.getElementById("pp-btnSec").classList.add("is-jiggling");
    setTimeout(() => {
      document.getElementById("pp-btnSec").classList.remove("is-jiggling");
    }, 100);
  }
}

// Funktion mit der nächste Seite ausgewählt und aufgerufen wird
function ppNext(lat, lng, editing = false, id = null, sec = "") {
  // Um bei Seite 7 weiter zu kommen MUSS ein BIld ausgewählt werden
  // sonst wird Button wackeln
  if (popupState.page === 7) {
    const preview = document.getElementById("pp-preview");
    const hasImage =
      preview && preview.style.display !== "none" && preview.src !== "";
    if (!hasImage) {
      const hint1 = document.getElementById("imageholder");
      if (hint1) {
        hint1.classList.remove("hint-error"); // Reset falls schon drauf
        void hint1.offsetWidth; // Reflow erzwingen → Animation neu starten
        hint1.classList.add("hint-error");
        setTimeout(() => hint1.classList.remove("hint-error"), 600);
      }
      return;
    }
  }
  // Wenn letzte Seite wird statt neuer Seite Marker in DB gespeichert
  if (popupState.page === POPUP_TOTAL) {
    ppSave(lat, lng, editing, id, sec);
  } else {
    ppGoTo(popupState.page + 1);
  }
}
// Vorherige Seite ansteuern
// keine Absicherung nötig da Button auf Seite 1
// nicht angezeigt wird
function ppPrev() {
  if (popupState.page > 1) ppGoTo(popupState.page - 1);
}

// Funktion zum setzen der Sterne nach Usereingabe
function ppSetStars(type, val) {
  popupState.stars[type] = val;
  document
    .getElementById(`pp-${type}Stars`)
    .querySelectorAll("span")
    .forEach((s, i) => {
      s.classList.toggle("active", i < val);
    });
}

// Funktion zur Auswahl der Kleidung für Kalibrierung
// kann entweder String oder Value sein
// Userinpout -> Strring
// Einladen aus DB -> Value
function ppSelectCloth(elOrValue) {
  const el =
    typeof elOrValue === "string" || typeof elOrValue === "number"
      ? document.querySelector(`.pp-cloth-btn[data-value="${elOrValue}"]`)
      : elOrValue;
  if (!el) return;
  document
    .querySelectorAll(".pp-cloth-btn")
    .forEach((b) => b.classList.remove("selected"));
  el.classList.add("selected");
}

// Funktion zur Auswahl des Bewegungszustandes für Kalibrierung
// kann entweder String oder Value sein
// Userinpout -> Strring
// Einladen aus DB -> Value
function ppSelectMove(elOrValue) {
  const el =
    typeof elOrValue === "string" || typeof elOrValue === "number"
      ? document.querySelector(`.pp-move-btn[data-value="${elOrValue}"]`)
      : elOrValue;
  if (!el) return;
  document
    .querySelectorAll(".pp-move-btn")
    .forEach((b) => b.classList.remove("selected"));
  el.classList.add("selected");
}

// Funktion zum Speicher der Userinputs in DB
async function ppSave(lat, lng, editing = false, id = null, sec = "") {
  // Name muss eingegeben werden
  // Aber kann auch erst am Ende eingeben werden
  // Wenn man das am Anfang forciert verschreckt man den potentiellen
  // Antwortenden -> Reibung erst am Ende
  const name = document.getElementById("pp-name")?.value.trim();
  if (!name) {
    alert("Bitte einen Namen eingeben");
    ppGoTo(1);
    return;
  }
  let secval;
  // Auslesen der Werte aus dem Popover
  const description = document.getElementById("pp-desc")?.value.trim();
  const q1 = parseInt(document.getElementById("pp-q1")?.value || 5);
  const q2 = parseInt(document.getElementById("pp-q2")?.value || 5);
  const q3 = parseInt(document.getElementById("pp-q3")?.value || 5);
  const q4 = parseInt(document.getElementById("pp-q4")?.value || 5);
  const q5 = parseInt(popupState.stars.attr || 5);
  const q6 = parseInt(popupState.stars.greens || 5);
  const q7 = parseInt(popupState.stars.safety || 5);
  const q8 = parseInt(document.getElementById("pp-q8")?.value || 5);
  const q9 =
    document.querySelector(".pp-cloth-btn.selected")?.dataset.value ?? 5;
  const q10 =
    document.querySelector(".pp-move-btn.selected")?.dataset.value ?? 5;

  // Berechnen des Scores
  const calculations = calculateUserScore(
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
  );
  const klim_well = calculations[1];
  const laerm_well = calculations[2];
  const aesthatic_well = calculations[3];
  const secure_well = calculations[4];
  const user_score = calculations[0];

  const laerm_score = measurednoise;
  const image_score = imagescore;

  //Finalen Score Berechnen
  const final_score = calculateFinalScore(user_score, laerm_score, image_score); //TODO Berechnen
  const image = await getImage(deletediamge);

  // Wenn nicht Editiert wird, wird ein neuer Marker in DB erstellt
  if (!editing) {
    secval = makeid(6); // Neue Passphasre wird generiert
    await createMarkerInDB(
      name,
      description,
      lat,
      lng,
      klim_well,
      secval,
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
    loadMarkers();
    show_thanks(secval); // Anzeigen der Dankung
  } else {
    // Wenn editiert wird wird marker aktualisiert

    secval = sec; // Passphrase ist wieder die alte
    await updateMarkerInDB(
      id,
      name,
      description,
      lat,
      lng,
      klim_well,
      secval,
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
    loadMarkers();
    show_thanks(secval);
  }
}

// Danke-Seite anzeigen
function show_thanks(secval) {
  document.getElementById(`pp-${popupState.page}`)?.classList.remove("active");
  document.getElementById("pp-thank")?.classList.add("active");
  document.getElementById("pp-btnBack").style.display = "none";
  document.getElementById("pp-btnNext").style.display = "none";
  document.getElementById("pp-btnSec").style.display = "none";
  document.getElementById("popupProgress").style.width = "100%";
  document.getElementById("popupIndicator").textContent = "Abgeschlossen";
  document.getElementById("popupTitle").textContent = "Danke!";
  document.getElementById("popupSubtitle").innerHTML =
    `Dein Beitrag wurde gespeichert <i class="fa-solid fa-thumbs-up"></i>`;
  document
    .querySelectorAll(".popup-dot")
    .forEach((d) => d.classList.remove("active"));

  // Passphrase anzeigen
  document.getElementById("pswd").textContent = secval;
}

// Funktion für Standortbestimmung im Popup
function getCurrentLocationForPopup(btnElement) {
  if (!navigator.geolocation) {
    alert("Geolocation wird von deinem Browser nicht unterstützt.");
    return;
  }

  // Originalen Button-Text speichern und Ladezustand anzeigen
  const originalHTML = btnElement.innerHTML;
  btnElement.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin"></i> Wird ermittelt...';
  btnElement.disabled = true;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      // Neuen Marker mit den ermittelten Koordinaten erstellen
      createTempMarkerWithForm(latitude, longitude);

      // Button zurücksetzen (wird eigentlich durch neuen Marker ersetzt, aber sicherheitshalber)
      btnElement.innerHTML = originalHTML;
      btnElement.disabled = false;
    },
    (error) => {
      let errorMessage = "Standort konnte nicht ermittelt werden.";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Standortzugriff wurde verweigert.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Standortinformationen sind nicht verfügbar.";
          break;
        case error.TIMEOUT:
          errorMessage = "Die Standortabfrage hat zu lange gedauert.";
          break;
      }
      alert(errorMessage);

      // Button zurücksetzen
      btnElement.innerHTML = originalHTML;
      btnElement.disabled = false;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  );
}

// Funktion um bestehendes Bild zu löschen
function deleteExistingImage() {
  deletediamge = true;
  const preview = document.getElementById("pp-preview");
  if (preview) {
    preview.src = "";
    preview.style.display = "none";
  }

  // Bild aus imageContainer entfernen
  const container = document.getElementById("imageContainer");
  if (container) container.innerHTML = "";

  const hint1 = document.createElement("div");
  hint1.classList = "imagehint";
  hint1.style.display = "flex";
  hint1.id = "imagehint1";
  hint1.innerHTML = `
    <div class="imagehintico"> <i class="fa-solid fa-layer-group"></i> </div>
    <div class="imagehinttext"> Noch kein Bild. Lade eins hoch        </div>
  `;
  container.appendChild(hint1);
  // Lösch-Button wieder verstecken
  const wrap = document.getElementById("pp-deleteImgWrap");
  if (wrap) wrap.style.display = "none";
}

async function ppMeasureNoise(buttonEl) {
  const statusEl = document.getElementById("pp-noiseStatus");

  try {
    buttonEl.disabled = true;
    buttonEl.textContent = "🎙️ Messe...";

    if (statusEl) {
      statusEl.textContent = "Mikrofonmessung läuft für 5 Sekunden...";
    }

    //const { measureNoise } = await import("./noiseMeasurement.js");
    const result = await measureNoise(5000, 100);

    const measuredSliderScore = result.noiseScore * 2;

    measuredNoiseScore = measuredSliderScore;
    measuredDb = result.db;
    measurednoise = measuredSliderScore;

    if (statusEl) {
      statusEl.textContent = `Messung abgeschlossen: ${result.db} dB, gemessener Lärmwert ${measuredSliderScore}/10`;
    }
  } catch (error) {
    console.error("Fehler bei der Lärmmessung:", error);

    if (statusEl) {
      statusEl.textContent =
        "Die Lärmmessung konnte nicht gestartet werden. Bitte Mikrofonzugriff prüfen.";
    }
  } finally {
    buttonEl.disabled = false;
    buttonEl.innerHTML = `Erneut Messen <i class="fa-solid fa-microphone-lines"></i>`;
  }
}
function analyzeWithTolerance() {
  const input = document.getElementById("imageInput");
  const cvs = document.getElementById("cvs");
  const ctx = cvs.getContext("2d", { willReadFrequently: true });
  const percDisp = document.getElementById("perc");
  const loading = document.getElementById("loading");
  const toleranceSlider = document.getElementById("tolerance");
  const toleranceSpan = document.getElementById("toleranceValue");
  const tolerance = parseInt(toleranceSlider.value); // ← hier definieren
  toleranceSpan.textContent = tolerance;

  if (!originalImageData) return;

  const imgData = new ImageData(
    new Uint8ClampedArray(originalImageData.data),
    originalImageData.width,
    originalImageData.height,
  );
  const data = imgData.data;

  let greenCount = 0;
  let totalOpaque = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = originalImageData.data[i];
    const g = originalImageData.data[i + 1];
    const b = originalImageData.data[i + 2];
    const a = originalImageData.data[i + 3];

    if (a < 128) {
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
      continue;
    }
    totalOpaque++;

    // Excess Green Index
    const exg = 2 * g - r - b;

    // Schatten-Check
    const isDarkGreen = g > r && g > b && r + g + b > 30;

    if (exg > tolerance || (exg > tolerance * 0.2 && isDarkGreen)) {
      greenCount++;
      // Pinke Markierung
      data[i] = 255;
      data[i + 1] = 0;
      data[i + 2] = 255;
      data[i + 3] = 255;
    } else {
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  currentImageData = imgData;

  const result = (greenCount / totalOpaque) * 100;
  percDisp.textContent = result.toFixed(2) + "%";
  imagescore = (greenCount / totalOpaque) * 10;
}

// Funktion zur Bildabfrage, wenn Bild gelöscht ist String leer
function getImage(deletediamge) {
  const input = document.getElementById("pp-cameraInput");
  if (deletediamge) {
    return "";
  } else if (!input || !input.files || input.files.length === 0) {
    return null;
  }

  return new Promise((resolve) => {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result); // Base64 Data-URL
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
