// ============================================================
// WELCOME MODAL
// Zeigt sich beim ersten Besuch (danach per localStorage gemerkt)
// ============================================================

function showWelcomeModal() {
  // Einmal pro Browser-Session zeigen – auskommentieren zum Testen
  // if (localStorage.getItem('welcomeSeen')) return;

  const overlay = document.createElement("div");
  overlay.id = "welcome-overlay";
  overlay.innerHTML = `
    <div class="welcome-modal" role="dialog" aria-modal="true" aria-labelledby="welcomeTitle">

      <div class="welcome-hero">
        <span class="welcome-icon"><i class="fa-solid fa-spa" style="color: rgb(255, 255, 255);"></i></span>
        <h1 id="welcomeTitle">Wohlfühlkarte Braunschweig</h1>
        <p>Hilf uns, deine Stadt besser zu verstehen – teile dein Wohlbefinden an verschiedenen Orten.</p>
      </div>

      <div class="welcome-body">
        <ul class="welcome-steps">
          <li class="welcome-step">
            <div class="welcome-step-icon"><i class="fa-solid fa-map-pin"></i> </div>
            <div class="welcome-step-text">
              <strong>Ort auf der Karte wählen</strong>
              <span>Klicke auf einen beliebigen Ort innerhalb Braunschweigs.</span>
            </div>
          </li>
          <li class="welcome-step">
            <div class="welcome-step-icon"><i class="fa-solid fa-file-pen"></i></div>
            <div class="welcome-step-text">
              <strong>Kurzen Fragebogen ausfüllen</strong>
              <span>Bewerte Lärm, Grün, Sicherheit und dein allgemeines Wohlbefinden.</span>
            </div>
          </li>
          <li class="welcome-step">
            <div class="welcome-step-icon"><i class="fa-solid fa-flask"></i></i></div>
            <div class="welcome-step-text">
              <strong>Zur Forschung beitragen</strong>
              <span>Deine Einschätzung hilft Klima-Modelle zu optimieren <a href="explainer.html"> Mehr erfahren</a>
 .</span>
            </div>
          </li>
        </ul>

        <div class="welcome-divider"></div>

        <div class="welcome-footer">
          <p class="welcome-privacy"><i class="fa-solid fa-lock"></i> Anonym & ohne Registrierung. Keine persönlichen Daten werden gespeichert.</p>
          <button class="welcome-btn" onclick="closeWelcomeModal()">Jetzt mitmachen →</button>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  // Schließen per Klick auf Overlay-Hintergrund
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeWelcomeModal();
  });

  // Schließen per Escape
  document.addEventListener("keydown", _welcomeEscHandler);
}

function closeWelcomeModal() {
  const overlay = document.getElementById("welcome-overlay");
  if (!overlay) return;
  overlay.classList.add("hiding");
  overlay.addEventListener("animationend", () => overlay.remove(), {
    once: true,
  });
  localStorage.setItem("welcomeSeen", "1");
  document.removeEventListener("keydown", _welcomeEscHandler);
}

function _welcomeEscHandler(e) {
  if (e.key === "Escape") closeWelcomeModal();
}

// Automatisch beim Laden aufrufen
showWelcomeModal();
