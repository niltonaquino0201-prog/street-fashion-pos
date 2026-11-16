/* =====================================================================
   CEREBRO DEL CHATBOT DE STREET FASHIÓN
   Lo usan el simulador del sistema (index.html) y el conector de
   WhatsApp (bot/whatsapp-worker.js). No guarda nada por sí mismo:
   recibe el catálogo con stock (colección web_catalogo, sin costos),
   el estado de la conversación y el mensaje del cliente, y devuelve
   las respuestas y el estado nuevo.

   Dos modos:
   - "menu": gratis, sin inteligencia artificial. Busca por palabras y
     guía al cliente con números (1, 2, 3…).
   - "ia": conversa natural con Google Gemini (plan gratis). Si la IA
     falla o se acaba el cupo del día, pasa solo al modo menú.
   ===================================================================== */
(function (raiz) {
  "use strict";

  const WEB = "https://niltonaquino0201-prog.github.io/street-fashion-pos/web/";
  const NEGOCIO_DEF = {
    nombre: "STREET FASHIÓN",
    direccion: "Villa Casagrande, La Arena, Piura",
    horario: "",
    delivery: "Delivery en Piura: coordinamos el costo del envío por WhatsApp.",
    web: WEB,
    whatsappHumano: "51943369367", // atención personal (el bot da este enlace cuando piden hablar con una persona)
    pagos: [
      { nombre: "Yape", detalle: "Escanea el QR con tu app Yape, paga el total y envíanos la captura por aquí.", qr: WEB + "img/pago/yape.jpg" },
      { nombre: "Plin", detalle: "Escanea el QR desde la app de tu banco (Pago con QR), paga el total y envíanos la captura por aquí.", qr: WEB + "img/pago/plin.jpg" },
    ],
  };
  const MAX_HIST = 24;          // turnos que se recuerdan en modo IA
  const PAUSA_HUMANO_H = 12;    // horas que el bot se queda callado cuando pasa la charla a Nilton

  // ---------- utilidades ----------
  const norm = s => String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const soles = n => "S/ " + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
  const ahora = () => Date.now();
  const SINON = {
    polo: ["polo", "polos", "camiseta", "camisetas", "remera", "remeras", "tshirt", "t-shirt", "playera"],
    polera: ["polera", "poleras", "hoodie", "hoodies", "buzo", "buzos", "sudadera", "sudaderas", "casaca", "chompa"],
    jean: ["jean", "jeans", "pantalon", "pantalones", "denim", "jogger"],
    blusa: ["blusa", "blusas", "top", "tops", "crop"],
    hombre: ["hombre", "hombres", "varon", "varones", "caballero", "caballeros", "chico", "chicos", "masculino"],
    mujer: ["mujer", "mujeres", "dama", "damas", "chica", "chicas", "femenino", "senorita"],
    oversize: ["oversize", "oversized", "holgado", "ancho"],
    boxy: ["boxy"],
    regular: ["regular", "clasico", "normal"],
  };
  const COLORES = ["negro", "blanco", "gris", "azul", "celeste", "rojo", "verde", "beige", "crema", "marron", "rosado", "rosa", "morado", "lila", "amarillo", "naranja", "plomo", "vino", "melange", "jaspeado", "turquesa"];
  const TALLAS = ["xxs", "xs", "s", "m", "l", "xl", "xxl", "xxxl", "2xl", "3xl", "std", "unica"];
  const VACIAS = new Set("el la los las un una unos unas de del en y o para por con que q hay tienes tienen tiene quiero quisiera busco necesito me te se mi tu su al lo le algun alguna algo talla color precio cuanto cuesta esta estan disponible disponibles hola buenas buenos dias tardes noches porfa por favor gracias ver mas modelo modelos prenda prendas ropa".split(" "));
  const raizPal = w => { for (const [k, l] of Object.entries(SINON)) if (l.includes(w)) return k; return w.length > 4 && w.endsWith("s") ? w.slice(0, -1) : w; };
  const palabras = t => norm(t).replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean);

  // ---------- catálogo ----------
  /* Agrupa las variantes (talla/color) por producto. Solo cuenta stock > 0 como disponible. */
  function armarCatalogo(docs, fotos) {
    const g = {};
    (docs || []).forEach(d => {
      if (!d || !d.nombre) return;
      const k = d.grupo || norm(d.nombre).replace(/[^a-z0-9]+/g, "-");
      const x = g[k] || (g[k] = { grupo: k, nombre: String(d.nombre), descripcion: String(d.descripcion || ""), categoria: String(d.categoria || ""), genero: String(d.genero || ""), foto: "", vars: [] });
      x.vars.push({ id: String(d.id), talla: String(d.talla || ""), color: String(d.color || ""), precio: Number(d.precio) || 0, stock: Math.max(0, Math.round(Number(d.stock) || 0)) });
      if (!x.foto && d.foto) x.foto = /^https?:/.test(d.foto) ? d.foto : WEB + d.foto;
    });
    Object.values(g).forEach(x => {
      const f = fotos && fotos[x.grupo];
      if (f && /^https?:/.test(f)) x.foto = f;
      x.texto = palabras([x.nombre, x.descripcion, x.categoria, x.genero].join(" ")).map(raizPal);
      x.disp = x.vars.filter(v => v.stock > 0);
      x.stock = x.disp.reduce((a, v) => a + v.stock, 0);
      const pr = (x.disp.length ? x.disp : x.vars).map(v => v.precio);
      x.desde = Math.min(...pr); x.hasta = Math.max(...pr);
    });
    return Object.values(g).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
  function entenderPedido(texto) {
    const ws = palabras(texto);
    const tallas = [], colores = [], claves = [];
    ws.forEach((w, i) => {
      if (TALLAS.includes(w) && (w.length > 1 || ws[i - 1] === "talla" || ws.length <= 4 || /^(talla|t)$/.test(ws[i - 1] || ""))) tallas.push(w.toUpperCase().replace("2XL", "XXL").replace("3XL", "XXXL"));
      else if (/^\d{2}$/.test(w) && +w >= 24 && +w <= 44) tallas.push(w);
      else if (COLORES.includes(w.replace(/s$/, "")) || COLORES.includes(w.replace(/es$/, "")) || COLORES.includes(w.replace(/a$/, "o"))) colores.push(COLORES.find(c => c === w || c === w.replace(/s$/, "") || c === w.replace(/es$/, "") || c === w.replace(/a$/, "o")));
      else if (!VACIAS.has(w) && w.length > 1) claves.push(raizPal(w));
    });
    return { tallas, colores, claves };
  }
  const varOk = (v, q) => (!q.tallas.length || q.tallas.some(t => norm(v.talla) === norm(t))) && (!q.colores.length || q.colores.some(c => norm(v.color).includes(c) || norm(v.color).includes(c.slice(0, -1))));
  function puntaje(g, q) {
    let p = 0;
    q.claves.forEach(c => { if (g.texto.includes(c)) p += 3; else if (g.texto.some(w => w.startsWith(c) || (c.length > 3 && w.includes(c)))) p += 2; });
    if (q.colores.length && g.vars.some(v => q.colores.some(c => norm(v.color).includes(c)))) p += 1;
    if (q.colores.length && q.colores.some(c => g.texto.includes(c))) p += 2;
    return p;
  }
  /* Devuelve lo que coincide con stock y, si no hay, alternativas parecidas con stock. */
  const TIPOS = ["polo", "polera", "jean", "blusa"];
  const genDe = g => { const x = raizPal(norm(g.genero)); return x === "hombre" || x === "mujer" ? x : ""; };
  function buscar(cat, texto, max) {
    max = max || 5;
    const q = entenderPedido(texto);
    const tipos = q.claves.filter(c => TIPOS.includes(c)), gen = q.claves.find(c => c === "hombre" || c === "mujer") || "";
    const tipoOk = g => !tipos.length || tipos.some(t => g.texto.includes(t));
    const genOk = g => !gen || !genDe(g) || genDe(g) === gen;
    const conPunt = cat.map(g => ({ g, p: tipoOk(g) && genOk(g) ? puntaje(g, q) : 0 })).filter(x => q.claves.length ? x.p > 0 : (q.colores.length || q.tallas.length));
    const exactos = [], sinStock = [];
    const maxP = conPunt.reduce((a, x) => Math.max(a, x.p), 0);
    /* "lo que pidió" = los que mejor coinciden; si esos están agotados se ofrecen alternativas */
    conPunt.filter(x => x.p >= maxP).forEach(({ g }) => {
      const vs = g.disp.filter(v => varOk(v, q));
      if (vs.length) exactos.push({ g, vs }); else sinStock.push(g);
    });
    let alternativas = [];
    if (!exactos.length) {
      const otraVar = sinStock.filter(g => g.stock > 0); // mismo modelo en otra talla o color
      alternativas = otraVar.concat(cat.filter(g => g.stock > 0 && !sinStock.includes(g))
        .map(g => ({ g, p: (tipoOk(g) ? 6 : 0) + (genOk(g) ? 3 : 0) + puntaje(g, q) + (g.disp.some(v => varOk(v, { tallas: q.tallas, colores: [] })) ? 1 : 0) + (g.disp.some(v => varOk(v, { tallas: [], colores: q.colores })) ? 1 : 0) }))
        .filter(x => x.p >= (tipos.length ? 6 : 1) || !q.claves.length).sort((a, b) => b.p - a.p).map(x => x.g)).slice(0, max);
    }
    return { q, exactos: exactos.slice(0, max), sinStock: sinStock.slice(0, 3), alternativas, tipos, gen };
  }
  const variante = v => [v.talla && "talla " + v.talla, v.color].filter(Boolean).join(", ");
  const precioG = g => g.desde === g.hasta ? soles(g.desde) : soles(g.desde) + " a " + soles(g.hasta);
  const tallasG = g => [...new Set(g.disp.map(v => v.talla).filter(Boolean))].join(", ");
  function lineaG(g, i) {
    const t = tallasG(g), c = [...new Set(g.disp.map(v => v.color).filter(Boolean))].join(", ");
    return (i != null ? (i + 1) + ". " : "• ") + g.nombre + " — " + precioG(g) + (t ? " · Tallas: " + t : "") + (c ? " · " + c : "");
  }

  // ---------- pedido ----------
  async function cerrarPedido(cfg, est, datos, cat, telefono) {
    const items = [];
    for (const it of est.carrito || []) {
      const g = cat.find(x => x.vars.some(v => v.id === it.id)), v = g && g.vars.find(v => v.id === it.id);
      if (!g || !v) return { error: "Una prenda ya no está disponible." };
      if (v.stock < it.cant) return { error: "De " + g.nombre + " (" + variante(v) + ") solo quedan " + v.stock + "." };
      items.push({ id: v.id, nombre: g.nombre, talla: v.talla, color: v.color, precio: v.precio, cant: it.cant });
    }
    if (!items.length) return { error: "El pedido está vacío." };
    const total = Math.round(items.reduce((a, x) => a + x.precio * x.cant, 0) * 100) / 100;
    const doc = { cliente: String(datos.cliente || "").trim().slice(0, 80), telefono: String(telefono || "").replace(/\D/g, "").slice(-15), entrega: datos.entrega === "delivery" ? "delivery" : "tienda",
      pago: datos.pago || "Yape", items, total, estado: "nuevo", nota: "Pedido por WhatsApp (chatbot)" };
    if (doc.cliente.length < 2) return { error: "Falta el nombre del cliente." };
    if (doc.entrega === "delivery") doc.direccion = String(datos.direccion || "").trim().slice(0, 200);
    let codigo;
    try { codigo = await cfg.crearPedido(doc); } catch (e) { return { error: "No se pudo registrar el pedido en el sistema." }; }
    const pago = (cfg.negocio.pagos || []).find(p => norm(p.nombre) === norm(doc.pago)) || {};
    const resp = [{ texto: "✅ ¡Listo! Tu pedido *" + codigo + "* quedó registrado y separamos tus prendas:\n" +
      items.map(x => "• " + x.cant + " × " + x.nombre + (variante(x) ? " (" + variante(x) + ")" : "") + " — " + soles(x.precio * x.cant)).join("\n") +
      "\n*Total: " + soles(total) + "*\n" + (doc.entrega === "delivery" ? "Entrega: delivery a " + doc.direccion + ". " + (cfg.negocio.delivery || "") : "Recojo en tienda: " + cfg.negocio.direccion + ".") +
      (pago.detalle ? "\n\n" + pago.nombre + ": " + pago.detalle : "") }];
    if (pago.qr) resp.push({ foto: pago.qr, texto: "QR de " + pago.nombre + " · Total " + soles(total) });
    est.carrito = []; est.ultimoPedido = codigo;
    return { codigo, total, resp };
  }

  // ---------- modo menú (sin IA) ----------
  const SALUDO = /^(hola|holi|buenas|buenos|buen dia|hey|ola|alo|menu|inicio|empezar|info|informacion)\b/;
  const HUMANO = /\b(asesor|asesora|humano|persona|encargad|dueno|nilton|hablar con alguien|atencion personal|llamar|llamada|reclamo|queja)\b/;
  function bienvenida(cfg, cat, est) {
    const hay = cat.filter(g => g.stock > 0), cats = {};
    hay.forEach(g => { const k = (g.categoria || "Otros") + (g.genero && g.genero !== "Unisex" ? " " + (g.genero === "Mujer" ? "dama" : g.genero.toLowerCase()) : ""); cats[k] = (cats[k] || 0) + 1; });
    const lista = Object.keys(cats).sort();
    est.paso = "inicio"; est.opciones = lista.map(k => ({ t: "cat", k }));
    return [{ texto: "¡Hola! 👋 Bienvenido a *" + cfg.negocio.nombre + "*. Soy el asistente virtual y te ayudo a ver modelos, tallas y precios, y a separar tu pedido.\n\n" +
      (lista.length ? "Escribe lo que buscas (ej: *polera negra talla M*) o elige un número:\n" + lista.map((k, i) => (i + 1) + ". " + k).join("\n") + "\n" : "Por ahora estamos reponiendo stock. ") +
      "\n0. Hablar con una persona" }];
  }
  function mostrarLista(est, gs, titulo) {
    est.paso = "lista"; est.opciones = gs.map(g => ({ t: "grupo", k: g.grupo }));
    return [{ texto: titulo + "\n" + gs.map(lineaG).join("\n") + "\n\nResponde con el número del modelo que te interesa." }];
  }
  function mostrarGrupo(est, g, q) {
    const vs = g.disp.filter(v => !q || varOk(v, q)).length ? g.disp.filter(v => !q || varOk(v, q)) : g.disp;
    const r = [];
    if (g.foto) r.push({ foto: g.foto, texto: g.nombre + " — " + precioG(g) });
    if (!vs.length) { est.paso = "inicio"; est.opciones = []; r.push({ texto: "Uy, *" + g.nombre + "* está agotado por ahora 😕. Escribe otra prenda que busques y te muestro lo que hay." }); return r; }
    if (vs.length === 1) { est.sel = vs[0].id; est.paso = "cant"; r.push({ texto: "*" + g.nombre + "* " + (variante(vs[0]) ? "(" + variante(vs[0]) + ") " : "") + "— " + soles(vs[0].precio) + ". Tenemos " + vs[0].stock + ".\n¿Cuántas quieres? (escribe un número)" }); return r; }
    est.paso = "var"; est.opciones = vs.map(v => ({ t: "var", k: v.id }));
    r.push({ texto: "*" + g.nombre + "*" + (g.descripcion ? " · " + g.descripcion : "") + "\nDisponibles:\n" + vs.map((v, i) => (i + 1) + ". " + (variante(v) || "Modelo único") + " — " + soles(v.precio) + (v.stock <= 2 ? " (¡últimas " + v.stock + "!)" : "")).join("\n") + "\n\nResponde con el número de la talla/color." });
    return r;
  }
  function resumen(cfg, est, cat) {
    const ls = (est.carrito || []).map(it => { const g = cat.find(x => x.vars.some(v => v.id === it.id)), v = g && g.vars.find(v => v.id === it.id); return g ? "• " + it.cant + " × " + g.nombre + (variante(v) ? " (" + variante(v) + ")" : "") + " — " + soles(v.precio * it.cant) : ""; }).filter(Boolean);
    const tot = (est.carrito || []).reduce((a, it) => { const g = cat.find(x => x.vars.some(v => v.id === it.id)), v = g && g.vars.find(v => v.id === it.id); return a + (v ? v.precio * it.cant : 0); }, 0);
    return { texto: ls.join("\n") + "\n*Total: " + soles(tot) + "*", tot };
  }
  async function modoMenu(cfg, est, msg, cat, tel) {
    const t = norm(msg).trim(), n = /^\d{1,2}$/.test(t) ? +t : null, d = est.datos || (est.datos = {});
    if (HUMANO.test(t) || (n === 0 && ["inicio", "lista"].includes(est.paso))) return pasarHumano(est, "El cliente pidió hablar con una persona", cfg);
    if (SALUDO.test(t) && !["nombre", "dir"].includes(est.paso)) return bienvenida(cfg, cat, est);
    const elegir = () => (n && est.opciones && est.opciones[n - 1]) || null;
    switch (est.paso) {
      case "cant": {
        const v = cat.flatMap(g => g.vars).find(v => v.id === est.sel), c = n || (/\b(una|un|uno)\b/.test(t) ? 1 : /\bdos\b/.test(t) ? 2 : /\btres\b/.test(t) ? 3 : null);
        if (!v) break;
        if (!c) return [{ texto: "Escribe solo el número de prendas que quieres (ej: 1)." }];
        if (c > v.stock) return [{ texto: "Solo tenemos " + v.stock + " de esa talla/color. ¿Cuántas quieres?" }];
        const ex = (est.carrito = est.carrito || []).find(x => x.id === v.id); if (ex) ex.cant = Math.min(v.stock, ex.cant + c); else est.carrito.push({ id: v.id, cant: c });
        est.paso = "mas"; est.opciones = [];
        return [{ texto: "🛍️ Agregado. Tu pedido va así:\n" + resumen(cfg, est, cat).texto + "\n\n1. Terminar y separar mi pedido\n2. Seguir viendo prendas" }];
      }
      case "mas":
        if (n === 1 || /termin|listo|nada mas|eso es todo|confirm|ya esta/.test(t)) { est.paso = "nombre"; return [{ texto: "Perfecto. ¿A nombre de quién separo el pedido? (nombre y apellido)" }]; }
        if (n === 2) { est.paso = "inicio"; return [{ texto: "Dale, escribe qué otra prenda buscas (ej: *jean dama 28*)." }]; }
        break;
      case "nombre":
        if (t.length < 2) return [{ texto: "Escribe tu nombre, por favor." }];
        d.cliente = String(msg).trim().slice(0, 80); est.paso = "entrega";
        return [{ texto: "Gracias, " + d.cliente.split(" ")[0] + ". ¿Cómo lo recibes?\n1. Recojo en tienda (" + cfg.negocio.direccion + ")\n2. Delivery" }];
      case "entrega":
        if (n === 1 || /tienda|recoj|recog/.test(t)) { d.entrega = "tienda"; est.paso = "pago"; }
        else if (n === 2 || /delivery|envio|domicilio|casa/.test(t)) { d.entrega = "delivery"; est.paso = "dir"; return [{ texto: "Escribe la dirección de entrega (calle, número y referencia)." }]; }
        else return [{ texto: "Responde 1 para recojo en tienda o 2 para delivery." }];
        return [{ texto: "¿Cómo pagas?\n" + cfg.negocio.pagos.map((p, i) => (i + 1) + ". " + p.nombre).join("\n") }];
      case "dir":
        if (t.length < 5) return [{ texto: "La dirección es muy corta. Escríbela completa, por favor." }];
        d.direccion = String(msg).trim().slice(0, 200); est.paso = "pago";
        return [{ texto: "¿Cómo pagas?\n" + cfg.negocio.pagos.map((p, i) => (i + 1) + ". " + p.nombre).join("\n") }];
      case "pago": {
        const p = (n && cfg.negocio.pagos[n - 1]) || cfg.negocio.pagos.find(p => t.includes(norm(p.nombre)));
        if (!p) return [{ texto: "Elige el número del método de pago." }];
        d.pago = p.nombre; est.paso = "confirmar";
        return [{ texto: "Revisa tu pedido:\n" + resumen(cfg, est, cat).texto + "\nA nombre de: " + d.cliente + "\nEntrega: " + (d.entrega === "delivery" ? "delivery a " + d.direccion : "recojo en tienda") + "\nPago: " + d.pago + "\n\n1. Confirmar pedido\n2. Cancelar" }];
      }
      case "confirmar":
        if (n === 1 || /^(si|confirm|ok|dale|listo)/.test(t)) {
          const r = await cerrarPedido(cfg, est, d, cat, tel); est.paso = "inicio"; est.opciones = [];
          if (r.error) return [{ texto: "😕 " + r.error + " Escribe la prenda otra vez para ver lo que hay ahora, o 0 para hablar con una persona." }];
          return r.resp.concat([{ texto: "¡Gracias por tu compra! Si necesitas algo más, escríbeme. 🙌" }]);
        }
        if (n === 2 || /cancel|no\b/.test(t)) { est.carrito = []; est.paso = "inicio"; return [{ texto: "Pedido cancelado. Si quieres ver otra prenda, escríbeme lo que buscas." }]; }
        return [{ texto: "Responde 1 para confirmar o 2 para cancelar." }];
    }
    const op = elegir();
    if (op) {
      if (op.t === "cat") { const gs = cat.filter(g => g.stock > 0 && ((g.categoria || "Otros") + (g.genero && g.genero !== "Unisex" ? " " + (g.genero === "Mujer" ? "dama" : g.genero.toLowerCase()) : "")) === op.k); return mostrarLista(est, gs.slice(0, 9), "Estos son nuestros *" + op.k + "* disponibles:"); }
      if (op.t === "grupo") { const g = cat.find(x => x.grupo === op.k); if (g) return mostrarGrupo(est, g, est.ultimaQ); }
      if (op.t === "var") { const v = cat.flatMap(g => g.vars).find(v => v.id === op.k); if (v) { est.sel = v.id; est.paso = "cant"; return [{ texto: "Elegiste " + (variante(v) || "este modelo") + " — " + soles(v.precio) + ". ¿Cuántas quieres?" }]; } }
    }
    if (/\b(direccion|donde quedan|ubicacion|ubicados)\b/.test(t)) return [{ texto: "📍 Estamos en " + cfg.negocio.direccion + "." + (cfg.negocio.horario ? " Horario: " + cfg.negocio.horario + "." : "") + "\nTambién puedes ver todo el catálogo en " + cfg.negocio.web }];
    if (/\b(horario|hora|abren|atienden)\b/.test(t) && cfg.negocio.horario) return [{ texto: "🕒 Atendemos " + cfg.negocio.horario + "." }];
    if (/\b(pago|pagar|yape|plin|tarjeta|efectivo)\b/.test(t) && !palabras(t).some(w => Object.keys(SINON).slice(0, 4).includes(raizPal(w)))) return [{ texto: "Aceptamos " + cfg.negocio.pagos.map(p => p.nombre).join(" y ") + ". Al confirmar tu pedido te envío el QR." }];
    if (/\b(gracias|ok|okey|listo|chau|bye)\b/.test(t) && t.length < 20) return [{ texto: "¡A ti! 🙌 Cuando quieras, escríbeme lo que buscas." }];
    const r = buscar(cat, msg, 5);
    est.ultimaQ = r.q;
    if (r.exactos.length === 1) return mostrarGrupo(est, r.exactos[0].g, r.q);
    if (r.exactos.length) return mostrarLista(est, r.exactos.map(x => x.g), "Esto tenemos disponible 👇");
    const pedido = [r.q.claves.join(" "), r.q.colores.join(" "), r.q.tallas.length ? "talla " + r.q.tallas.join("/") : ""].filter(Boolean).join(" ");
    if (!r.sinStock.length && !r.tipos.length && r.q.claves.length) {
      const b = bienvenida(cfg, cat, est);
      est.fallos = (est.fallos || 0) + 1;
      if (est.fallos >= 3) { est.fallos = 0; return pasarHumano(est, "El bot no entendió: " + String(msg).slice(0, 120), cfg); }
      return [{ texto: "No encontré *" + String(msg).trim().slice(0, 40) + "* en la tienda 😕. " + b[0].texto.replace(/^[\s\S]*?Escribe lo que buscas/, "Escribe lo que buscas") }];
    }
    if (r.alternativas.length) return mostrarLista(est, r.alternativas, (r.sinStock.length ? "Uy, *" + r.sinStock[0].nombre + "*" + (r.q.tallas.length || r.q.colores.length ? " en " + [r.q.colores.join("/"), r.q.tallas.length ? "talla " + r.q.tallas.join("/") : ""].filter(Boolean).join(" ") : "") + " está agotado por ahora 😕." : "No encontré *" + (pedido || msg) + "* 😕.") + " Te puedo ofrecer estos modelos que sí tenemos:");
    est.fallos = (est.fallos || 0) + 1;
    if (est.fallos >= 2) { est.fallos = 0; return pasarHumano(est, "El bot no entendió: " + String(msg).slice(0, 120), cfg); }
    return bienvenida(cfg, cat, est).map(x => ({ texto: "No te entendí bien 😅. " + x.texto.replace(/^¡Hola! 👋 Bienvenido a \*[^*]+\*\. Soy el asistente virtual y te ayudo a ver modelos, tallas y precios, y a separar tu pedido\.\n\n/, "") }));
  }
  /* Si hay un WhatsApp de atención personal, se le da el enlace al cliente y el bot sigue disponible.
     Si no, el bot se calla unas horas en ese chat para que una persona responda por el mismo número. */
  function pasarHumano(est, motivo, cfg) {
    est.paso = "inicio"; est.opciones = [];
    const wa = cfg && cfg.negocio && String(cfg.negocio.whatsappHumano || "").replace(/\D/g, "");
    if (wa) {
      est.derivado = { fecha: ahora(), motivo };
      return [{ texto: "Claro 🙌 Para atención personal escríbele directamente a nuestro equipo aquí:\nhttps://wa.me/" + wa + "\n\nSi luego quieres ver más prendas, aquí sigo." }];
    }
    est.humano = { desde: ahora(), hasta: ahora() + PAUSA_HUMANO_H * 3600e3, motivo };
    return [{ texto: "Listo 🙌 Le aviso a una persona del equipo para que te atienda por aquí mismo. En breve te escriben." }];
  }

  // ---------- modo IA (Google Gemini) ----------
  function instruccionesIA(cfg) {
    const n = cfg.negocio;
    return "Eres el asistente de ventas por WhatsApp de la tienda de ropa " + n.nombre + " (Piura, Perú). Atiendes con amabilidad, en español peruano sencillo, " +
      "con mensajes cortos tipo WhatsApp (máximo 6 líneas, emojis con moderación, *negritas* con un asterisco).\n" +
      "Reglas:\n- Para responder sobre prendas, precios, tallas o colores USA SIEMPRE la herramienta buscar_prendas. Nunca inventes productos, precios ni stock.\n" +
      "- Solo ofrece tallas y colores con stock. Si lo que piden no hay, dilo y ofrece las alternativas que devuelve la herramienta.\n" +
      "- Para separar un pedido necesitas: prendas (id de variante y cantidad), nombre del cliente, entrega (tienda o delivery con dirección) y método de pago (" + n.pagos.map(p => p.nombre).join(" o ") + "). " +
      "Antes de llamar a crear_pedido, muestra el resumen con el total y pide que confirme. Solo llama a crear_pedido cuando el cliente confirme.\n" +
      "- Usa mostrar_foto cuando el cliente quiera ver una prenda.\n" +
      "- Si el cliente pide hablar con una persona, tiene un reclamo, pide descuento, cambio o devolución, o algo que no puedes resolver, usa pasar_a_persona.\n" +
      "- No hables de temas que no sean la tienda. No pidas datos de tarjetas ni contraseñas.\n" +
      "Datos: dirección " + n.direccion + "." + (n.horario ? " Horario: " + n.horario + "." : "") + " " + (n.delivery || "") + " Catálogo web: " + n.web + ". Pagos: solo " + n.pagos.map(p => p.nombre).join(" y ") + " (el QR se envía al confirmar el pedido).";
  }
  const HERRAMIENTAS = [{ functionDeclarations: [
    { name: "buscar_prendas", description: "Busca en el inventario real prendas con stock. Devuelve coincidencias con sus variantes (id, talla, color, precio, stock) o alternativas si no hay.",
      parameters: { type: "OBJECT", properties: { texto: { type: "STRING", description: "Lo que busca el cliente, ej: 'polera negra hombre talla M'. Vacío para ver categorías." } }, required: ["texto"] } },
    { name: "mostrar_foto", description: "Envía al cliente la foto de un producto.", parameters: { type: "OBJECT", properties: { grupo: { type: "STRING", description: "Código 'grupo' del producto devuelto por buscar_prendas" } }, required: ["grupo"] } },
    { name: "crear_pedido", description: "Registra el pedido en el sistema y separa el stock. Solo después de que el cliente confirme el resumen.",
      parameters: { type: "OBJECT", properties: {
        items: { type: "ARRAY", items: { type: "OBJECT", properties: { id: { type: "STRING", description: "id de la variante" }, cant: { type: "INTEGER" } }, required: ["id", "cant"] } },
        cliente: { type: "STRING", description: "Nombre y apellido" }, entrega: { type: "STRING", enum: ["tienda", "delivery"] }, direccion: { type: "STRING" },
        pago: { type: "STRING", enum: NEGOCIO_DEF.pagos.map(p => p.nombre) } }, required: ["items", "cliente", "entrega", "pago"] } },
    { name: "pasar_a_persona", description: "Deriva al cliente con una persona del equipo (le envía el enlace de WhatsApp de atención personal).",
      parameters: { type: "OBJECT", properties: { motivo: { type: "STRING" } }, required: ["motivo"] } },
  ] }];
  async function llamarGemini(cfg, contenidos) {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(cfg.ia.modelo || "gemini-2.5-flash") + ":generateContent";
    const r = await (cfg.fetch || fetch)(url, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": cfg.ia.clave },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: instruccionesIA(cfg) }] }, contents: contenidos, tools: HERRAMIENTAS, generationConfig: { temperature: 0.4, maxOutputTokens: 800 } }) });
    if (!r.ok) { const e = new Error("ia " + r.status); e.status = r.status; try { e.detalle = (await r.json()).error.message; } catch (x) {} throw e; }
    const j = await r.json(), c = j.candidates && j.candidates[0] && j.candidates[0].content;
    if (!c || !c.parts) throw new Error("ia vacia");
    return c;
  }
  function datosParaIA(cat, texto) {
    const r = buscar(cat, texto || "", 6);
    const fmt = g => ({ grupo: g.grupo, nombre: g.nombre, detalle: g.descripcion, categoria: g.categoria, genero: g.genero, tieneFoto: !!g.foto,
      variantes: g.disp.map(v => ({ id: v.id, talla: v.talla, color: v.color, precio: v.precio, stock: v.stock })) });
    if (!String(texto || "").trim() || (!r.exactos.length && !r.alternativas.length && !r.sinStock.length)) {
      const cats = {}; cat.filter(g => g.stock > 0).forEach(g => { const k = g.categoria + " " + g.genero; cats[k] = (cats[k] || 0) + 1; });
      return { categoriasConStock: cats, nota: "No hubo coincidencias; pregunta qué tipo de prenda busca." };
    }
    return { encontrados: r.exactos.map(x => ({ ...fmt(x.g), variantes: x.vs.map(v => ({ id: v.id, talla: v.talla, color: v.color, precio: v.precio, stock: v.stock })) })),
      agotados: r.sinStock.map(g => g.nombre), alternativasConStock: r.alternativas.map(fmt) };
  }
  async function modoIA(cfg, est, msg, cat, tel) {
    const hist = (est.hist = est.hist || []);
    hist.push({ role: "user", parts: [{ text: String(msg).slice(0, 1000) }] });
    const salida = [];
    for (let vuelta = 0; vuelta < 6; vuelta++) {
      const c = await llamarGemini(cfg, hist);
      hist.push({ role: "model", parts: c.parts });
      const llamadas = c.parts.filter(p => p.functionCall);
      const texto = c.parts.filter(p => p.text && !p.thought).map(p => p.text).join("").trim();
      if (!llamadas.length) { if (texto) salida.push({ texto }); break; }
      if (texto) salida.push({ texto });
      const respuestas = [];
      for (const p of llamadas) {
        const f = p.functionCall, a = f.args || {};
        let res;
        if (f.name === "buscar_prendas") res = datosParaIA(cat, a.texto);
        else if (f.name === "mostrar_foto") { const g = cat.find(x => x.grupo === a.grupo); if (g && g.foto) { salida.push({ foto: g.foto, texto: g.nombre + " — " + precioG(g) }); res = { ok: true }; } else res = { ok: false, motivo: "Ese producto no tiene foto" }; }
        else if (f.name === "crear_pedido") {
          est.carrito = (Array.isArray(a.items) ? a.items : []).map(it => ({ id: String(it.id), cant: Math.max(1, Math.min(99, Math.floor(Number(it.cant) || 1))) })).slice(0, 20);
          const r = await cerrarPedido(cfg, est, { cliente: a.cliente, entrega: a.entrega, direccion: a.direccion, pago: a.pago }, cat, tel);
          if (r.error) res = { ok: false, error: r.error }; else { salida.push(...r.resp); res = { ok: true, codigo: r.codigo, total: r.total, nota: "Ya se envió al cliente el resumen y el QR de pago. Solo agradece en una línea." }; }
        } else if (f.name === "pasar_a_persona") { salida.push(...pasarHumano(est, a.motivo || "Pedido del cliente", cfg)); res = { ok: true, nota: "Ya se avisó al cliente. No escribas nada más." }; }
        else res = { error: "herramienta desconocida" };
        respuestas.push({ functionResponse: { name: f.name, response: res } });
      }
      hist.push({ role: "user", parts: respuestas });
      if (est.humano) break;
    }
    // recorta la memoria sin dejar una respuesta de herramienta huérfana al inicio
    while (hist.length > MAX_HIST) { hist.shift(); while (hist.length && !(hist[0].role === "user" && hist[0].parts.some(p => p.text))) hist.shift(); }
    return salida;
  }

  // ---------- entrada principal ----------
  /* cfg: { modo:"menu"|"ia", ia:{clave, modelo}, negocio, crearPedido(doc) => Promise<codigo>, fetch? }
     Devuelve { respuestas:[{texto, foto?}], estado, aviso? } */
  async function responder(cfg, estado, mensaje, extra) {
    cfg = { ...cfg, negocio: { ...NEGOCIO_DEF, ...(cfg.negocio || {}) } };
    if (!cfg.negocio.pagos || !cfg.negocio.pagos.length) cfg.negocio.pagos = NEGOCIO_DEF.pagos;
    const est = estado && typeof estado === "object" ? JSON.parse(JSON.stringify(estado)) : {};
    const cat = extra && extra.catalogo ? extra.catalogo : [];
    const tel = extra && extra.telefono || "";
    if (est.humano && est.humano.hasta > ahora()) return { respuestas: [], estado: est, callado: true };
    if (est.humano) delete est.humano;
    let respuestas, aviso = "";
    const inicio = ahora();
    const usarIA = cfg.modo === "ia" && cfg.ia && cfg.ia.clave && !(est.iaPausa && est.iaPausa > ahora());
    if (usarIA) {
      try { respuestas = await modoIA(cfg, est, mensaje, cat, tel); if (!respuestas.length) respuestas = [{ texto: "¿Me cuentas qué prenda buscas? 😊" }]; }
      catch (e) {
        aviso = "La IA no respondió (" + (e.detalle || e.message) + "). Respondió el modo menú.";
        if (e.status === 429) est.iaPausa = ahora() + 30 * 60e3; // cupo gratis agotado: menú por 30 min
        est.hist = [];
        respuestas = await modoMenu(cfg, est, mensaje, cat, tel);
      }
    } else respuestas = await modoMenu(cfg, est, mensaje, cat, tel);
    est.visto = ahora();
    const derivado = est.derivado && est.derivado.fecha >= inicio ? est.derivado : null;
    return { respuestas, estado: est, aviso, humano: est.humano || derivado || null };
  }

  const API = { responder, armarCatalogo, buscar, pasarHumano, NEGOCIO_DEF, version: "1.0" };
  raiz.CerebroBot = API;
  if (typeof module === "object" && module.exports) module.exports = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
