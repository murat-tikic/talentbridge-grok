// Verschlüsselt einen API-Key mit einem Zugangscode und schreibt config.js.
// Der Key steht danach NUR verschlüsselt (AES-256-GCM, Schlüssel aus PBKDF2-SHA256 mit 600.000 Runden) im Repo.
// Aufruf:  XAI_API_KEY=xai-... node tools/seal.mjs            (erzeugt einen neuen zufälligen Zugangscode)
//          XAI_API_KEY=xai-... ACCESS_CODE=mein-code node tools/seal.mjs
import { randomBytes, pbkdf2Sync, createCipheriv } from "node:crypto";
import { writeFileSync } from "node:fs";

const key = process.env.XAI_API_KEY;
if (!key || !key.startsWith("xai-")) { console.error("XAI_API_KEY fehlt oder hat falsches Format"); process.exit(1); }

const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";           // ohne verwechselbare Zeichen (0/O, 1/I/L)
function neuerCode() {
  const b = randomBytes(12);
  const z = [...b].map(x => ALPHA[x % ALPHA.length]).join("");
  return `${z.slice(0, 4)}-${z.slice(4, 8)}-${z.slice(8, 12)}`;     // 12 Zeichen ≈ 59 Bit
}
const code = (process.env.ACCESS_CODE || neuerCode()).trim().toUpperCase();
const ITER = 600000;
const salt = randomBytes(16), iv = randomBytes(12);
const aes = pbkdf2Sync(code, salt, ITER, 32, "sha256");
const c = createCipheriv("aes-256-gcm", aes, iv);
const ct = Buffer.concat([c.update(key, "utf8"), c.final(), c.getAuthTag()]);   // Tag hinten: WebCrypto-Format

const sealed = { v: 1, iter: ITER, salt: salt.toString("base64"), iv: iv.toString("base64"), ct: ct.toString("base64") };
writeFileSync(new URL("../config.js", import.meta.url),
`// Adresse des KI-Proxys (optional, siehe worker/README.md). Leer = kein Proxy.
window.TB_API_URL = "";
// Verschlüsselter xAI-Key (nur mit Zugangscode lesbar, siehe tools/seal.mjs). Hier steht NIE ein Klartext-Key.
window.TB_SEALED = ${JSON.stringify(sealed)};
`);
console.log("ZUGANGSCODE:", code);
