/*
 * Tester for regnelogikken. Kjør med:  node --test
 * Ingen avhengigheter, bruker Nodes innebygde test-runner og assert.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseTall, trygtTall, beregnKjorekostnad, SLITASJE_VALG } = require('../calc.js');

test('parseTall: norske tallformater', () => {
  assert.equal(parseTall('1,50'), 1.5, 'komma som desimal');
  assert.equal(parseTall('1.50'), 1.5, 'punktum som desimal');
  assert.equal(parseTall('1 234'), 1234, 'mellomrom som tusenskille');
  assert.equal(parseTall('1.234,50'), 1234.5, 'punktum-tusen + komma-desimal');
  assert.equal(parseTall('  20,9  '), 20.9, 'trimmer mellomrom rundt');
  assert.equal(parseTall(7.5), 7.5, 'tall slipper rett gjennom');
});

test('parseTall: ugyldige verdier blir NaN', () => {
  assert.ok(Number.isNaN(parseTall('')), 'tom streng');
  assert.ok(Number.isNaN(parseTall('   ')), 'bare mellomrom');
  assert.ok(Number.isNaN(parseTall('abc')), 'bokstaver');
  assert.ok(Number.isNaN(parseTall(null)), 'null');
  assert.ok(Number.isNaN(parseTall(undefined)), 'undefined');
});

test('trygtTall: ugyldig og negativt faller tilbake til 0', () => {
  assert.equal(trygtTall('abc'), 0);
  assert.equal(trygtTall('-5'), 0, 'negativt avvises');
  assert.equal(trygtTall(''), 0);
  assert.equal(trygtTall('12,5'), 12.5);
  assert.equal(trygtTall('abc', 1), 1, 'egendefinert fallback');
});

test('beregnKjorekostnad: grunnleggende utregning', () => {
  // 100 km, 0,7 l/100km, 20 kr/l → 14 liter? nei: 100/100 * 0,7 = 0,7 l → 14 kr
  const r = beregnKjorekostnad({ literpris: 20, forbruk: 0.7, avstand: 100, slitasje: 1.5 });
  assert.equal(r.liter, 0.7, '0,7 liter brukt');
  assert.equal(r.drivstoff, 14, '0,7 l × 20 kr');
  assert.equal(r.slitasje, 150, '100 km × 1,5 kr');
  assert.equal(r.total, 164, 'drivstoff + slitasje');
  assert.equal(r.krPerMil, 16.4, '164 kr / 10 mil');
  assert.equal(r.krPerKm, 1.64);
});

test('beregnKjorekostnad: realistisk eksempel', () => {
  // 50 km, 0,6 l/100km, 21,90 kr/l, middels slitasje
  const r = beregnKjorekostnad({ literpris: 21.9, forbruk: 0.6, avstand: 50, slitasje: SLITASJE_VALG.middels });
  assert.equal(r.liter, 0.3);
  assert.ok(Math.abs(r.drivstoff - 6.57) < 1e-9, 'drivstoff ≈ 6,57');
  assert.equal(r.slitasje, 75, '50 km × 1,5');
  assert.ok(Math.abs(r.total - 81.57) < 1e-9);
});

test('beregnKjorekostnad: ingen slitasje gir ren drivstoffkostnad', () => {
  const r = beregnKjorekostnad({ literpris: 20, forbruk: 0.7, avstand: 100, slitasje: SLITASJE_VALG.ingen });
  assert.equal(SLITASJE_VALG.ingen, 0);
  assert.equal(r.slitasje, 0, 'ingen slitasje');
  assert.equal(r.total, r.drivstoff, 'totalen er bare drivstoff');
  assert.equal(r.total, 14);
  assert.equal(r.krPerMil, 1.4, 'kr/mil regnes fortsatt');
});

test('beregnKjorekostnad: tur/retur dobler avstanden', () => {
  const enVei = beregnKjorekostnad({ literpris: 20, forbruk: 0.5, avstand: 30, slitasje: 1, turRetur: false });
  const turRetur = beregnKjorekostnad({ literpris: 20, forbruk: 0.5, avstand: 30, slitasje: 1, turRetur: true });
  assert.equal(turRetur.avstand, 60, 'avstand dobles');
  assert.equal(turRetur.total, enVei.total * 2, 'kostnad dobles');
});

test('beregnKjorekostnad: spleis fordeler på personer', () => {
  const r = beregnKjorekostnad({ literpris: 20, forbruk: 1, avstand: 100, slitasje: 2, antallPersoner: 4 });
  // drivstoff: 1 l × 20 = ... 100/100*1 = 1 l → 20 kr; slitasje 200 → total 220
  assert.equal(r.total, 220);
  assert.equal(r.antallPersoner, 4);
  assert.equal(r.perPerson, 55, '220 / 4');
});

test('beregnKjorekostnad: antall personer normaliseres til minst 1', () => {
  assert.equal(beregnKjorekostnad({ avstand: 10, antallPersoner: 0 }).antallPersoner, 1);
  assert.equal(beregnKjorekostnad({ avstand: 10, antallPersoner: -3 }).antallPersoner, 1);
  assert.equal(beregnKjorekostnad({ avstand: 10, antallPersoner: 2.9 }).antallPersoner, 2, 'rundes ned');
  assert.equal(beregnKjorekostnad({ avstand: 10 }).antallPersoner, 1, 'mangler → 1');
});

test('beregnKjorekostnad: tomme/ugyldige felt gir 0, ikke NaN', () => {
  const r = beregnKjorekostnad({});
  assert.equal(r.total, 0);
  assert.equal(r.drivstoff, 0);
  assert.equal(r.slitasje, 0);
  assert.equal(r.perPerson, 0);
  assert.equal(r.krPerMil, null, 'ingen avstand → ingen kr/mil');
  assert.equal(r.krPerKm, null);

  const ugyldig = beregnKjorekostnad({ literpris: 'abc', forbruk: '', avstand: 'xx', slitasje: null });
  assert.equal(ugyldig.total, 0);
  assert.ok(!Number.isNaN(ugyldig.total));
});

test('beregnKjorekostnad: godtar norske kommatall som input', () => {
  const r = beregnKjorekostnad({ literpris: '21,90', forbruk: '0,6', avstand: '50', slitasje: '1,5' });
  assert.ok(Math.abs(r.drivstoff - 6.57) < 1e-9);
  assert.equal(r.slitasje, 75);
});
