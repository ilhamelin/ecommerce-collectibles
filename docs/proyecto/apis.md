# APIs HTTP

Base: origen de la aplicación, por ejemplo https://ecommerce-collectibles.vercel.app. Ejemplos ilustrativos: no se ejecutan peticiones. Inventario completo de src/app/api/**/route.ts, incluyendo reexports. No se presenta como especificación OpenAPI exhaustiva.

## Convenciones

JSON: Content-Type application/json. Cookie omni_admin_session viaja automáticamente en mismo origen. Identidad cliente: Authorization Bearer ID token Firebase. IA: X-Firebase-AppCheck; no otorga rol admin.

No hay error uniforme: algunos usan success/data/error; otros error/code/message. Status comunes 400 validación, 401 identidad, 403 acceso/App Check, 404 inexistente, 409 conflicto, 429 límites, 500 interno, 503 dependencia/persistencia. Middleware puede rechazar antes del handler.

## Inventario

46 rutas y 76 operaciones exportadas. [JSON estructurado](inventario-api.json).

| Ruta | Métodos | Acceso | Función y fuente |
|---|---|---|---|
| `/api/admin/alerts` | GET, DELETE | Admin por middleware | Listar alertas; DELETE query id. [Código](../../src/app/api/admin/alerts/route.ts) |
| `/api/admin/announcement` | GET, POST | Admin por middleware | Leer/guardar anuncios; POST audita. [Código](../../src/app/api/admin/announcement/route.ts) |
| `/api/admin/auto-fill-product` | POST | Admin por middleware; App Check según modo | Proponer ficha desde nombre/tipo/imagen; JSON o NDJSON. [Código](../../src/app/api/admin/auto-fill-product/route.ts) |
| `/api/admin/backups` | GET, POST | Admin por middleware | GET type=csv/kpi/all; POST SAVE_CSV_BACKUP/SAVE_KPI_SNAPSHOT. [Código](../../src/app/api/admin/backups/route.ts) |
| `/api/admin/branding/generate-icon` | POST | Admin por middleware; App Check según modo | SVG desde prompt/presetId, con presets/fallback. [Código](../../src/app/api/admin/branding/generate-icon/route.ts) |
| `/api/admin/branding` | GET, POST | Admin por middleware | Leer/guardar marca; POST audita. [Código](../../src/app/api/admin/branding/route.ts) |
| `/api/admin/categories/[id]` | DELETE | Admin por middleware | Eliminar; query restore=true activa rama heredada. [Código](../../src/app/api/admin/categories/[id]/route.ts) |
| `/api/admin/categories` | GET, POST | Admin por middleware | Leer/crear categorías; POST audita. [Código](../../src/app/api/admin/categories/route.ts) |
| `/api/admin/generate-sku` | POST, GET | Admin por middleware | Generar/comprobar SKU; name/type/customCategoryLabel/checkSku o query sku. [Código](../../src/app/api/admin/generate-sku/route.ts) |
| `/api/admin/history` | GET | Admin por middleware | Auditoría reciente y estado de protección IA. [Código](../../src/app/api/admin/history/route.ts) |
| `/api/admin/home-hero` | GET, POST | Admin por middleware | Leer/guardar portada editorial. [Código](../../src/app/api/admin/home-hero/route.ts) |
| `/api/admin/predictive-stock` | GET, POST | Admin por middleware; App Check según modo | GET métricas guardadas; POST generar diagnóstico IA. [Código](../../src/app/api/admin/predictive-stock/route.ts) |
| `/api/admin/product-requests` | GET, PATCH, DELETE | Admin por middleware | Listar; PATCH id/status; DELETE query id. [Código](../../src/app/api/admin/product-requests/route.ts) |
| `/api/admin/radar` | GET | Admin por middleware; App Check según modo | Generar informe de tendencias; admite heurística. [Código](../../src/app/api/admin/radar/route.ts) |
| `/api/admin/seed-firebase` | GET, POST | Admin por middleware | Inspección/carga inicial; POST modifica base. [Código](../../src/app/api/admin/seed-firebase/route.ts) |
| `/api/admin/side-banners` | GET, POST | Admin por middleware | Leer/guardar banners, cuerpo config. [Código](../../src/app/api/admin/side-banners/route.ts) |
| `/api/admin/slider` | GET, POST | Admin por middleware | Leer/guardar carrusel, cuerpo slides. [Código](../../src/app/api/admin/slider/route.ts) |
| `/api/admin/telemetry` | GET, POST | Admin por middleware | GET timeframe=today/7d/30d/all; POST RESET/SIMULATE_CALL; SEED deshabilitado. [Código](../../src/app/api/admin/telemetry/route.ts) |
| `/api/admin/visual-versions` | GET, POST | Admin por middleware | Listar 100 versiones; POST capture/restore. [Código](../../src/app/api/admin/visual-versions/route.ts) |
| `/api/analytics` | GET, POST | Público | Consultar/registrar estadísticas de actividad. [Código](../../src/app/api/analytics/route.ts) |
| `/api/announcement` | GET | Público | Configuración publicada de anuncios. [Código](../../src/app/api/announcement/route.ts) |
| `/api/auth/admin-session` | GET, POST, DELETE | Token/credenciales para POST; cookie para GET | Verificar/emitir/cerrar cookie admin. [Código](../../src/app/api/auth/admin-session/route.ts) |
| `/api/auth/session` | POST | Identidad verificada | Coordinar sesión activa por dispositivo. [Código](../../src/app/api/auth/session/route.ts) |
| `/api/bundles/[id]/availability` | GET | Público | Disponibilidad de componentes. [Código](../../src/app/api/bundles/[id]/availability/route.ts) |
| `/api/catalog/product-requests` | POST, GET | Público | Crear solicitud; GET listado global. [Código](../../src/app/api/catalog/product-requests/route.ts) |
| `/api/catalog` | GET | Público | Catálogo de dominio. [Código](../../src/app/api/catalog/route.ts) |
| `/api/catalog/visual-search` | POST | Público; App Check según modo | Identificación de imagen/contraste catálogo; JSON o NDJSON. [Código](../../src/app/api/catalog/visual-search/route.ts) |
| `/api/checkout/flow/webhook` | POST | Proveedor/simulador según rama | Formulario token; consulta estado Flow. [Código](../../src/app/api/checkout/flow/webhook/route.ts) |
| `/api/checkout/mercadopago/callback` | GET | Público | Retorno navegador, parámetros de pago y redirección. [Código](../../src/app/api/checkout/mercadopago/callback/route.ts) |
| `/api/checkout/mercadopago/webhook` | POST | Proveedor/simulador según rama | Notificación real y rama simulada; consulta proveedor en rama real. [Código](../../src/app/api/checkout/mercadopago/webhook/route.ts) |
| `/api/checkout` | POST | Público | Crear/recuperar pedido idempotente e iniciar pasarela. [Código](../../src/app/api/checkout/route.ts) |
| `/api/contact` | POST | Público | Validación/honeypot y log; no envío SMTP aquí. [Código](../../src/app/api/contact/route.ts) |
| `/api/orders/[id]` | GET, PATCH, DELETE | Propietario/admin; recibo en detalle; PATCH/DELETE admin | Detalle autorizado; PATCH logística/estado; DELETE admin. [Código](../../src/app/api/orders/[id]/route.ts) |
| `/api/orders/[id]/settle-balance` | POST | Propietario/admin; recibo en detalle; PATCH/DELETE admin | Liquidar saldo autorizado; no cobro real. [Código](../../src/app/api/orders/[id]/settle-balance/route.ts) |
| `/api/orders` | GET | Propietario/admin; recibo en detalle; PATCH/DELETE admin | Pedidos propietario/admin; filtros status/email/q. [Código](../../src/app/api/orders/route.ts) |
| `/api/preorders/[id]/transition` | POST | Público: handler sin autorización explícita | Cambio de estado mediante PreOrderService. [Código](../../src/app/api/preorders/[id]/transition/route.ts) |
| `/api/products/[id]/alerts` | POST, GET | Identidad: alcance propietario/admin según método | Alta/consulta de suscripción por identidad. [Código](../../src/app/api/products/[id]/alerts/route.ts) |
| `/api/products` | GET, POST, PUT, DELETE | GET público; mutaciones admin | GET catálogo/sku/slug; POST crear; PUT editar; DELETE id/sku. [Código](../../src/app/api/products/route.ts) |
| `/api/side-banners` | GET | Público | Banners publicados. [Código](../../src/app/api/side-banners/route.ts) |
| `/api/sommelier/chat` | POST | Público; App Check según modo | Conversación con messages/currentContext. [Código](../../src/app/api/sommelier/chat/route.ts) |
| `/api/storefront/branding` | GET | Público | Alias público de GET marca. [Código](../../src/app/api/storefront/branding/route.ts) |
| `/api/storefront/categories` | GET | Público | Alias público de GET categorías. [Código](../../src/app/api/storefront/categories/route.ts) |
| `/api/storefront/slider` | GET | Público | Carrusel publicado. [Código](../../src/app/api/storefront/slider/route.ts) |
| `/api/tracking/[id]` | GET, POST | Público | GET estado por pedido/OT; POST registrar AfterShip. [Código](../../src/app/api/tracking/[id]/route.ts) |
| `/api/users/alerts` | GET, DELETE | Identidad: alcance propietario/admin según método | Listar/borrar suscripciones autorizadas. [Código](../../src/app/api/users/alerts/route.ts) |
| `/api/users` | GET, PUT, PATCH, DELETE | Identidad: alcance propietario/admin según método | Perfil/lista; PUT perfil; PATCH rol admin; DELETE según identidad. [Código](../../src/app/api/users/route.ts) |

