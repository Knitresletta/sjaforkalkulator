/*
 * app.js — kobler skjemaet til regnelogikken i calc.js.
 *
 * Ansvar her: lese inputfelter, regne om ved hver endring, skrive
 * resultatet til skjermen, og huske verdiene i localStorage mellom
 * besøk. Selve utregningen ligger i beregnKjorekostnad() (calc.js).
 */
(function () {
  'use strict';

  const LAGER_NOKKEL = 'sjaforkalkulator.v1';

  // ---- Formattering -------------------------------------------------------
  const kr = new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const tall1 = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1 });

  // ---- Elementer ----------------------------------------------------------
  const el = {
    literpris: document.getElementById('literpris'),
    forbruk: document.getElementById('forbruk'),
    avstand: document.getElementById('avstand'),
    turRetur: document.getElementById('turRetur'),
    slitasjeValg: document.getElementById('slitasjeValg'),
    egenRad: document.getElementById('egenRad'),
    slitasjeEgen: document.getElementById('slitasjeEgen'),
    antallPersoner: document.getElementById('antallPersoner'),
    personerMinus: document.getElementById('personerMinus'),
    personerPluss: document.getElementById('personerPluss'),
    // resultat
    totalKr: document.getElementById('totalKr'),
    drivstoffKr: document.getElementById('drivstoffKr'),
    slitasjeRad: document.getElementById('slitasjeRad'),
    slitasjeKr: document.getElementById('slitasjeKr'),
    perPersonRad: document.getElementById('perPersonRad'),
    perPersonKr: document.getElementById('perPersonKr'),
    meta: document.getElementById('meta'),
  };

  // ---- Slitasje: hvilket nivå er valgt -----------------------------------
  // Default "middels" (1,5). "0" er "Ingen" (bare drivstoff), "egen" betyr
  // at brukeren skriver eget tall.
  let slitasjeModus = '1.5';

  function gjeldendeSlitasje() {
    if (slitasjeModus === 'egen') {
      return el.slitasjeEgen.value;
    }
    return slitasjeModus;
  }

  function settSlitasjeKnapp(verdi) {
    slitasjeModus = verdi;
    for (const knapp of el.slitasjeValg.querySelectorAll('.sk-segment-knapp')) {
      knapp.classList.toggle('sk-aktiv', knapp.dataset.verdi === verdi);
    }
    el.egenRad.classList.toggle('sk-vis', verdi === 'egen');
    if (verdi === 'egen') {
      el.slitasjeEgen.focus();
    }
  }

  // ---- Antall personer ----------------------------------------------------
  function lesPersoner() {
    const n = parseInt(el.antallPersoner.value, 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  }
  function settPersoner(n) {
    const trygg = Math.max(1, Math.min(99, n));
    el.antallPersoner.value = String(trygg);
  }

  // ---- Hovedløkke: regn ut og tegn ---------------------------------------
  function oppdater() {
    const r = beregnKjorekostnad({
      literpris: el.literpris.value,
      forbruk: el.forbruk.value,
      avstand: el.avstand.value,
      slitasje: gjeldendeSlitasje(),
      turRetur: el.turRetur.checked,
      antallPersoner: el.antallPersoner.value,
    });

    el.totalKr.textContent = kr.format(r.total);
    el.drivstoffKr.textContent = kr.format(r.drivstoff);
    el.slitasjeKr.textContent = kr.format(r.slitasje);
    // Med "Ingen" valgt er slitasjeraden støy: totalen er ren drivstoff.
    el.slitasjeRad.hidden = slitasjeModus === '0';

    // Per person vises bare når flere deler regningen
    if (r.antallPersoner > 1) {
      el.perPersonKr.textContent = kr.format(r.perPerson);
      el.perPersonRad.hidden = false;
    } else {
      el.perPersonRad.hidden = true;
    }

    // Meta-linje: oppsummer turen
    if (r.avstand > 0) {
      const deler = [
        `${tall1.format(r.avstand)} km${r.turRetur ? ' (t/r)' : ''}`,
        `${tall1.format(r.liter)} l drivstoff`,
      ];
      if (r.krPerMil != null) deler.push(`${kr.format(r.krPerMil)}/mil`);
      el.meta.textContent = deler.join(' · ');
    } else {
      el.meta.textContent = 'Fyll inn feltene over for å se kostnaden.';
    }

    lagre();
  }

  // ---- Lagring ------------------------------------------------------------
  function lagre() {
    try {
      const data = {
        literpris: el.literpris.value,
        forbruk: el.forbruk.value,
        avstand: el.avstand.value,
        turRetur: el.turRetur.checked,
        slitasjeModus: slitasjeModus,
        slitasjeEgen: el.slitasjeEgen.value,
        antallPersoner: el.antallPersoner.value,
      };
      localStorage.setItem(LAGER_NOKKEL, JSON.stringify(data));
    } catch (e) {
      // localStorage kan være blokkert (privat modus e.l.) — ignorer stille.
    }
  }

  function lastInn() {
    let data;
    try {
      data = JSON.parse(localStorage.getItem(LAGER_NOKKEL) || '{}');
    } catch (e) {
      data = {};
    }
    if (data.literpris != null) el.literpris.value = data.literpris;
    if (data.forbruk != null) el.forbruk.value = data.forbruk;
    if (data.avstand != null) el.avstand.value = data.avstand;
    if (data.turRetur != null) el.turRetur.checked = data.turRetur;
    if (data.slitasjeEgen != null) el.slitasjeEgen.value = data.slitasjeEgen;
    if (data.antallPersoner != null) el.antallPersoner.value = data.antallPersoner;
    settSlitasjeKnapp(data.slitasjeModus || '1.5');
  }

  // ---- Hendelser ----------------------------------------------------------
  function koble() {
    // Tekstfelt + bryter → regn på hver endring
    for (const felt of [el.literpris, el.forbruk, el.avstand, el.slitasjeEgen]) {
      felt.addEventListener('input', oppdater);
    }
    el.turRetur.addEventListener('change', oppdater);
    el.antallPersoner.addEventListener('input', oppdater);
    el.antallPersoner.addEventListener('blur', () => {
      settPersoner(lesPersoner());
      oppdater();
    });

    // Slitasje-segment
    el.slitasjeValg.addEventListener('click', (e) => {
      const knapp = e.target.closest('.sk-segment-knapp');
      if (!knapp) return;
      settSlitasjeKnapp(knapp.dataset.verdi);
      oppdater();
    });

    // Stepper
    el.personerMinus.addEventListener('click', () => {
      settPersoner(lesPersoner() - 1);
      oppdater();
    });
    el.personerPluss.addEventListener('click', () => {
      settPersoner(lesPersoner() + 1);
      oppdater();
    });
  }

  // ---- Oppstart -----------------------------------------------------------
  lastInn();
  koble();
  oppdater();
})();
