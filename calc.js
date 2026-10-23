/*
 * calc.js: ren regnelogikk for Sjåførkalkulatoren.
 *
 * Holdt fri for DOM med vilje: de samme funksjonene kjører både i
 * nettleseren (lastet via <script>) og i Node (for testene). All
 * tallparsing og kostnadsutregning bor her, slik at app.js kun trenger
 * å koble verdier til skjermen.
 */

/**
 * Tolk et tall slik en nordmann skriver det.
 *
 * Håndterer komma som desimaltegn ("1,50"), punktum som desimaltegn
 * ("1.50"), mellomrom som tusenskille ("1 234") og den norske
 * kombinasjonen punktum-tusen + komma-desimal ("1.234,50").
 *
 * Returnerer NaN for tomt/ugyldig, kalleren bestemmer hva det skal bety.
 */
function parseTall(verdi) {
  if (typeof verdi === 'number') {
    return Number.isFinite(verdi) ? verdi : NaN;
  }
  if (verdi == null) return NaN;

  let s = String(verdi).trim().replace(/\s/g, '');
  if (s === '') return NaN;

  const harKomma = s.includes(',');
  const harPunktum = s.includes('.');

  if (harKomma && harPunktum) {
    // Anta "1.234,50": punktum = tusenskille, komma = desimal.
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (harKomma) {
    // Anta "1,50": komma = desimal.
    s = s.replace(',', '.');
  }

  const tall = Number(s);
  return Number.isFinite(tall) ? tall : NaN;
}

/**
 * Gjør en rå input om til et trygt, ikke-negativt tall.
 * Ugyldig eller negativt blir til `fallback` (default 0).
 */
function trygtTall(verdi, fallback = 0) {
  const tall = parseTall(verdi);
  if (!Number.isFinite(tall) || tall < 0) return fallback;
  return tall;
}

/**
 * Beregn kjørekostnaden for én tur.
 *
 * input: {
 *   literpris,        // kr per liter
 *   forbruk,          // liter per 100 km
 *   avstand,          // km, én vei
 *   slitasje,         // kr per km (dekk, service, vedlikehold, uten drivstoff)
 *   turRetur,         // bool, dobler avstanden
 *   antallPersoner,   // hvor mange deler regningen (minst 1)
 * }
 *
 * Alle felt er valgfrie; manglende/ugyldige verdier behandles som 0
 * (eller 1 person), slik at utregningen aldri gir NaN.
 */
function beregnKjorekostnad(input = {}) {
  const literpris = trygtTall(input.literpris);
  const forbruk = trygtTall(input.forbruk);
  const avstandEnVei = trygtTall(input.avstand);
  const slitasjesats = trygtTall(input.slitasje);
  const turRetur = Boolean(input.turRetur);

  let antallPersoner = parseTall(input.antallPersoner);
  if (!Number.isFinite(antallPersoner) || antallPersoner < 1) {
    antallPersoner = 1;
  }
  antallPersoner = Math.floor(antallPersoner);

  const avstand = turRetur ? avstandEnVei * 2 : avstandEnVei;

  const liter = (avstand / 100) * forbruk;
  const drivstoff = liter * literpris;
  const slitasje = avstand * slitasjesats;
  const total = drivstoff + slitasje;

  const perPerson = total / antallPersoner;
  const mil = avstand / 10;

  return {
    avstand,                                  // faktisk km (etter tur/retur)
    turRetur,
    liter,                                    // liter drivstoff brukt
    drivstoff,                                // kr drivstoff
    slitasje,                                 // kr slitasje
    total,                                    // kr totalt
    antallPersoner,
    perPerson,                                // kr per person
    krPerMil: mil > 0 ? total / mil : null,   // kr per mil (10 km)
    krPerKm: avstand > 0 ? total / avstand : null,
  };
}

// Slitasje-forhåndsvalg (kr/km). Tall fra NAF/bransje: dekk + service +
// vedlikehold uten drivstoff lander typisk på 1,0-2,0 kr/km.
const SLITASJE_VALG = {
  ingen: 0,     // bare drivstoff, f.eks. for å anslå egen bensinkostnad
  lav: 1.0,
  middels: 1.5,
  hoy: 2.0,
};

// Eksporter for Node (tester). I nettleseren er funksjonene globale.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseTall, trygtTall, beregnKjorekostnad, SLITASJE_VALG };
}