## Contratos principales

### Checkout

POST /api/checkout. x-idempotency-key o idempotency-key prevalece sobre cuerpo.

```json
{
  "cartSessionId": "cart-session-ejemplo",
  "userId": "guest-ejemplo",
  "idempotencyKey": "checkout-ejemplo-001",
  "items": [{"productId":"ID_REAL_CATALOGO","quantity":1,"isPartialDeposit":false}],
  "paymentMethod": "MERCADO_PAGO",
  "customerInfo": {"fullName":"Cliente de ejemplo","email":"cliente@example.com","phone":"912345678"},
  "shippingAddress": {"region":"Metropolitana","comuna":"Santiago","address":"Dirección de ejemplo 123"},
  "shippingMethod": {"carrier":"STARKEN","name":"Starken Express","cost":0}
}
```

RUT opcional, validado si se incluye. quantity entero positivo. customDepositPercent usa fracción. userId del DTO no prueba autenticación. Éxito 201: success/data con orderId, orderNumber, order y gateway. gateway.mode distingue LIVE/SANDBOX/SIMULATED. STRIPE figura en el enum pero no tiene adapter Stripe operativo.

### Producto

POST /api/products con cookie admin; esquema CreateProductSchema:

```json
{"sku":"FIG-EJEMPLO-01","name":"Figura de ejemplo","description":"Descripción para revisión.","type":"FIGURE","price":54900,"costPrice":42000,"stockAvailable":8,"isPreOrder":false}
```

