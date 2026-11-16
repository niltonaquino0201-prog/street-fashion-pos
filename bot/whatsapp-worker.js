/* =====================================================================
   CONECTOR DE WHATSAPP (Cloudflare Worker, plan gratis)
   Recibe los mensajes del número del bot (WhatsApp Cloud API de Meta),
   lee el stock público del sistema (web_catalogo en Firebase), responde
   con bot/cerebro.js y, si el cliente confirma, crea el pedido en la
   colección "pedidos" (la misma que usa la página web).

   Claves (se guardan en Cloudflare como "secrets", nunca en este archivo):
     WA_TOKEN        token de acceso permanente de Meta
     WA_PHONE_ID     id del número del bot en Meta
     WA_VERIFY       palabra secreta que inventas para verificar el webhook
     WA_APP_SECRET   "clave secreta de la app" de Meta (valida que el mensaje viene de Meta)
     GEMINI_KEY      (opcional) clave gratis de Google AI Studio; sin ella usa el menú
   Variables normales (wrangler.toml): GEMINI_MODELO, FIREBASE_PROJECT, FIREBASE_API_KEY
   Almacenamiento: KV "CHATS" guarda el estado de cada conversación.
   ===================================================================== */
import "./cerebro.js";
const Bot = globalThis.CerebroBot;
const GRAPH = "https://graph.facebook.com/v23.0/";

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (req.method === "GET" && url.searchParams.get("hub.mode") === "subscribe") {
      return url.searchParams.get("hub.verify_token") === env.WA_VERIFY
        ? new Response(url.searchParams.get("hub.challenge") || "")
        : new Response("token incorrecto", { status: 403 });
    }
    if (req.method === "GET") return new Response("Chatbot STREET FASHIÓN activo ✔");
    if (req.method !== "POST") return new Response("", { status: 405 });
    const cuerpo = await req.text();
    if (!(await firmaValida(cuerpo, req.headers.get("x-hub-signature-256"), env.WA_APP_SECRET))) return new Response("firma inválida", { status: 401 });
    let datos; try { datos = JSON.parse(cuerpo); } catch (e) { return new Response("", { status: 400 }); }
    // Meta espera un 200 rápido; el trabajo sigue en segundo plano.
    ctx.waitUntil(procesar(datos, env).catch(e => console.log("error", e && e.stack || e)));
    return new Response("ok");
  },
};

async function procesar(datos, env) {
  for (const ent of datos.entry || []) for (const ch of ent.changes || []) {
    const v = ch.value || {};
    for (const m of v.messages || []) {
      if (await env.CHATS.get("msg:" + m.id)) continue; // Meta a veces reenvía el mismo mensaje
      await env.CHATS.put("msg:" + m.id, "1", { expirationTtl: 86400 });
      const nombre = ((v.contacts || []).find(c => c.wa_id === m.from) || {}).profile?.name || "";
      await atender(env, m.from, textoDe(m), nombre, m.id);
    }
  }
}
function textoDe(m) {
  if (m.type === "text") return m.text.body;
  if (m.type === "interactive") return (m.interactive.button_reply || m.interactive.list_reply || {}).title || "";
  if (m.type === "button") return m.button.text;
  if (m.type === "image") return m.image.caption || "[foto]";
  return "[" + m.type + "]";
}

async function atender(env, tel, texto, nombre, msgId) {
  const clave = "chat:" + tel;
  let estado = {}; try { estado = JSON.parse((await env.CHATS.get(clave)) || "{}"); } catch (e) {}
  marcarLeido(env, msgId);
  if (texto === "[foto]") {
    // casi siempre es la captura del pago
    await enviarTexto(env, tel, "¡Gracias! 🙌 Recibimos tu imagen. Si es la captura de tu pago, el equipo la revisa y te confirma tu pedido" + (estado.ultimoPedido ? " *" + estado.ultimoPedido + "*" : "") + ".");
    return;
  }
  if (/^\[(audio|sticker|video|document|location|contacts|reaction|unsupported)\]$/.test(texto)) {
    if (texto !== "[reaction]") await enviarTexto(env, tel, "Por ahora solo puedo leer mensajes de texto 🙏. Escríbeme qué prenda buscas (ej: *polera negra talla M*).");
    return;
  }
  const catalogo = Bot.armarCatalogo(await leerCatalogo(env), {});
  const cfg = {
    modo: env.GEMINI_KEY ? "ia" : "menu",
    ia: { clave: env.GEMINI_KEY || "", modelo: env.GEMINI_MODELO || "gemini-2.5-flash" },
    negocio: env.WHATSAPP_HUMANO ? { whatsappHumano: env.WHATSAPP_HUMANO } : {},
    crearPedido: doc => crearPedido(env, doc),
  };
  if (nombre && !estado.nombreWA) estado.nombreWA = nombre;
  const r = await Bot.responder(cfg, estado, texto, { catalogo, telefono: tel });
  await env.CHATS.put(clave, JSON.stringify(r.estado), { expirationTtl: 60 * 86400 });
  if (r.aviso) console.log("aviso", r.aviso);
  for (const m of r.respuestas) {
    if (m.foto && /^https:/.test(m.foto)) await enviar(env, tel, { type: "image", image: { link: m.foto, caption: (m.texto || "").slice(0, 1000) } });
    else if (m.texto) await enviarTexto(env, tel, m.texto);
  }
}

