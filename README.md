# TalentBridge (Grok)

CV-Parser und Kandidaten-Analyse im Browser: Lebenslauf hochladen (PDF, DOCX oder TXT) und in drei Stufen
zum Profil, zur Lücken-Analyse und zur HR-Bewertung. Dazu Job-Matching gegen ein Stelleninserat und Export
als Word-Dokument. Die KI ist **xAI Grok**. Oberfläche Deutsch/Englisch.

*English: browser-based CV parser and candidate assessment, powered by xAI Grok through a small proxy.*

## Live-Demo
Die GitHub-Pages-Version läuft im **Demo-Modus** und zeigt einen Beispielkandidaten (keine KI-Aufrufe, keine
Kosten). Der Echtbetrieb braucht den Proxy (siehe unten), weil ein API-Key nie im Browser stehen darf.

## So funktioniert es
```
Browser (index.html) ──► Proxy (Cloudflare Worker, hält den xAI-Key) ──► api.x.ai (Grok)
```
- **Pipeline:** Parsen → Lücken-Analyse → HR-Bewertung → optional Job-Match. Jede Stufe bekommt das JSON der
  vorherigen. Ausgabe als kompaktes JSON, mit mehrstufiger Reparatur bei kaputtem JSON.
- **PDF:** Grok nimmt keine PDFs direkt. Der Text wird deshalb im Browser mit pdf.js ausgelesen
  (gescannte PDFs ohne Textebene werden mit klarer Meldung abgelehnt).
- **DOCX:** Text-Extraktion im Browser (mammoth.js). Export als Word im Browser (docx).
- **Kein Build-Schritt:** eine einzige `index.html`, Konfiguration in `config.js`.

## Lokal testen
```powershell
$env:XAI_API_KEY = "xai-..."          # von console.x.ai
python dev_server.py                   # → http://localhost:8787
# Ohne Key und ohne Kosten (feste Beispielantworten): $env:MOCK="1"; python dev_server.py
```

## Echtbetrieb im Netz
Siehe [worker/README.md](worker/README.md): Cloudflare Worker anlegen, Key als Secret hinterlegen, die Worker-Adresse
in `config.js` eintragen. Standardmodell ist `grok-4.20-0309-non-reasoning` (günstig, ohne verstecktes Nachdenken),
änderbar über die Worker-Variable `GROK_MODEL`.

## Datenschutz
Hochgeladene Lebensläufe gehen an den Proxy und von dort an xAI (USA). Im Demo-Modus werden keine Daten
verschickt. Für echte Bewerberdaten braucht der Betrieb eine Rechtsgrundlage und eine Datenschutzprüfung.
Das Archiv liegt unverschlüsselt im `localStorage` des eigenen Browsers.

## Status
Prototyp. Die Modell-Qualität auf echten Lebensläufen wurde noch nicht systematisch gemessen.
