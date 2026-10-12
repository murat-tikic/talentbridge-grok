// Cloudflare Worker: KI-Proxy für TalentBridge (xAI Grok). Der API-Key liegt NUR hier als Secret,
// nie im Browser. Der Browser schickt {messages, max_tokens}; Modell und Key setzt der Worker.
//
// Einstellungen (Cloudflare → Workers → Settings → Variables and Secrets):
//   XAI_API_KEY      (Secret, Pflicht)   Key von console.x.ai
//   GROK_MODEL       (optional)          Standard: grok-4.20-0309-non-reasoning (günstig, kein verstecktes Nachdenken)
//   ALLOWED_ORIGIN   (empfohlen)         z. B. https://DEIN-NAME.github.io  — nur diese Seite darf den Proxy nutzen
//   ACCESS_CODE      (empfohlen)         Zugangscode; ohne ihn kann jeder mit dem Link auf deine Kosten testen
const MAX_BODY = 200_000;      // Zeichen (ein CV ist deutlich kleiner)
const MAX_TOKENS_CAP = 8000;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const erlaubt = env.ALLOWED_ORIGIN ? env.ALLOWED_ORIGIN.split(",").map(s => s.trim()) : [];
    const corsOrigin = erlaubt.length ? (erlaubt.includes(origin) ? origin : erlaubt[0]) : "*";
    const cors = {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Headers": "Content-Type, x-access-code",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
    };
    const antwort = (status, obj) => new Response(JSON.stringify(obj), {
      status, headers: { ...cors, "Content-Type": "application/json" } });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return antwort(405, { error: { message: "Nur POST" } });
    if (erlaubt.length && !erlaubt.includes(origin)) return antwort(403, { error: { message: "Origin nicht erlaubt" } });
    if (env.ACCESS_CODE && request.headers.get("x-access-code") !== env.ACCESS_CODE)
      return antwort(401, { error: { message: "Zugangscode fehlt oder falsch" } });
    if (!env.XAI_API_KEY) return antwort(500, { error: { message: "XAI_API_KEY ist am Worker nicht gesetzt" } });

    const roh = await request.text();
    if (roh.length > MAX_BODY) return antwort(413, { error: { message: "Anfrage zu groß" } });
    let eingabe;
    try { eingabe = JSON.parse(roh); } catch { return antwort(400, { error: { message: "Kein gültiges JSON" } }); }
    if (!Array.isArray(eingabe.messages) || !eingabe.messages.length)
      return antwort(400, { error: { message: "messages fehlt" } });

    const nachrichten = eingabe.messages
      .filter(m => m && (m.role === "user" || m.role === "assistant" || m.role === "system") && typeof m.content === "string")
      .map(m => ({ role: m.role, content: m.content }));

    const upstream = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.XAI_API_KEY}` },
      body: JSON.stringify({
        model: env.GROK_MODEL || "grok-4.20-0309-non-reasoning",
        messages: nachrichten,
        max_tokens: Math.min(Number(eingabe.max_tokens) || 4000, MAX_TOKENS_CAP),
        temperature: 0.2,
        stream: false,
      }),
    });
    const text = await upstream.text();
    return new Response(text, { status: upstream.status, headers: { ...cors, "Content-Type": "application/json" } });
  },
};
