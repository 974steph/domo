"use strict";

// Page d'historique d'une journée : température (data-metric="temp") ou humidité ("humidity").
// Lit data/data_AAAAMMJJ.json (une valeur moyenne par tranche de 5 minutes) et trace une courbe SVG.
(function () {
  const METRIC = document.body.dataset.metric;
  const CONFIG = {
    temp: { cle: "temp", dates: "date", unite: "°C", decimales: 1, avecClim: true },
    humidity: { cle: "humidity_hist", dates: "date_hist", unite: "%", decimales: 0, avecClim: false },
  }[METRIC];
  const REFRESH_MS = 5 * 60 * 1000;
  const HAUTEUR_MIN = 220;
  const MARGE = { haut: 10, droite: 12, bas: 24, gauche: 40 };

  const el = {
    pieces: document.getElementById("pieces"),
    precedent: document.getElementById("precedent"),
    suivant: document.getElementById("suivant"),
    jour: document.getElementById("jour"),
    valeur: document.getElementById("valeur"),
    graphique: document.getElementById("graphique"),
    stats: document.getElementById("stats"),
    legende: document.getElementById("legende"),
  };

  const etat = { jour: lireJour(), piece: null, donnees: null, survol: null };

  function pad(n) { return String(n).padStart(2, "0"); }
  function ymd(d) { return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`; }
  function iso(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function aujourdhui() { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
  function estAujourdhui() { return ymd(etat.jour) === ymd(aujourdhui()); }

  function lireJour() {
    const m = /^(\d{4})(\d{2})(\d{2})$/.exec(new URLSearchParams(location.search).get("date") || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : aujourdhui();
  }

  function minutes(libelle) {
    const [h, m] = libelle.split(":");
    return +h * 60 + +m;
  }

  function nombre(v, decimales) {
    return v == null ? "–" : v.toLocaleString("fr-FR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
  }

  async function charger() {
    const url = `data/data_${ymd(etat.jour)}.json`;
    try {
      const reponse = await fetch(url, { cache: "no-cache" });
      etat.donnees = reponse.ok ? await reponse.json() : null;
    } catch (erreur) {
      etat.donnees = null;
    }
    const pieces = etat.donnees ? Object.keys(etat.donnees).filter((k) => typeof etat.donnees[k] === "object") : [];
    if (!pieces.includes(etat.piece)) {
      const voulue = new URLSearchParams(location.search).get("piece");
      etat.piece = pieces.includes(voulue) ? voulue : pieces[0] || null;
    }
    etat.survol = null;
    dessinerTout(pieces);
  }

  function dessinerTout(pieces) {
    el.jour.value = iso(etat.jour);
    el.jour.max = iso(aujourdhui());
    el.suivant.disabled = estAujourdhui();

    el.pieces.replaceChildren(
      ...pieces.map((nom) => {
        const bouton = document.createElement("button");
        bouton.type = "button";
        bouton.textContent = nom;
        bouton.setAttribute("aria-pressed", String(nom === etat.piece));
        bouton.addEventListener("click", () => { etat.piece = nom; etat.survol = null; dessinerTout(pieces); });
        return bouton;
      })
    );
    Pieces.centrer();

    const serie = lireSerie();
    if (!serie) {
      const message = document.createElement("div");
      message.className = "message";
      message.textContent = "Pas de données pour ce jour.";
      el.graphique.replaceChildren(message);
      el.valeur.replaceChildren();
      el.stats.replaceChildren();
      el.legende.replaceChildren();
      return;
    }
    dessinerGraphique(serie);
    dessinerValeur(serie);
    dessinerStats(serie);
    dessinerLegende();
  }

  function lireSerie() {
    const piece = etat.donnees && etat.donnees[etat.piece];
    if (!piece || !piece[CONFIG.cle] || !piece[CONFIG.dates]) return null;
    const x = piece[CONFIG.dates].map(minutes);
    const valeurs = piece[CONFIG.cle];
    if (!valeurs.some((v) => v != null)) return null;
    return {
      x,
      valeurs,
      consigne: CONFIG.avecClim ? piece.consigne || [] : [],
      marche: CONFIG.avecClim ? piece.state || [] : [],
    };
  }

  function echelleY(serie) {
    const toutes = serie.valeurs.concat(serie.consigne).filter((v) => v != null);
    let min = Math.min(...toutes);
    let max = Math.max(...toutes);
    if (max - min < 2) { min -= 1; max += 1; }
    const pas = [0.5, 1, 2, 5, 10, 20].find((p) => (max - min) / p <= 6) || 20;
    min = Math.floor(min / pas) * pas;
    max = Math.ceil(max / pas) * pas;
    const graduations = [];
    for (let v = min; v <= max + 1e-9; v += pas) graduations.push(v);
    return { min, max, graduations, decimales: pas % 1 ? 1 : 0 };
  }

  function dessinerGraphique(serie) {
    const largeur = Math.max(el.graphique.clientWidth, 280);
    const hauteur = Math.max(HAUTEUR_MIN, Math.min(380, Math.round(largeur * 0.45)));
    const zoneL = largeur - MARGE.gauche - MARGE.droite;
    const zoneH = hauteur - MARGE.haut - MARGE.bas;
    const y = echelleY(serie);
    const px = (m) => MARGE.gauche + (m / 1440) * zoneL;
    const py = (v) => MARGE.haut + (1 - (v - y.min) / (y.max - y.min)) * zoneH;
    const pas = (zoneL / 288) + 0.5;

    let svg = `<svg viewBox="0 0 ${largeur} ${hauteur}" width="${largeur}" height="${hauteur}" role="img" aria-label="Courbe de la journée">`;
    for (const v of y.graduations) {
      svg += `<line class="grille" x1="${MARGE.gauche}" x2="${largeur - MARGE.droite}" y1="${py(v)}" y2="${py(v)}"/>`;
      svg += `<text x="${MARGE.gauche - 6}" y="${py(v) + 4}" text-anchor="end">${nombre(v, y.decimales)}</text>`;
    }
    for (let h = 0; h <= 24; h += 3) {
      svg += `<text x="${px(h * 60)}" y="${hauteur - 6}" text-anchor="${h === 0 ? "start" : h === 24 ? "end" : "middle"}">${pad(h)}h</text>`;
    }
    if (CONFIG.avecClim) {
      const bas = py(y.min);
      const haut = bas - zoneH * 0.08;
      serie.marche.forEach((on, i) => {
        if (on === 1) svg += `<rect class="marche" x="${px(serie.x[i]) - pas / 2}" y="${haut}" width="${pas}" height="${bas - haut}"/>`;
      });
      svg += `<path class="consigne" d="${chemin(serie.x, serie.consigne, px, py)}"/>`;
    }
    svg += `<path class="courbe" d="${chemin(serie.x, serie.valeurs, px, py)}"/>`;

    const i = etat.survol;
    if (i != null && serie.valeurs[i] != null) {
      svg += `<line class="repere" x1="${px(serie.x[i])}" x2="${px(serie.x[i])}" y1="${MARGE.haut}" y2="${MARGE.haut + zoneH}"/>`;
      svg += `<circle class="point" cx="${px(serie.x[i])}" cy="${py(serie.valeurs[i])}" r="5"/>`;
    }
    svg += "</svg>";
    el.graphique.innerHTML = svg;
    el.graphique.onpointermove = (e) => survoler(e, serie, zoneL);
    el.graphique.onpointerleave = () => { etat.survol = null; dessinerGraphique(serie); dessinerValeur(serie); };
  }

  // Trace une ligne en laissant un trou à chaque valeur manquante.
  function chemin(xs, valeurs, px, py) {
    let d = "";
    let enCours = false;
    valeurs.forEach((v, i) => {
      if (v == null) { enCours = false; return; }
      d += `${enCours ? "L" : "M"}${px(xs[i]).toFixed(1)} ${py(v).toFixed(1)}`;
      enCours = true;
    });
    return d;
  }

  function survoler(evenement, serie, zoneL) {
    const boite = el.graphique.getBoundingClientRect();
    const m = ((evenement.clientX - boite.left - MARGE.gauche) / zoneL) * 1440;
    let meilleur = null;
    let ecart = Infinity;
    serie.x.forEach((x, i) => {
      if (serie.valeurs[i] == null) return;
      const d = Math.abs(x - m);
      if (d < ecart) { ecart = d; meilleur = i; }
    });
    if (meilleur === etat.survol) return;
    etat.survol = meilleur;
    dessinerGraphique(serie);
    dessinerValeur(serie);
  }

  function dessinerValeur(serie) {
    let i = etat.survol;
    if (i == null) {
      for (let k = serie.valeurs.length - 1; k >= 0; k--) {
        if (serie.valeurs[k] != null) { i = k; break; }
      }
    }
    const heure = `${pad(Math.floor(serie.x[i] / 60))}:${pad(serie.x[i] % 60)}`;
    const fort = document.createElement("strong");
    fort.textContent = `${nombre(serie.valeurs[i], CONFIG.decimales)} ${CONFIG.unite}`;
    const noeuds = [fort, texte(heure)];
    if (CONFIG.avecClim) {
      if (serie.consigne[i] != null) noeuds.push(texte(`consigne ${nombre(serie.consigne[i], 0)} °C`));
      noeuds.push(texte(serie.marche[i] === 1 ? "en marche" : "à l'arrêt"));
    }
    el.valeur.replaceChildren(...noeuds);
  }

  function texte(contenu) {
    const s = document.createElement("span");
    s.textContent = contenu;
    return s;
  }

  function dessinerStats(serie) {
    const v = serie.valeurs.filter((x) => x != null);
    const somme = v.reduce((a, b) => a + b, 0);
    const lignes = [["Minimum", Math.min(...v)], ["Moyenne", somme / v.length], ["Maximum", Math.max(...v)]];
    if (CONFIG.avecClim) {
      const tranches = serie.marche.filter((x) => x === 1).length;
      lignes.push(["En marche", null, `${nombre((tranches * 5) / 60, 1)} h`]);
    }
    el.stats.replaceChildren(
      ...lignes.map(([titre, valeur, brut]) => {
        const bloc = document.createElement("div");
        const dt = document.createElement("dt");
        const dd = document.createElement("dd");
        dt.textContent = titre;
        dd.textContent = brut || `${nombre(valeur, CONFIG.decimales)} ${CONFIG.unite}`;
        bloc.append(dt, dd);
        return bloc;
      })
    );
  }

  function dessinerLegende() {
    if (!CONFIG.avecClim) { el.legende.replaceChildren(); return; }
    const elements = [["var(--accent)", "Température"], ["var(--consigne)", "Consigne"], ["var(--marche)", "En marche"]];
    el.legende.replaceChildren(
      ...elements.map(([couleur, nom]) => {
        const s = document.createElement("span");
        const marque = document.createElement("i");
        marque.style.background = couleur;
        s.append(marque, nom);
        return s;
      })
    );
  }

  function aller(decalage) {
    const d = new Date(etat.jour.getFullYear(), etat.jour.getMonth(), etat.jour.getDate() + decalage);
    if (d > aujourdhui()) return;
    etat.jour = d;
    memoriserUrl();
    charger();
  }

  function memoriserUrl() {
    const url = new URL(location.href);
    if (estAujourdhui()) url.searchParams.delete("date"); else url.searchParams.set("date", ymd(etat.jour));
    history.replaceState(null, "", url);
  }

  el.precedent.addEventListener("click", () => aller(-1));
  el.suivant.addEventListener("click", () => aller(1));
  el.jour.addEventListener("change", () => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(el.jour.value);
    if (!m) return;
    etat.jour = new Date(+m[1], +m[2] - 1, +m[3]);
    memoriserUrl();
    charger();
  });
  window.addEventListener("resize", () => { if (etat.donnees) charger(); });
  setInterval(() => { if (estAujourdhui() && !document.hidden) charger(); }, REFRESH_MS);

  charger();
})();