// ---------- WhatsApp ----------
const enviarTexto = (env, tel, t) => enviar(env, tel, { type: "text", text: { body: String(t).slice(0, 4000), preview_url: true } });
async function enviar(env, tel, msg) {
  const r = await fetch(GRAPH + env.WA_PHONE_ID + "/messages", { method: "POST",
    headers: { Authorization: "Bearer " + env.WA_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: tel, ...msg }) });
  if (!r.ok) console.log("whatsapp", r.status, await r.text());
}
function marcarLeido(env, id) {
  fetch(GRAPH + env.WA_PHONE_ID + "/messages", { method: "POST", headers: { Authorization: "Bearer " + env.WA_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: id }) }).catch(() => {});
}
async function firmaValida(cuerpo, firma, secreto) {
  if (!secreto) return true; // sin secreto configurado no se valida (solo para la primera prueba)
  if (!firma || !firma.startsWith("sha256=")) return false;
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(cuerpo)));
  const hex = [...mac].map(b => b.toString(16).padStart(2, "0")).join("");
  const otra = firma.slice(7);
  if (otra.length !== hex.length) return false;
  let d = 0; for (let i = 0; i < hex.length; i++) d |= hex.charCodeAt(i) ^ otra.charCodeAt(i);
  return d === 0;
}

// ---------- Firebase (solo lo público: catálogo sin costos y crear pedidos) ----------
const fsBase = env => "https://firestore.googleapis.com/v1/projects/" + (env.FIREBASE_PROJECT || "street-fashion-pos") + "/databases/(default)/documents";
let cache = { t: 0, docs: [] };
async function leerCatalogo(env) {
  if (Date.now() - cache.t < 20000) return cache.docs; // el stock se relee cada 20 s como máximo
  const docs = []; let token = "";
  for (let i = 0; i < 20; i++) {
    const u = fsBase(env) + "/web_catalogo?pageSize=300&key=" + env.FIREBASE_API_KEY + (token ? "&pageToken=" + encodeURIComponent(token) : "");
    const r = await fetch(u); if (!r.ok) throw new Error("catalogo " + r.status + " " + (await r.text()).slice(0, 200));
    const j = await r.json();
    (j.documents || []).forEach(d => docs.push({ id: d.name.split("/").pop(), ...desdeFS(d.fields || {}) }));
    if (!j.nextPageToken) break; token = j.nextPageToken;
  }
  cache = { t: Date.now(), docs };
  return docs;
}
function desdeFS(f) { const o = {}; for (const [k, v] of Object.entries(f)) o[k] = valor(v); return o; }
function valor(v) {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("mapValue" in v) return desdeFS(v.mapValue.fields || {});
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(valor);
  return null;
}
function aFS(x) {
  if (typeof x === "string") return { stringValue: x };
  if (typeof x === "boolean") return { booleanValue: x };
  if (typeof x === "number") return Number.isInteger(x) ? { integerValue: String(x) } : { doubleValue: x };
  if (Array.isArray(x)) return { arrayValue: { values: x.map(aFS) } };
  if (x && typeof x === "object") return { mapValue: { fields: Object.fromEntries(Object.entries(x).map(([k, v]) => [k, aFS(v)])) } };
  return { nullValue: null };
}
async function crearPedido(env, doc) {
  const id = [...crypto.getRandomValues(new Uint8Array(15))].map(b => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[b % 62]).join("") + "wa" + Date.now().toString(36).slice(-3);
  const proyecto = "projects/" + (env.FIREBASE_PROJECT || "street-fashion-pos") + "/databases/(default)/documents";
  const r = await fetch(fsBase(env) + ":commit?key=" + env.FIREBASE_API_KEY, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ writes: [{ update: { name: proyecto + "/pedidos/" + id, fields: Object.fromEntries(Object.entries(doc).map(([k, v]) => [k, aFS(v)])) },
      updateTransforms: [{ fieldPath: "fecha", setToServerValue: "REQUEST_TIME" }], currentDocument: { exists: false } }] }) });
  if (!r.ok) throw new Error("pedido " + r.status + " " + (await r.text()).slice(0, 300));
  return "W-" + id.slice(-6).toUpperCase();
}
