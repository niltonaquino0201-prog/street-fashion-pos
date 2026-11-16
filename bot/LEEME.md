# Chatbot de WhatsApp de STREET FASHIÓN

El bot atiende el WhatsApp de ventas: busca en el stock real, ofrece modelos parecidos si algo está agotado y, cuando el cliente confirma, crea el pedido en **Pedidos web** (aparta el stock igual que la página web).

| Archivo | Para qué sirve |
|---|---|
| `cerebro.js` | La lógica del bot. La usan el simulador del sistema y el conector. |
| `whatsapp-worker.js` | Conector entre WhatsApp (Meta) y el sistema. Vive gratis en Cloudflare. |
| `wrangler.toml` | Configuración del conector. |

## Cómo responde
- **Menú con números (gratis):** siempre disponible.
- **Conversación con IA (Gemini, plan gratis):** se activa al poner la clave `GEMINI_KEY`. Si se acaba el cupo del día, vuelve solo al menú.
- Si el cliente pide hablar con una persona, le pasa el WhatsApp personal 943 369 367.

## Probarlo sin WhatsApp
Sistema → **Pedidos web → Chatbot**. Por defecto los pedidos son de prueba (no apartan stock).

## Conectarlo a WhatsApp (una sola vez)
1. **Chip nuevo** sin WhatsApp instalado (si tiene, borra la cuenta de WhatsApp de ese número primero).
2. **Meta:** en https://developers.facebook.com crea una app tipo *Empresa* → agrega el producto **WhatsApp** → en *Configuración de la API* agrega el número nuevo y verifícalo con el SMS. Anota el **ID del número de teléfono**.
3. **Token permanente:** en https://business.facebook.com → Configuración → *Usuarios del sistema* → crea uno (Administrador), asígnale la app y genera un token con los permisos `whatsapp_business_messaging` y `whatsapp_business_management`.
4. **Clave secreta de la app:** en la app de Meta → Configuración → Básica → *Clave secreta de la app*.
5. **Gemini (opcional, gratis):** https://aistudio.google.com/apikey → *Create API key*.
6. **Cloudflare (gratis):** crea cuenta en https://dash.cloudflare.com y, en una PC con Node.js, dentro de esta carpeta:
   ```
   npx wrangler login
   npx wrangler kv namespace create CHATS      # pega el id en wrangler.toml
   npx wrangler secret put WA_TOKEN
   npx wrangler secret put WA_VERIFY           # una palabra secreta que inventas
   npx wrangler secret put WA_APP_SECRET
   npx wrangler secret put GEMINI_KEY          # opcional
   npx wrangler deploy
   ```
   Pon `WA_PHONE_ID` en `wrangler.toml` antes del deploy. Al final sale una dirección `https://street-fashion-bot.<tu-cuenta>.workers.dev`.
7. **Webhook en Meta:** WhatsApp → Configuración → *URL de devolución de llamada* = la dirección del paso 6, *Token de verificación* = tu palabra de `WA_VERIFY`. Suscribe el campo **messages**.
8. Escribe "hola" al número nuevo desde otro celular.

## Costos
- Meta: 1.000 respuestas gratis al mes por número (desde octubre 2026); después cobra centavos por mensaje y pide tarjeta.
- Gemini plan gratis: con tope diario; en el plan gratis Google puede usar los chats para mejorar su IA.
- Cloudflare Workers y KV: plan gratis.

## Importante
- El stock se aparta cuando el sistema está abierto en algún equipo (igual que con la web).
- Nunca subas tokens ni claves a GitHub; van solo como *secrets* de Cloudflare.
