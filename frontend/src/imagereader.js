// ============================================================
// imagereader.js
// Funktionen für die Berechnung der Grünanteils aus Bildern
//
// ============================================================

function imagegreener() {
  // Input ist im vorherigen Schritt im Hinzufügen-Popup
  // hochgeladenes Bild
  const input = document.getElementById("imageInput");
  const cvs = document.getElementById("cvs");
  const ctx = cvs.getContext("2d", { willReadFrequently: true });
  const percDisp = document.getElementById("perc");
  const loading = document.getElementById("loading");
  const toleranceSlider = document.getElementById("tolerance");
  const toleranceSpan = document.getElementById("toleranceValue");

  let originalImageData = null;
  let currentImageData = null;
  // eigentliche Analyse
  function analyzeWithTolerance() {
    if (!originalImageData) return;
    // Toleranz für die Berechnung stammt aus Toleranz slider
    const tolerance = parseInt(toleranceSlider.value);
    toleranceSpan.textContent = tolerance;
    // Aus Image imagedata beziehen
    const imgData = new ImageData(
      new Uint8ClampedArray(originalImageData.data),
      originalImageData.width,
      originalImageData.height,
    );
    const data = imgData.data;

    //initialiseren der Pixel
    let greenCount = 0;
    let totalOpaque = 0;
    // Auslesen von RGBA
    for (let i = 0; i < data.length; i += 4) {
      const r = originalImageData.data[i];
      const g = originalImageData.data[i + 1];
      const b = originalImageData.data[i + 2];
      const a = originalImageData.data[i + 3];
      //Korrekturen bei geringer Transparenz
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
  }
  // wenn sich Toleranzänder nochmal anaylsierne in Echtzeit
  toleranceSlider.addEventListener("input", () => {
    if (originalImageData) analyzeWithTolerance();
  });
}
