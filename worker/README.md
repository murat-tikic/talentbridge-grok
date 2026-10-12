# KI-Proxy einrichten (Cloudflare Worker, kostenlos)

Der Proxy hält den xAI-Key geheim und begrenzt, wer ihn nutzen darf.

1. **xAI-Key** holen: <https://console.x.ai> → API Keys. (Die Nutzung ist kostenpflichtig, Guthaben dort aufladen
   und ein Ausgabenlimit setzen.)
2. **Worker anlegen:** Cloudflare Dashboard → Workers & Pages → Create → Worker → Name z. B. `talentbridge-grok`
   → Deploy → Edit code → den Inhalt von `worker.js` einfügen → Deploy.
3. **Variablen** (Worker → Settings → Variables and Secrets):
   | Name | Wert | Art |
   |---|---|---|
   | `XAI_API_KEY` | dein xAI-Key | **Secret** |
   | `ALLOWED_ORIGIN` | `https://DEIN-NAME.github.io` | Text |
   | `ACCESS_CODE` | ein selbst gewähltes Wort | Secret |
   | `GROK_MODEL` | optional, z. B. `grok-4.7` | Text |
4. **Adresse eintragen:** Die Worker-URL (`https://talentbridge-grok.DEIN-NAME.workers.dev`) in `config.js` bei
   `TB_API_URL` setzen, committen und pushen. Danach ist die Seite nicht mehr im Demo-Modus.
5. **Zugangscode:** Beim ersten Analyse-Klick fragt die Seite nach dem `ACCESS_CODE`. Ohne ihn kann jeder mit dem
   Link auf deine Kosten testen. Den Code nur an Menschen weitergeben, die es ausprobieren sollen.

Per Kommandozeile geht es auch: `npx wrangler deploy worker.js --name talentbridge-grok`, dann
`npx wrangler secret put XAI_API_KEY`.
