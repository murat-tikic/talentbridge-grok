# TalentBridge (Grok)

CV-Parser und Kandidaten-Analyse im Browser: Lebenslauf hochladen (PDF, DOCX oder TXT) und in drei Stufen
zum Profil, zur Lücken-Analyse und zur HR-Bewertung. Dazu Job-Matching gegen ein Stelleninserat und Export
als Word-Dokument. Die KI ist wahlweise **Google Gemini** (Standard `gemini-2.5-flash`) oder **xAI Grok**. Oberfläche Deutsch/Englisch.

*English: browser-based CV parser and candidate assessment, powered by Google Gemini or xAI Grok.*

## Live-Demo
Die GitHub-Pages-Version läuft im **Demo-Modus** und zeigt einen Beispielkandidaten (keine KI-Aufrufe, keine
Kosten). Der Echtbetrieb braucht den Proxy (siehe unten), weil ein API-Key nie im Browser stehen darf.

## Sofort ausprobieren mit eigenem Key (ohne Proxy)
Auf der Demo-Seite den gelben Button **„Eigenen API-Key nutzen“** klicken und den Key (Gemini `AIza…` oder xAI `xai-…`) einfügen.
Der Key bleibt nur im Speicher dieses Browser-Tabs und wird beim Schließen gelöscht. Danach ist der Live-Modus aktiv.
Nur auf dem eigenen Gerät verwenden, nie auf fremden Rechnern. Die Anfragen gehen direkt vom Browser an xAI.

## Freischalten mit Zugangscode (für Gäste ohne eigenen Key)
`config.js` enthält den API-Key (Gemini oder xAI) **nur verschlüsselt** (`tools/seal.mjs`, AES-256-GCM, PBKDF2 mit 600.000 Runden).
Wer den Zugangscode kennt, klickt auf **„Live-Analyse freischalten“**, gibt ihn ein, und die Seite entschlüsselt den Key
im Browser (nur Tab-Speicher). Wer den Code weitergibt, gibt damit auch Zugriff auf den Key. Deshalb: Ausgabenlimit
bei xAI setzen und den Key nach dem Termin erneuern. Neuer Code/Key: `LLM_KEY=AIza... node tools/seal.mjs` (Anbieter wird am Präfix erkannt: `AIza` = Gemini, `xai-` = xAI).
Bei kurzzeitiger Überlast (503/429) versucht die Seite es erneut und wechselt auf ein Ausweich-Modell.

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
Hochgeladene Lebensläufe gehen an den gewählten KI-Anbieter (Google bzw. xAI, USA). Beim kostenlosen Gemini-Kontingent darf Google Eingaben zur Produktverbesserung nutzen — dafür nur Test-Lebensläufe verwenden. Im Demo-Modus werden keine Daten
verschickt. Für echte Bewerberdaten braucht der Betrieb eine Rechtsgrundlage und eine Datenschutzprüfung.
Das Archiv liegt unverschlüsselt im `localStorage` des eigenen Browsers.

## Status
Prototyp. Die Modell-Qualität auf echten Lebensläufen wurde noch nicht systematisch gemessen.
