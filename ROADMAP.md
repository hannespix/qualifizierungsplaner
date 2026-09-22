# ROADMAP — Laufbahnqualifizierung gD Landwirtschaft

> **Zweck:** persönlicher Terminplan der Laufbahnqualifizierung — Lehrgangs-
> termine, ULB-Abordnung, Verwaltungsfall, Dienstreisen, Export nach Outlook.
> **Daten:** ausschließlich lokal im Browser (`localStorage`). Kein Server,
> keine personenbezogenen Daten im Repo.

`@claude` arbeitet Milestones **einzeln, nacheinander** ab (siehe `AGENTS.md`).
Jeder Milestone endet lauffähig und hat eine Definition of Done.

---

## Erledigt

### M0 — Gerüst im Landesdesign ✅
Werkzeug aus der Einzeldatei in die Vorlagenstruktur überführt: `bw-theme.css`
als Single Source of Truth, `assets/css/app.css` nur mit `--bw-*`-Tokens,
React lokal unter `assets/vendor/react/`.
**Done:** startet ohne Konsolenfehler, CI-Header mit Logo bzw. Wortmarke.

### M1 — Navigation und Responsivität ✅
Kopfzeile nach CI-Muster (Logo links, Suche und Menü rechts), aktiver Eintrag
mit gelbem Marker, Hamburger unter 800px über `assets/js/nav.js`.
**Done:** bedienbar bis 375px Breite, kein horizontaler Überlauf,
Touch-Targets ≥ 44px.

### M2 — Globale Fuzzy-Suche ✅
Suche über alle relevanten Felder via `assets/js/search.js`: multitoken,
tippfehler- und diakritikatolerant, Ranking nach Relevanz, Treffer mit
`<mark class="bw-treffer">`.
**Done:** `prufung karlsruh` findet „Praktische Verwaltungsprüfung … Karlsruhe".

### M3 — Infografik nach Landes-CD ✅
Fünf fachliche Kategorien über die kategoriale Reihe `--bw-cat-1…6`, Optional
zusätzlich schraffiert, Gelb ausschließlich für offene Aufgaben und den einen
hervorgehobenen Wert. Quartalsdiagramm über `assets/js/chart.js`.
**Done:** keine freie Farbigkeit, Legenden vorhanden.

### M4 — Offline-Nachweis und Auslieferung ✅
`tools/check_offline.py` im CI, `tools/build_singlefile.py` erzeugt
`dist/index.html` mit inline-Theme, -Skripten und -Assets.
**Done:** Einzeldatei über `file://` geöffnet, null externe Requests.

---

## Offen

### M5 — Druckausgabe schärfen
**Ziel:** Die PDF-/Druckansicht vollständig auf Tokens umstellen und an A4
(quer und hoch) nachmessen; Seitenumbrüche in langen Terminlisten prüfen.
**Done:** Ausdruck ohne abgeschnittene Spalten, Kopfzeilen wiederholen sich,
Status nur über Kontur (keine Flächenfarben auf Papier).

### M6 — Sicherung wieder einlesen
**Ziel:** Die Backup-JSON zurückspielen können (heute nur Export).
**Done:** Datei auswählen, Vorschau der enthaltenen Termine, Übernahme ohne
Verlust bereits erfasster persönlicher Daten.

### M7 — Kennzahl „Dienstreisen"
**Ziel:** Die Aggregation in `lq-travel.js` zählt nur Termine mit bereits
bejahtem Reisebedarf. Solange der Bedarf offen ist, bleibt `required` bei 0.
Die Oberfläche weicht deshalb auf „Termine mit offener Reiseplanung" aus.
**Done:** eine Kennzahl, die Bedarf, Planung und Abrechnung sauber trennt.

### M8 — Dienstlicher Stand mit Schriften und Logo
**Ziel:** Internen (privaten) Stand mit lizenzierten Schriften und RPF-Logo
bereitstellen; öffentliche Variante bleibt ohne diese Dateien.
**Done:** Single-File-Build mit eingebetteten Schriften, Konsole ohne 404.
