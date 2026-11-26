"use strict";

// Page thermostat : dernier état connu de chaque pièce, lu dans data/data_temp.json.
(function () {
  const REFRESH_MS = 60 * 1000;
  const el = {
    pieces: document.getElementById("pieces"),
    cadran: document.getElementById("cadran"),
    entier: document.getElementById("entier"),
    decimale: document.getElementById("decimale"),
    consigne: document.getElementById("consigne"),
    marche: document.getElementById("marche"),
    maj: document.getElementById("maj"),
  };
  const etat = { donnees: null, piece: lirePiece() };

  function lirePiece() {
    const url = new URLSearchParams(location.search).get("piece");
    if (url) return url;
    try { return localStorage.getItem("piece"); } catch (erreur) { return null; }
  }

  function memoriser(piece) {
    try { localStorage.setItem("piece", piece); } catch (erreur) { /* sans mémoire locale */ }
  }

  async function charger() {
    try {
      const reponse = await fetch("data/data_temp.json", { cache: "no-cache" });
      etat.donnees = reponse.ok ? await reponse.json() : null;
    } catch (erreur) {
      etat.donnees = null;
    }
    dessiner();
  }

  function dessiner() {
    const donnees = etat.donnees;
    const pieces = donnees && Array.isArray(donnees.listOfDevices) ? donnees.listOfDevices : [];
    if (!pieces.includes(etat.piece)) etat.piece = pieces[0] || null;

    el.pieces.replaceChildren(
      ...pieces.map((nom) => {
        const bouton = document.createElement("button");
        bouton.type = "button";
        bouton.textContent = nom;
        bouton.setAttribute("aria-pressed", String(nom === etat.piece));
        bouton.addEventListener("click", () => { etat.piece = nom; memoriser(nom); dessiner(); });
        return bouton;
      })
    );
    Pieces.centrer();

    const piece = donnees && donnees[etat.piece];
    if (!piece) {
      el.entier.textContent = "–";
      el.decimale.textContent = "";
      el.consigne.textContent = "";
      el.marche.className = "etat-clim";
      el.cadran.style.setProperty("--teinte", "220");
      el.maj.textContent = "Pas de données.";
      return;
    }

    const temperature = piece.temp;
    const [entier, decimale] = temperature == null ? ["–", null] : temperature.toFixed(1).split(".");
    el.entier.textContent = entier;
    el.decimale.textContent = decimale == null ? "" : "," + decimale;
    el.cadran.classList.toggle("ancienne", piece.mesure_perimee === true);
    el.cadran.style.setProperty("--teinte", String(teinte(piece, donnees.temp_max)));
    el.consigne.textContent = piece.consigne == null ? "pas de consigne" : `consigne ${piece.consigne} °C`;
    el.marche.className = "etat-clim" + (piece.etat === 1 ? " marche" : "");
    el.marche.title = piece.etat === 1 ? "Climatisation en marche" : "Climatisation à l'arrêt";

    el.maj.replaceChildren(`Mis à jour le ${donnees.date} à ${donnees.heure}`);
    if (piece.mesure_perimee === true) {
      const alerte = document.createElement("div");
      alerte.className = "alerte";
      alerte.textContent = "Mesure ancienne : le capteur ne répond plus.";
      el.maj.append(alerte);
    }
  }

  // Bleu sous la consigne, rouge au-dessus du maximum, vert entre les deux.
  function teinte(piece, maximum) {
    if (piece.temp == null) return 220;
    if (maximum != null && piece.temp > maximum) return 5;
    if (piece.consigne != null && piece.temp < piece.consigne) return 210;
    return 120;
  }

  setInterval(() => { if (!document.hidden) charger(); }, REFRESH_MS);
  charger();
})();
