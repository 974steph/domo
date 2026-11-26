"use strict";

// Sélecteur de pièces sur une seule ligne : seuls les boutons entiers sont visibles, et des
// flèches font défiler la ligne quand toutes les pièces ne tiennent pas.
const Pieces = (function () {
  const rangee = document.getElementById("pieces");
  const gauche = document.getElementById("pieces-gauche");
  const droite = document.getElementById("pieces-droite");

  function boutons() { return Array.from(rangee.children); }
  function gaucheDe(b) { return b.offsetLeft; }
  function droiteDe(b) { return b.offsetLeft + b.offsetWidth; }

  // Mesuré sur le conteneur entier, pour ne pas dépendre de la présence des flèches.
  function deborde() {
    const tous = boutons();
    if (!tous.length) return false;
    return droiteDe(tous[tous.length - 1]) - gaucheDe(tous[0]) > rangee.parentElement.clientWidth;
  }

  function rafraichir() {
    const debut = rangee.scrollLeft;
    const fin = debut + rangee.clientWidth;
    for (const b of boutons()) {
      b.style.visibility = gaucheDe(b) >= debut - 1 && droiteDe(b) <= fin + 1 ? "visible" : "hidden";
    }
    gauche.hidden = !deborde();
    droite.hidden = !deborde();
    gauche.disabled = debut <= 1;
    droite.disabled = fin >= rangee.scrollWidth - 1;
  }

  // Ramène le bouton choisi au centre de la ligne.
  function centrer() {
    const choisi = rangee.querySelector('[aria-pressed="true"]');
    if (choisi) rangee.scrollTo({ left: gaucheDe(choisi) - (rangee.clientWidth - choisi.offsetWidth) / 2, behavior: "instant" });
    rafraichir();
  }

  gauche.addEventListener("click", () => {
    const coupes = boutons().filter((b) => gaucheDe(b) < rangee.scrollLeft - 1);
    if (coupes.length) rangee.scrollTo({ left: gaucheDe(coupes[coupes.length - 1]) });
  });
  droite.addEventListener("click", () => {
    const fin = rangee.scrollLeft + rangee.clientWidth;
    const coupe = boutons().find((b) => droiteDe(b) > fin + 1);
    if (coupe) rangee.scrollTo({ left: droiteDe(coupe) - rangee.clientWidth });
  });
  rangee.addEventListener("scroll", rafraichir);
  window.addEventListener("resize", rafraichir);

  return { centrer };
})();
