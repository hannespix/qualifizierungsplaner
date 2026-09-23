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
      base({ id:'start', title:'Ausbildungsbeginn gD', start:'2026-11-01', end:'2026-11-01', sourceKW:'44', category:'Organisation', obligation:'Pflicht', kind:'milestone', location:'Stammdienststelle', notes:'Formaler Ausbildungsbeginn gD laut Ausbildungsplan. Deine Qualifizierungszeit beginnt laut Einladung des MLR vom 16.09.2026 allerdings erst mit dem ersten zentralen Lehrgang an der LEL am 09.11.2026.' }),
      base({ id:'gaestehaus', title:'Frist: Zimmer im Gästehaus der LEL anfragen', start:'2026-10-16', end:'2026-10-16', sourceKW:'42', category:'Organisation', obligation:'Pflicht', kind:'milestone', relevance:'Qualifizierer', location:'fortbildung@lel.bwl.de', travel:{required:'no'}, notes:'Reservierungsanfrage für den ersten Ausbildungsblock bis spätestens 16.10.2026 per Mail an das Fortbildungsteam der LEL. Einzelappartement derzeit 40 €/Nacht, Buchung nur wochenweise und verbindlich; die Kosten laufen über die Reisekostenabrechnung. Für die weiteren Lehrgangswochen meldest du dich nach dem ersten Block über Abteilung 1 an – Abmeldung spätestens 5 Werktage vorher, sonst wird berechnet.' }),
      base({ id:'lel46', title:'Kommunikation, Allgemeine Landwirtschaft', start:'2026-11-09', end:'2026-11-13', sourceKW:'46', category:'LEL', location:'LEL', notes:'Pflichtlehrgang (im Ausbildungsplan gelb markiert). Eröffnung am Montag, 09.11.2026, mit RP + MLR – damit beginnt laut Einladung deine Qualifizierungszeit.' }),
      base({ id:'mentor47', title:'Besprechung für Mentorinnen und Mentoren gD (online)', start:'2026-11-16', end:'2026-11-20', sourceKW:'47', category:'Organisation', relevance:'Anwärter', obligation:'Offen', location:'online', notes:'Offizieller Plan: „Termin noch offen, nicht für LQ“. Für dich als Qualifizierer ausdrücklich nicht relevant.' }),

      base({ id:'lel51', title:'Betriebswirtschaft I – Teil 1 / Landwirtschaft, Verwaltung, Recht', start:'2026-12-14', end:'2026-12-18', sourceKW:'51', category:'LEL', obligation:'Offen', location:'LEL', notes:'Offizieller Plan: „2 Tage für LQ, genaue Termine noch offen“. Pflichtlehrgang (im Ausbildungsplan gelb markiert), für dich aber nur 2 Tage – die ganze Woche ist als Rahmen hinterlegt, sobald die beiden Tage feststehen hier eintragen. Die LEL-Lehrgänge finden in der Regel in Präsenz statt, einzelne Tage online; je nach Referent können auch Tage außerhalb der regulären Lehrgangswoche liegen.' }),

      base({ id:'lel02', title:'Betriebswirtschaft I – Teil 2 / Landwirtschaft, Verwaltung, Recht', start:'2027-01-11', end:'2027-01-15', sourceKW:'2', category:'LEL', obligation:'Offen', location:'LEL', notes:'Offizieller Plan: „2 Tage für LQ, genaue Termine noch offen“. Pflichtlehrgang (im Ausbildungsplan gelb markiert), für dich aber nur 2 Tage – die ganze Woche ist als Rahmen hinterlegt, sobald die beiden Tage feststehen hier eintragen. Die LEL-Lehrgänge finden in der Regel in Präsenz statt, einzelne Tage online; je nach Referent können auch Tage außerhalb der regulären Lehrgangswoche liegen.' }),

      base({ id:'lel08', title:'Landwirtschaft, Verwaltung, Recht', start:'2027-02-22', end:'2027-02-26', sourceKW:'8', category:'LEL', location:'LEL', notes:'Pflichtlehrgang (im Ausbildungsplan gelb markiert). Gegenüber dem Entwurf 04.09.2026 um eine Woche verschoben (vorher KW 7, 15.–19.02.2027).' }),
      base({ id:'rpk09', title:'Lehrgang: Aufgaben der Abt. 3', start:'2027-03-01', end:'2027-03-05', sourceKW:'9', category:'RPK / Verwaltung', obligation:'Optional', location:'RP Karlsruhe', statusNote:'Im Ausbildungsplan als „Optional“ gekennzeichnet.', notes:'Freiwillig. Die Einladung des MLR formuliert es so: „Fakultativ können die Ausbildungswoche am RP Karlsruhe sowie die Wahlstationen an den Landesanstalten wahrgenommen werden.“ Dazu ist Rücksprache mit der Ausbildungsleitung zu halten.' }),

      base({ id:'lel10', title:'Landwirtschaft, Verwaltung · Planung Veranstaltung bEB mit Mentoren (Mi) · BW II (Do)', start:'2027-03-08', end:'2027-03-11', sourceKW:'10', category:'LEL', location:'LEL', notes:'Pflichtlehrgang (im Ausbildungsplan gelb markiert). „LQ bis Do“ – für dich endet die Woche am Donnerstag. Die Planung der Veranstaltung bEB mit den Mentoren findet am Mittwoch statt, Betriebswirtschaft II beginnt am Donnerstag.' }),
      base({ id:'lel10fr', title:'Betriebswirtschaft II – Freitag (ohne LQ)', start:'2027-03-12', end:'2027-03-12', sourceKW:'10', category:'LEL', relevance:'Anwärter', location:'LEL', notes:'Offizieller Plan: BW II läuft Do und Fr, für LQ jedoch nur „bis Do“. Der Freitag ist deshalb nicht Teil deiner Laufbahnqualifizierung.' }),

      base({ id:'bw2kw11', title:'Betriebswirtschaft II (ohne LQ)', start:'2027-03-15', end:'2027-03-19', sourceKW:'11', category:'LEL', relevance:'Anwärter', location:'Stammdienststelle', notes:'Geklärt über die Einladung: Die von dir zu absolvierenden LEL-Lehrgänge sind im Ausbildungsplan gelb markiert – diese Woche ist es nicht. Bemerkung im Plan: „nur gD, gem. mit hD“. Für dich also kein Pflichttermin.' }),

      base({ id:'wahl23', title:'Wahlstation: LTZ Augustenberg (4 Tage)', start:'2027-06-07', end:'2027-06-10', sourceKW:'23', category:'Wahlstation', obligation:'Optional', location:'LTZ Augustenberg', notes:'Fakultativ laut Einladung des MLR; Rücksprache mit der Ausbildungsleitung halten. Plan: „optional: Wahlstation: LTZ Augustenberg (4 Tage)“, gemeinsam mit hD. Station: Stammdienststelle oder Landesanstalt.' }),
      base({ id:'wahl24', title:'Wahlstation – noch offen', start:'2027-06-14', end:'2027-06-18', sourceKW:'24', category:'Wahlstation', obligation:'Optional', location:'offen', notes:'Offizieller Plan: „optional: ggf. Wahlstation“.' }),
      base({ id:'wahl25', title:'Wahlstation – noch offen', start:'2027-06-21', end:'2027-06-25', sourceKW:'25', category:'Wahlstation', obligation:'Optional', location:'offen', notes:'Offizieller Plan: „optional: ggf. Wahlstation“.' }),
      base({ id:'lel26', title:'Landwirtschaft, Verwaltung und Recht', start:'2027-06-28', end:'2027-07-02', sourceKW:'26', category:'LEL', location:'LEL' }),
      base({ id:'wahl27', title:'Wahlstation: LAZBW Aulendorf', start:'2027-07-05', end:'2027-07-09', sourceKW:'27', category:'Wahlstation', obligation:'Optional', location:'LAZBW Aulendorf', notes:'Offizieller Plan: „optional: Wahlstation: LAZBW Aulendorf“, gemeinsam mit hD.' }),
      base({ id:'wahl28', title:'Wahlstation: LSZ Boxberg', start:'2027-07-12', end:'2027-07-16', sourceKW:'28', category:'Wahlstation', obligation:'Optional', location:'LSZ Boxberg', notes:'Offizieller Plan: „optional: Wahlstation LSZ Boxberg“.' }),

      base({ id:'berExam31', title:'Anwärter – Beratungsprüfung', start:'2027-08-02', end:'2027-08-06', sourceKW:'31', category:'Beratung', relevance:'Anwärter', location:'Stammdienststelle', notes:'Neu terminiert: Der offizielle Plan führt die Beratungsprüfung einmalig in KW 31. Im Entwurf 04.09.2026 standen dafür noch Vorbereitung (KW 35–36) und Prüfungen in KW 37 (RP Karlsruhe) und KW 38 (RP Freiburg). Die Laufbahnqualifizierung endet laut Plan mit der Praktischen Prüfung Verwaltung – die Beratungsprüfung gehört nicht zu deinen Prüfungen.' }),

      base({ id:'lel45', title:'Landwirtschaft, Verwaltung und Recht', start:'2027-11-08', end:'2027-11-12', sourceKW:'45', category:'LEL', location:'LEL', notes:'Pflichtlehrgang (im Ausbildungsplan gelb markiert). Gegenüber dem Entwurf 04.09.2026 um eine Woche verschoben (vorher KW 44, 01.–05.11.2027).' }),
      base({ id:'verw46', title:'Lehrgang Verwaltung', start:'2027-11-15', end:'2027-11-19', sourceKW:'46', category:'RPK / Verwaltung', location:'RP Karlsruhe', notes:'Pflicht: „Zusätzlich ist der Lehrgang für Verwaltung am RP Karlsruhe zu besuchen“ (Einladung MLR vom 16.09.2026). Mo/Di in Präsenz, ab Mi online. Gegenüber dem Entwurf 04.09.2026 von zwei Wochen (KW 45 + 46) auf diese eine Woche gekürzt.' }),
      base({ id:'prep48', title:'Vorbereitungszeitraum Verwaltungsprüfung', start:'2027-11-29', end:'2027-12-10', sourceKW:'48–49', category:'Prüfungsvorbereitung', location:'Dienststelle / ULB', planWindow:true, notes:'Zweiwöchiger Vorbereitungszeitraum laut Ausbildungsplan – entspricht den zwei Wochen Bearbeitungszeit für den Verwaltungsvorgang nach § 22 Abs. 3 APrOLW gD. Der konkrete persönliche Verwaltungsfall an einer ULB wird separat terminiert.' }),
      base({ id:'exam50', title:'Praktische Prüfung Verwaltung', start:'2027-12-14', end:'2027-12-15', sourceKW:'50', category:'Prüfung', location:'RP Karlsruhe', notes:'14.12.2027/15.12.2027, 1 Tag je Prüfling – der genaue Tag wird noch bekannt gegeben. Ablauf nach § 22 Abs. 3 APrOLW gD: umfassender Verwaltungsvorgang, in zwei Wochen selbstständig zu bearbeiten; Arbeitsschritte und Ergebnis spätestens eine Stunde vor dem Prüfungsgespräch schriftlich vorlegen. Prüfungsgespräch rund 20 Minuten, beginnend mit einem Kurzvortrag von höchstens 10 Minuten. Mindestens 5,0 Punkte erforderlich, einmal wiederholbar (§ 28). Mit dieser Prüfung endet deine Laufbahnqualifizierung.' }),
    ];
  }


  const REQUIREMENTS = {
    ulb8: { id:'ulb8', title:'ULB-Abordnung', targetDays:40, targetWeeks:8 },
    caseprep2w: { id:'caseprep2w', title:'Fallbearbeitung Verwaltungsprüfung an ULB', targetWeeks:2 },
  };

  globalThis.LQData = { makeDefaultEvents, REQUIREMENTS };
})();