También metadata, imágenes y especificaciones. originalPrice opcional/manual en formulario. PUT usa lógica de actualización del handler; DELETE query id/sku. Ejemplos no son productos para insertar automáticamente.

### Foto

POST /api/catalog/visual-search:

```json
{"imageBase64":"BASE64_REAL","mimeType":"image/jpeg"}
```

JPEG/PNG/WEBP; valida base64/data URL; límite del campo 12 × 1024 × 1024 caracteres, no bytes de imagen. Accept application/x-ndjson solicita stream; sin él resultado JSON.

Eventos, cada uno en una línea:

```json
{"kind":"progress","stage":"received","message":"Imagen recibida y validada."}
{"kind":"error","message":"No se pudo identificar la imagen."}
```

result contiene data según [visualSearch.ts](../../src/lib/services/visualSearch.ts). Un chunk no equivale a una línea; comprobar status/content-type porque App Check puede responder JSON antes del stream.

### Autocompletado

POST /api/admin/auto-fill-product: name/selectedType/customCategoryLabel o imageBase64/imageFileName/imageMimeType según parser del [handler](../../src/app/api/admin/auto-fill-product/route.ts). JSON/NDJSON; protocolo en [autoFillStream.ts](../../src/lib/services/autoFillStream.ts), no suponerlo idéntico al de foto. Retorna propuesta sin guardar producto.

Ejemplo de entrada de texto:

```json
{"name":"Nintendo Switch OLED","selectedType":"CONSOLE"}
```

Eventos de autocompletado: progress (message), field (field/value), result (data), error (message).

### Iconos

POST /api/admin/branding/generate-icon:

```json
{"prompt":"Un mando futurista de líneas simples","presetId":"mando_retro"}
```

Respuesta success/data con svg/title/source. source distingue modelo, preset o fallback. Sanitización propia en handler. Reserva quota también si acaba en preset.

### Stock y Radar

GET /api/admin/predictive-stock: success/data con metrics, summary, latestAiReport, lastScannedAt; no cuota IA. POST sin formulario: usa catálogo/pedidos/alertas; data contiene metrics, summary, aiReport, generatedAt.

GET /api/admin/radar genera y consume cuota: data contiene marketOverview, scannedAt, reissueAlerts, hotTrends, urgentRecommendations; engine distingue GEMINI_AI y LOCAL_HEURISTIC.

### Sommelier

POST /api/sommelier/chat: messages y currentContext según [handler](../../src/app/api/sommelier/chat/route.ts); visitantes admitidos, cuota y App Check aplicables.

### Versiones

POST /api/admin/visual-versions, variantes estrictas:

```json
{"action":"capture","section":"portada","name":"Campaña de ejemplo"}
```

```json
{"action":"restore","id":"ID_VERSION_EXISTENTE"}
```

Secciones: portada/marca/carrusel/anuncios/laterales. Captura exige configuración guardada; restauración valida catálogo/editor y no debe afirmar éxito si falla.

### Sesión y webhooks

POST /api/auth/admin-session admite idToken de Firebase verificado/permitido o credenciales demo configuradas; emite cookie. GET verifica y DELETE expira cookie. No recibe claves de cuenta de servicio.

Flow webhook recibe formulario token. Mercado Pago webhook recibe tipo/ID y consulta pago; callback y simulación tienen alcance distinto, ver limitaciones. App Check de navegador no se aplica a notificaciones del proveedor.

## Compatibilidad

Cambiar DTO/enums/stream exige actualizar ambos extremos y tests. Tienda pública debe usar endpoints publicados /api/storefront y otros públicos, evitando /api/admin. Consultar esquema fuente antes de automatizar; inventario de métodos no sustituye contrato de input por ruta.
