//import { calculateRMS, analyzeNoiseMeasurement } from "./noiseAnalysis.js";

async function measureNoise(durationMs = 10000, sampleInterval = 100) {
  let stream;
  let audioContext;

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.fftSize);
    const rmsValues = [];

    const startTime = Date.now();

    await new Promise((resolve) => {
      const intervalId = setInterval(() => {
        analyser.getByteTimeDomainData(dataArray);
        rmsValues.push(calculateRMS(dataArray));

        if (Date.now() - startTime >= durationMs) {
          clearInterval(intervalId);
          resolve();
        }
      }, sampleInterval);
    });

    return analyzeNoiseMeasurement(rmsValues);
  } finally {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (audioContext) {
      await audioContext.close();
    }
  }
}
function mapDbToNoiseScore(db) {
  if (db < 40) return 5;
  if (db < 55) return 4;
  if (db < 65) return 3;
  if (db < 75) return 2;
  return 1;
}

function calculateRMS(dataArray) {
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const normalized = (dataArray[i] - 128) / 128;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / dataArray.length);
}

function calculateAverageDbFromRmsValues(rmsValues) {
  const avgRms =
    rmsValues.reduce((sum, value) => sum + value, 0) / rmsValues.length;

  let db = 20 * Math.log10(avgRms);
  db = db + 100; // grobe Verschiebung für praxisnahe Skala
  db = Math.max(20, Math.min(100, db));

  return Number(db.toFixed(1));
}

function analyzeNoiseMeasurement(rmsValues) {
  const db = calculateAverageDbFromRmsValues(rmsValues);
  const noiseScore = mapDbToNoiseScore(db);

  return { db, noiseScore };
}
