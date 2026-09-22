(() => {
  const C = globalThis.LQCore;
  if (!C) throw new Error('LQCore must be loaded before LQData');

  const base = (x) => ({
    relevance: 'Beide',
    obligation: 'Pflicht',
    statusOrigin: 'reference',
    location: '',
    notes: '',
    ...x,
  });

  function makeDefaultEvents() {
    return [
      base({ id:'start', title:'Ausbildungsbeginn gD', start:'2026-11-01', end:'2026-11-01', sourceKW:'44', category:'Organisation', obligation:'Pflicht', kind:'milestone', location:'Stammdienststelle', notes:'Formaler Ausbildungsbeginn laut offiziellem Ausbildungsplan (Stand 15.09.2026).' }),
      base({ id:'lel46', title:'Kommunikation, Allgemeine Landwirtschaft', start:'2026-11-09', end:'2026-11-13', sourceKW:'46', category:'LEL', location:'LEL', notes:'Eröffnung am Montag, 09.11.2026, mit RP + MLR.' }),
      base({ id:'mentor47', title:'Besprechung für Mentorinnen und Mentoren gD (online)', start:'2026-11-16', end:'2026-11-20', sourceKW:'47', category:'Organisation', relevance:'Anwärter', obligation:'Offen', location:'online', notes:'Offizieller Plan: „Termin noch offen, nicht für LQ“. Für dich als Qualifizierer ausdrücklich nicht relevant.' }),

      base({ id:'lel51', title:'Betriebswirtschaft I – Teil 1 / Landwirtschaft, Verwaltung, Recht', start:'2026-12-14', end:'2026-12-18', sourceKW:'51', category:'LEL', obligation:'Offen', location:'LEL', notes:'Offizieller Plan: „2 Tage für LQ, genaue Termine noch offen“. Die ganze Woche ist als Rahmen hinterlegt – sobald die beiden Tage feststehen, hier eintragen. (Im Entwurf 04.09.2026 war die Woche noch in Mo–Mi optional und Do–Fr Pflicht aufgeteilt.)' }),

      base({ id:'lel02', title:'Betriebswirtschaft I – Teil 2 / Landwirtschaft, Verwaltung, Recht', start:'2027-01-11', end:'2027-01-15', sourceKW:'2', category:'LEL', obligation:'Offen', location:'LEL', notes:'Offizieller Plan: „2 Tage für LQ, genaue Termine noch offen“. Die ganze Woche ist als Rahmen hinterlegt – sobald die beiden Tage feststehen, hier eintragen. (Im Entwurf 04.09.2026 war die Woche noch in Mo–Mi optional und Do–Fr Pflicht aufgeteilt.)' }),

      base({ id:'lel08', title:'Landwirtschaft, Verwaltung, Recht', start:'2027-02-22', end:'2027-02-26', sourceKW:'8', category:'LEL', location:'LEL', notes:'Verschoben: Im Entwurf 04.09.2026 noch KW 7 (15.–19.02.2027), im offiziellen Plan eine Woche später.' }),
      base({ id:'rpk09', title:'Lehrgang: Aufgaben der Abt. 3', start:'2027-03-01', end:'2027-03-05', sourceKW:'9', category:'RPK / Verwaltung', obligation:'Optional', location:'RP Karlsruhe', statusNote:'Im offiziellen Plan ausdrücklich als „Optional“ gekennzeichnet.', notes:'Der offizielle Plan schreibt „Optional: Lehrgang: Aufgaben der Abt. 3“.' }),

      base({ id:'lel10', title:'Landwirtschaft, Verwaltung · Planung Veranstaltung bEB mit Mentoren (Mi) · BW II (Do)', start:'2027-03-08', end:'2027-03-11', sourceKW:'10', category:'LEL', location:'LEL', notes:'Offizieller Plan: „LQ bis Do“ – für dich endet die Woche am Donnerstag. Die Planung der Veranstaltung bEB mit den Mentoren findet am Mittwoch statt, Betriebswirtschaft II beginnt am Donnerstag.' }),
      base({ id:'lel10fr', title:'Betriebswirtschaft II – Freitag (ohne LQ)', start:'2027-03-12', end:'2027-03-12', sourceKW:'10', category:'LEL', relevance:'Anwärter', location:'LEL', notes:'Offizieller Plan: BW II läuft Do und Fr, für LQ jedoch nur „bis Do“. Der Freitag ist deshalb nicht Teil deiner Laufbahnqualifizierung.' }),

      base({ id:'bw2kw11', title:'Betriebswirtschaft II', start:'2027-03-15', end:'2027-03-19', sourceKW:'11', category:'LEL', obligation:'Pflicht', location:'Stammdienststelle', notes:'Statuswechsel gegenüber dem Entwurf: Im offiziellen Plan ohne Optional-Kennzeichnung, Bemerkung „nur gD, gem. mit hD“, Station Stammdienststelle (im Entwurf noch LEL und optional). Bitte bei Gelegenheit bestätigen lassen.' }),

      base({ id:'wahl23', title:'Wahlstation: LTZ Augustenberg (4 Tage)', start:'2027-06-07', end:'2027-06-10', sourceKW:'23', category:'Wahlstation', obligation:'Optional', location:'LTZ Augustenberg', notes:'Offizieller Plan: „optional: Wahlstation: LTZ Augustenberg (4 Tage)“, gemeinsam mit hD. Station: Stammdienststelle oder Landesanstalt.' }),
      base({ id:'wahl24', title:'Wahlstation – noch offen', start:'2027-06-14', end:'2027-06-18', sourceKW:'24', category:'Wahlstation', obligation:'Optional', location:'offen', notes:'Offizieller Plan: „optional: ggf. Wahlstation“.' }),
      base({ id:'wahl25', title:'Wahlstation – noch offen', start:'2027-06-21', end:'2027-06-25', sourceKW:'25', category:'Wahlstation', obligation:'Optional', location:'offen', notes:'Offizieller Plan: „optional: ggf. Wahlstation“.' }),
      base({ id:'lel26', title:'Landwirtschaft, Verwaltung und Recht', start:'2027-06-28', end:'2027-07-02', sourceKW:'26', category:'LEL', location:'LEL' }),
      base({ id:'wahl27', title:'Wahlstation: LAZBW Aulendorf', start:'2027-07-05', end:'2027-07-09', sourceKW:'27', category:'Wahlstation', obligation:'Optional', location:'LAZBW Aulendorf', notes:'Offizieller Plan: „optional: Wahlstation: LAZBW Aulendorf“, gemeinsam mit hD.' }),
      base({ id:'wahl28', title:'Wahlstation: LSZ Boxberg', start:'2027-07-12', end:'2027-07-16', sourceKW:'28', category:'Wahlstation', obligation:'Optional', location:'LSZ Boxberg', notes:'Offizieller Plan: „optional: Wahlstation LSZ Boxberg“.' }),

      base({ id:'berExam31', title:'Anwärter – Beratungsprüfung', start:'2027-08-02', end:'2027-08-06', sourceKW:'31', category:'Beratung', relevance:'Anwärter', location:'Stammdienststelle', notes:'Neu terminiert: Der offizielle Plan führt die Beratungsprüfung einmalig in KW 31. Im Entwurf 04.09.2026 standen dafür noch Vorbereitung (KW 35–36) und Prüfungen in KW 37 (RP Karlsruhe) und KW 38 (RP Freiburg). Die Laufbahnqualifizierung endet laut Plan mit der Praktischen Prüfung Verwaltung – die Beratungsprüfung gehört nicht zu deinen Prüfungen.' }),

      base({ id:'lel45', title:'Landwirtschaft, Verwaltung und Recht', start:'2027-11-08', end:'2027-11-12', sourceKW:'45', category:'LEL', location:'LEL', notes:'Verschoben: Im Entwurf 04.09.2026 noch KW 44 (01.–05.11.2027), im offiziellen Plan eine Woche später.' }),
      base({ id:'verw46', title:'Lehrgang Verwaltung', start:'2027-11-15', end:'2027-11-19', sourceKW:'46', category:'RPK / Verwaltung', location:'RP Karlsruhe', notes:'Gekürzt: Der Entwurf 04.09.2026 sah zwei Wochen vor (KW 45 Präsenz + KW 46 online), der offizielle Plan nur noch diese eine Woche – Mo/Di in Präsenz, ab Mi online.' }),
      base({ id:'prep48', title:'Vorbereitungszeitraum Verwaltungsprüfung', start:'2027-11-29', end:'2027-12-10', sourceKW:'48–49', category:'Prüfungsvorbereitung', location:'Dienststelle / ULB', planWindow:true, notes:'Zweiwöchiger Vorbereitungszeitraum laut offiziellem Plan. Der konkrete persönliche Verwaltungsfall an einer ULB wird im Dashboard separat manuell terminiert.' }),
      base({ id:'exam50', title:'Praktische Prüfung Verwaltung', start:'2027-12-14', end:'2027-12-15', sourceKW:'50', category:'Prüfung', location:'RP Karlsruhe', notes:'Konkretisiert: Der offizielle Plan nennt den 14.12.2027/15.12.2027, 1 Tag je Prüfling – der genaue Tag wird noch bekannt gegeben. Im Entwurf 04.09.2026 war dafür noch die ganze KW 50 als Fenster geblockt. Mit dieser Prüfung endet deine Laufbahnqualifizierung.' }),
    ];
  }

  const DIFFS = [
    { block:'Ausbildungsbeginn gD', old:'KW 44', next:'KW 44', obligation:'Pflicht', note:'unverändert · 01.11.2026' },
    { block:'Kommunikation / Allgemeine Landwirtschaft', old:'KW 46', next:'KW 46', obligation:'Pflicht', note:'unverändert · Eröffnung Mo 09.11.2026' },
    { block:'Besprechung Mentorinnen/Mentoren', old:'KW 47', next:'KW 47', obligation:'Offen', note:'jetzt ausdrücklich „nicht für LQ“' },
    { block:'BW I – Teil 1', old:'KW 51', next:'KW 51', obligation:'Offen', note:'statt Mo–Mi/Do–Fr jetzt „2 Tage für LQ“, Termine offen' },
    { block:'BW I – Teil 2', old:'KW 2', next:'KW 2', obligation:'Offen', note:'statt Mo–Mi/Do–Fr jetzt „2 Tage für LQ“, Termine offen' },
    { block:'Landwirtschaft, Verwaltung, Recht (Feb.)', old:'KW 7', next:'KW 8', obligation:'Pflicht', note:'+1 KW · 22.–26.02.2027' },
    { block:'Aufgaben der Abt. 3', old:'KW 9', next:'KW 9', obligation:'Optional', note:'🔒 unverändert optional' },
    { block:'LEL / Veranstaltung bEB / BW II', old:'KW 10', next:'KW 10', obligation:'Pflicht', note:'unverändert · „LQ bis Do“, Freitag ohne LQ' },
    { block:'Betriebswirtschaft II', old:'KW 11', next:'KW 11', obligation:'Pflicht', note:'⚠ war optional (LEL) – jetzt ohne Optional-Kennzeichnung, Stammdienststelle' },
    { block:'Vorbereitung Beratungsübung', old:'KW 15–17', next:'entfällt', obligation:'Optional', note:'im offiziellen Plan nicht mehr enthalten' },
    { block:'Beratungsübungen RP FR / RP KA', old:'KW 18', next:'entfällt', obligation:'Optional', note:'im offiziellen Plan nicht mehr enthalten' },
    { block:'Wahlstation LTZ Augustenberg', old:'KW 23', next:'KW 23', obligation:'Optional', note:'🔒 unverändert · 4 Tage, gem. mit hD' },
    { block:'weitere Wahlstation(en)', old:'KW 24–25 / 27–28', next:'KW 24–25 / 27–28', obligation:'Optional', note:'🔒 unverändert optional' },
    { block:'LEL Landwirtschaft, Verwaltung und Recht (Sommer)', old:'KW 26', next:'KW 26', obligation:'Pflicht', note:'unverändert' },
    { block:'Beratungsprüfung (Anwärter)', old:'KW 35–38', next:'KW 31', obligation:'Pflicht', note:'zusammengefasst und vorgezogen · nicht für Qualifizierer' },
    { block:'LEL Landwirtschaft, Verwaltung und Recht (Nov.)', old:'KW 44', next:'KW 45', obligation:'Pflicht', note:'+1 KW · 08.–12.11.2027' },
    { block:'Lehrgang Verwaltung', old:'KW 45–46', next:'KW 46', obligation:'Pflicht', note:'von 2 Wochen auf 1 Woche gekürzt · Mo/Di Präsenz, ab Mi online' },
    { block:'Vorbereitung Verwaltungsprüfung', old:'KW 48–49', next:'KW 48–49', obligation:'Pflicht', note:'unverändert' },
    { block:'Praktische Prüfung Verwaltung', old:'KW 50 (ganze Woche)', next:'14./15.12.2027', obligation:'Pflicht', note:'konkretisiert · 1 Tag je Prüfling, Tag wird noch bekannt gegeben' },
    { block:'Anwärter-Prüfungen 2028', old:'KW 1 / 27.01. / 23.02.2028', next:'entfällt', obligation:'Offen', note:'offizieller Plan endet mit KW 52/2027' },
  ];

  const REQUIREMENTS = {
    ulb8: { id:'ulb8', title:'ULB-Abordnung', targetDays:40, targetWeeks:8 },
    caseprep2w: { id:'caseprep2w', title:'Fallbearbeitung Verwaltungsprüfung an ULB', targetWeeks:2 },
  };

  globalThis.LQData = { makeDefaultEvents, DIFFS, REQUIREMENTS };
})();
