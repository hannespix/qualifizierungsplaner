# Laufbahnqualifizierung gD Landwirtschaft – Dashboard

Persönliches Dashboard für die Laufbahnqualifizierung im gehobenen landwirtschaftstechnischen Dienst in Baden-Württemberg.

## Funktionen

- Terminübersicht, Kalender und Gantt-Ansicht
- Pflicht- und optionale Ausbildungsbausteine
- persönliche Auswahl optionaler Veranstaltungen
- Planung der ULB-Abordnung (8 Wochen / 40 Arbeitstage, aufteilbar)
- Planung des Verwaltungsfalls vor der Verwaltungsprüfung
- Dienstreisemanagement je Termin
- iCal-/Outlook-Export mit Exportoptionen
- druckoptimierte PDF-/Tabellenansicht
- lokale Speicherung der persönlichen Daten im Browser

## Datenschutz / Speicherung

Die Anwendung ist eine statische HTML-Seite. Persönlich eingetragene Daten wie ULB-Blöcke, Reiseplanung, Hotel- oder Ticketinformationen werden im `localStorage` des jeweiligen Browsers gespeichert und **nicht automatisch an GitHub übertragen**.

Wichtig: Dieses Repository ist **öffentlich**. Alles, was direkt in `index.html` fest hinterlegt ist, ist damit über GitHub und die GitHub-Pages-Seite weltweit einsehbar. Persönliche Angaben gehören daher ausschließlich in die Browser-Eingabefelder (`localStorage`), nicht in den Quelltext.

## Live-Version

**https://hannespix.github.io/qualifizierungsplaner/**

## GitHub Pages

Das Deployment läuft automatisch über GitHub Actions. Bei jedem Push auf `main`
startet der Workflow **Deploy GitHub Pages** (`.github/workflows/pages.yml`) und
veröffentlicht den Repository-Inhalt.

Der Workflow aktiviert GitHub Pages über `actions/configure-pages` mit
`enablement: true` selbst. Sollte das an fehlenden Berechtigungen scheitern,
lässt sich Pages einmalig manuell einschalten:

1. **Settings → Pages** öffnen.
2. Unter **Build and deployment → Source** **GitHub Actions** auswählen.
3. Den Workflow unter **Actions → Deploy GitHub Pages** erneut starten
   (**Run workflow**).

Zusätzlich benötigt der Workflow unter **Settings → Actions → General →
Workflow permissions** keine Sonderrechte – die nötigen Rechte (`pages: write`,
`id-token: write`) setzt er selbst.

## Aktualisieren

Für eine neue Dashboard-Version einfach `index.html` ersetzen und auf `main` pushen. GitHub Pages wird automatisch neu veröffentlicht.

## Lokale Nutzung

`index.html` kann weiterhin direkt lokal im Browser geöffnet werden. Es sind keine Build-Schritte und keine externen Laufzeit-Abhängigkeiten erforderlich.

## Dateien

- `index.html` – vollständiges Dashboard
- `.nojekyll` – verhindert eine unnötige Jekyll-Verarbeitung
- `.github/workflows/pages.yml` – automatisches GitHub-Pages-Deployment
- `.gitignore` – ignoriert typische lokale Systemdateien
