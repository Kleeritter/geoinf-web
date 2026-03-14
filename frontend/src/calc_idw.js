// ============================================================
// calc_idw.Js
// Funktionen für die Berechnung der Inverse Distance
//  Interpolation.
// ============================================================

function createIDWLayer(points, resolution = 200, power = 3) {
  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;
  const allRings = [];
  // Inversion erfolgt nur im Braunschweig Auschnitt
  // Wird Immer für den gesammten Auschnitt bestimmt
  // und ist nicht vom Leaflet Auschnitt abhängig
  boundaryPolygon.features
    ? boundaryPolygon.features.forEach((f) => {
        const geom = f.geometry;
        if (geom.type === "Polygon") allRings.push(...geom.coordinates);
        if (geom.type === "MultiPolygon")
          geom.coordinates.forEach((p) => allRings.push(...p));
      })
    : (() => {
        const geom = boundaryPolygon.geometry || boundaryPolygon;
        if (geom.type === "Polygon") allRings.push(...geom.coordinates);
        if (geom.type === "MultiPolygon")
          geom.coordinates.forEach((p) => allRings.push(...p));
      })();

  allRings.forEach((ring) => {
    ring.forEach(([lng, lat]) => {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });
  });

  const bounds = L.latLngBounds([minLat, minLng], [maxLat, maxLng]);

  // IDW wir in Canvase gezeichnet
  // Dafür Erstellung von Canvas
  const canvas = document.createElement("canvas");
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext("2d");

  const values = points.map((p) => p.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  // Funktion um Werte in RGB zuzerlegt
  function valueToRGBA(t) {
    const r = Math.round(255 * Math.min(1, 2 * (1 - t)));
    const g = Math.round(255 * Math.min(1, 2 * t));
    const b = 0;
    return [r, g, b];
  }
  // Berechnung der Inversion
  const imageData = ctx.createImageData(resolution, resolution);
  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const lat =
        bounds.getNorth() -
        (y / resolution) * (bounds.getNorth() - bounds.getSouth());
      const lng =
        bounds.getWest() +
        (x / resolution) * (bounds.getEast() - bounds.getWest());

      let weightSum = 0;
      let valueSum = 0;
      for (const p of points) {
        const d = Math.sqrt((lat - p.lat) ** 2 + (lng - p.lng) ** 2);
        if (d < 0.0001) {
          valueSum = p.value;
          weightSum = 1;
          break;
        }
        const w = 1 / Math.pow(d, power);
        weightSum += w;
        valueSum += w * p.value;
      }

      const raw = valueSum / weightSum;
      const t = (raw - minVal) / (maxVal - minVal || 1);
      const [r, g, b] = valueToRGBA(t); // Berechnete Werte werden in Farben umgewandelt
      const i = (y * resolution + x) * 4;
      imageData.data[i] = r;
      imageData.data[i + 1] = g;
      imageData.data[i + 2] = b;
      imageData.data[i + 3] = 160;
    }
  }
  // Speichern der inerpolation im Canvas
  ctx.putImageData(imageData, 0, 0);

  // Stadtgrenze als Clip-Maske wie oben beschrieben
  if (boundaryPolygon) {
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    allRings.forEach((ring) => {
      ring.forEach(([lng, lat], i) => {
        const x =
          ((lng - bounds.getWest()) / (bounds.getEast() - bounds.getWest())) *
          resolution;
        const y =
          ((bounds.getNorth() - lat) /
            (bounds.getNorth() - bounds.getSouth())) *
          resolution;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
    });

    ctx.fillStyle = "black";
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }

  return L.imageOverlay(canvas.toDataURL(), bounds);
}
