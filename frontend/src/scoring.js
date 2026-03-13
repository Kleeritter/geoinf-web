function calculateUserScore(q1, q2, q3, q4, q5, q6, q7, q8, q9, q10) {
  const klima = (q1 + q2 + 0.5 * q9 + 0,5 * q10) / 3;
  const laerm = (q3 + q4) / 2;
  const aesthetik = (q5 + q6) / 2;
  const sicherheit = (q7 + q8) / 2;

  const user_score = (klima + laerm + aesthetik + sicherheit) / 4;

  return [user_score, klima, laerm, aesthetik, sicherheit];
}

function calculateImageScore(greenPercentage) {
  if (greenPercentage < 20) return 1;
  if (greenPercentage < 40) return 2;
  if (greenPercentage < 60) return 3;
  if (greenPercentage < 80) return 4;

  return 5;
}

function calculateFinalScore(userScore, noiseScore, imageScore) {
  return 0.6 * userScore + 0.2 * noiseScore + 0.2 * imageScore;
}
