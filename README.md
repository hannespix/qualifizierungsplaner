# Laufbahnqualifizierung gD Landwirtschaft — Terminplan

Persönliches Planungswerkzeug für die Laufbahnqualifizierung im gehobenen
landwirtschaftstechnischen Dienst in Baden-Württemberg. Das Werkzeug läuft
vollständig im Browser, ohne Server und ohne Internetverbindung.

Gestaltet nach dem **Landes-CD Baden-Württemberg** (https://design.landbw.de)
auf Basis der gemeinsamen Vorlage `Vorlage-Tool-im-Landesdesign`. Verbindlich
sind `CLAUDE.md` (Design + Technik) und `AGENTS.md` (Prozess).

**Live-Version:** https://hannespix.github.io/qualifizierungsplaner/

---

## Funktionen

- **Übersicht**: der nächste Termin, eine Liste „Zu erledigen“ mit Fristen und
  direktem Sprung zur passenden E-Mail-Vorlage, darunter die kommenden Termine
- **Filter** nach Teilnehmer (Qualifizierer, Anwärter, alle) und Status
  (Pflicht, optional, offen) – gilt für Übersicht, Termine und Kalender
- **Termine** als Tabelle und **Kalender** mit den gesetzlichen Feiertagen in
  Baden-Württemberg
- **Dienstreisen**: pro Termin vier Schritte zum Abhaken – Genehmigung
  (Antrag in DRIVE-BW, genehmigt), Fahrt (Bahnticket gebucht oder Dienstwagen
  reserviert), Unterkunft (Gästehaus, Hotel; reserviert, Anreise am Vorabend)
  und Abrechnung – mit den Fristen für die Zimmer-Abmeldung und die
  Reisekostenabrechnung
- **E-Mail-Vorlagen** für alle Vorgänge: Gästehaus (erster Block, weitere
  Wochen, Abmeldung, Mittagessen), Dienstreisen (Genehmigung und Buchungsweg
  klären, Antrag ankündigen, Dienstwagen), Lehrgänge (BW-I-Tage erfragen,
  fakultative Bausteine) und ULB-Abordnung (Anfrage, Meldung an die
  Prüfungsbehörde). Öffnen im Mailprogramm oder Text kopieren.
- **Globale Suche** über alle Felder: mehrere Wörter in beliebiger Reihenfolge,
  tippfehler- und umlauttolerant (`prufung karlsruh` findet
  „Prüfung … Karlsruhe"), Treffer werden hervorgehoben
- Planung der **ULB-Abordnung** (8 Wochen / 40 Arbeitstage, aufteilbar) und des
  **Verwaltungsfalls** vor der Verwaltungsprüfung
- **iCal-/Outlook-Export** und druckoptimierte **PDF-Ansicht**
- Persönliche Daten – auch Absender und Ansprechpersonen für die Vorlagen –
  bleiben im `localStorage` des Browsers

---

## Projektstruktur

```
index.html                  ← Rahmen, lädt Theme und Skripte
bw-theme.css                ← Design-System (Single Source of Truth)
assets/css/app.css          ← werkzeugspezifische Schicht, nur --bw-*-Tokens
assets/js/nav.js            ← Hamburger-Navigation (gemeinsam)
assets/js/search.js         ← globale Fuzzy-Suche (gemeinsam)
assets/js/chart.js          ← CI-konforme SVG-Diagramme (gemeinsam)
assets/js/lq-core.js        ← Datums-/KW-Logik, Filter, Fortschritt
assets/js/lq-data.js        ← Ausbildungsplan, Fakten zu Reise und Unterkunft mit Quellen
assets/js/lq-export.js      ← iCal-Erzeugung
assets/js/lq-travel.js      ← Dienstreise-Schritte, Fristen, Feiertage BW
assets/js/lq-mail.js        ← E-Mail-Vorlagen
assets/js/lq-app.js         ← Oberfläche (React)
assets/vendor/react/        ← React 16, lokal abgelegt (kein CDN)
assets/fonts/ · assets/logo/  ← lizenzpflichtig, siehe unten
tools/check_offline.py      ← prüft auf externe Referenzen (läuft im CI)
tools/build_singlefile.py   ← erzeugt dist/index.html als Einzeldatei
```

---

## Offline-Fähigkeit

Alle Abhängigkeiten — auch React — liegen lokal im Repo. Es gibt **keine
externen Requests**, keine CDNs, keine Web-Fonts von fremden Diensten und keine
Telemetrie.

Prüfen:

```bash
python3 tools/check_offline.py     # findet externe Lade-Referenzen
```

Der Check läuft als GitHub Action bei jedem Push und Pull Request
(`.github/workflows/offline-check.yml`).

### Auslieferung als Einzeldatei

```bash
python3 tools/build_singlefile.py  # -> dist/index.html
```

Die Einzeldatei enthält Theme, Skripte, Schriften und Bilder inline und lässt
sich per Doppelklick öffnen — geeignet für Zero-Trust-Arbeitsplätze.

---

## Lizenzpflichtige Schriften und Logo

**Dieses Repository ist öffentlich.** Die Schriften *BaWue Sans/Serif*
(Luzi Type) und das RPF-Logo dürfen nicht öffentlich verteilt werden. Sie sind
deshalb über `.gitignore` ausgeschlossen; nur die `LIZENZ.md` der beiden Ordner
liegt im Repo.

Folgen im öffentlichen Stand:

- Das Theme fällt auf die definierten System-Schriften zurück.
- Statt des Logos erscheint eine reine Wortmarke. Das Logo wird **nicht**
  nachgebaut.
- Die Browser-Konsole meldet für die fehlenden Dateien `404` — erwartetes
  Verhalten, keine Fehlfunktion.

Für den dienstlichen Stand die lizenzierten Dateien lokal ablegen:

```
assets/fonts/BaWueSansWeb-*.woff2 · .woff
assets/fonts/BaWueSerifWeb-*.woff2 · .woff
assets/logo/rpf-logo.png · rpf-logo-negativ.png
```

Danach greifen Schriften und Logo automatisch — auch im Single-File-Build, der
sie als data:-URLs einbettet. Personenbezogene Echtdaten gehören nie ins Repo.

---

## Datenschutz

Die Anwendung ist eine statische Seite. ULB-Blöcke, Reiseplanung, Hotel- oder
Ticketangaben liegen ausschließlich im `localStorage` des jeweiligen Browsers
und werden **nicht** an GitHub übertragen.

Da das Repository öffentlich ist, ist alles weltweit einsehbar, was fest in den
Quelltext geschrieben wird. Persönliche Angaben gehören daher ausschließlich in
die Eingabefelder der Oberfläche.

---

## Dienstreisen und Unterkunft – was gilt

| Frage | Antwort | Quelle |
| --- | --- | --- |
| Wer genehmigt? | Die unmittelbare Vorgesetzte oder der unmittelbare Vorgesetzte, grundsätzlich **vor Reisebeginn**. Antrag in DRIVE-BW unter „Dienstreise beantragen“, ersatzweise Vordruck LBV 1201. Allgemeine Dienstreisegenehmigungen sind vorgesehen. | [LBV: Genehmigung](https://lbv.landbw.de/-/genehmigung) |
| Wer bucht Bahn und Dienstwagen? | **Steht in keinem der Dokumente** und ist dienststellenintern geregelt. Das Werkzeug enthält dafür die Vorlage „Genehmigung und Buchungsweg klären“. | – |
| Welches Verkehrsmittel? | Öffentliche Verkehrsmittel sind Standard, Ermäßigungen wie eine BahnCard sind zu nutzen; Dienstwagen oder Privat-PKW nur mit triftigem Grund. | [LRKG / VwV LRKG](https://www.besoldung-baden-wuerttemberg.de/beamtenrecht_in_baden_wuerttemberg/reisekosten-in-baden-wuerttemberg/35220) |
| Wer trägt die Kosten? | Die Dienststelle. | Einladung des MLR vom 16.09.2026 |
| Wie buche ich das Gästehaus? | Erster Block: Mail an `fortbildung@lel.bwl.de` **bis 16.10.2026**. Weitere Wochen: nach dem ersten Block bei Abteilung 1. Nur wochenweise, verbindlich, derzeit 40 € pro Nacht. Abmeldung spätestens 5 Werktage vorher, sonst wird berechnet. Anreise am Vorabend bei der Reservierung angeben. | Informationsblatt Gästehaus, Stand September 2026 |
| Wo ist das Gästehaus? | Oberbettringer Straße 174, direkt neben der LEL (Europaplatz 1, Schwäbisch Gmünd). Kostenfreier Parkplatz; ab ZOB Schwäbisch Gmünd Linie 1 bis Hardt/Zwerenbergstraße, ca. 20 Minuten. | Informationsblatt; [LEL: Anfahrt](https://lel.landwirtschaft-bw.de/,Lde/Startseite/Wir+ueber+uns/Anfahrt+und+Lage+der+LEL) |
| Verpflegung? | Kantine an in der Regel vier Tagen, nach Voranmeldung vergünstigt (derzeit 6,30 €); Selbstverpflegung im Gästehaus möglich. | Informationsblatt |
| Bis wann abrechnen? | In DRIVE-BW unter „Reisekosten abrechnen“, innerhalb von **6 Monaten** nach Ende der Dienstreise. | [LBV: Fristen](https://lbv.landbw.de/-/frist-1) |
| Wie viel Übernachtung wird erstattet? | Bis 95 € pro Nacht im Inland. | LRKG |

Ältere Seiten der LEL nennen für das Gästehaus noch das „Haus der Gesundheit“
in der Weißensteiner Straße und ein Catering mit Frühstück. Das
Informationsblatt vom September 2026 ist neuer und hat Vorrang.

Namen und Durchwahlen einzelner Beschäftigter stehen bewusst nicht im Code –
das Repository ist öffentlich. Persönliche Ansprechpersonen trägst du unter
**Optionen** ein; sie bleiben im Browser.

Die Storno-Frist rechnet mit Arbeitstagen Montag bis Freitag ohne gesetzliche
Feiertage in Baden-Württemberg. Zählt die LEL Samstage als Werktage mit, liegt
die tatsächliche Frist einen Tag später – das Werkzeug warnt also nie zu spät.

---

## Datenstand

Die hinterlegten Termine entsprechen dem offiziellen **Ausbildungsplan
Laufbahnqualifizierung** der Regierungspräsidien Karlsruhe und Freiburg
(Az. 34c-8414.53 (26-28)), **Stand 15.09.2026** – Anlage 2 zur Einladung des
MLR vom 16.09.2026 (Az. MLR21-8414-90/7/1), unter dem Vorbehalt
„Änderungen vorbehalten".

Welche LEL-Lehrgänge tatsächlich zu besuchen sind, ergibt sich aus der **gelben
Markierung** im Ausbildungsplan; der Lehrgang Verwaltung am RP Karlsruhe kommt
laut Einladung verpflichtend hinzu. Die Ausbildungswoche am RP Karlsruhe (KW 9)
und die Wahlstationen sind fakultativ. Ergänzend berücksichtigt: APrOLW gD
(§ 4 und § 22 Abs. 3) sowie das Informationsblatt zum Gästehaus der LEL
(Reservierungsanfrage für den ersten Block bis 16.10.2026).

Beim ersten Aufruf einer neuen Planversion bleiben persönliche Eintragungen
erhalten: eigene Termine, ULB-Blöcke, Verwaltungsfall und die Reiseplanung je
Termin. Die Lehrgangstermine selbst ersetzt die neue Planversion.

---

## Lokale Nutzung und Entwicklung

`index.html` lässt sich direkt im Browser öffnen. Für die Entwicklung ist ein
einfacher Webserver bequemer:

```bash
python3 -m http.server 8000     # dann http://localhost:8000 öffnen
```

Es sind keine Build-Schritte und keine Laufzeit-Abhängigkeiten nötig.

---

## GitHub Pages

Das Deployment läuft über GitHub Actions (`.github/workflows/pages.yml`) bei
jedem Push auf `main`. Der Workflow aktiviert Pages über
`actions/configure-pages` mit `enablement: true` selbst. Falls das an
Berechtigungen scheitert, Pages einmalig manuell einschalten:

1. **Settings → Pages** öffnen.
2. Unter **Build and deployment → Source** **GitHub Actions** auswählen.
3. Den Workflow unter **Actions → Deploy GitHub Pages** erneut starten.
