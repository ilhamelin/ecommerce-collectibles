# Limitaciones verificadas

Observaciones del código; no se modificó lógica ni se auditó el despliegue al documentar. Sirven para distinguir comportamiento implementado de garantías todavía pendientes.

| Área | Comportamiento observado | Implicación |
|---|---|---|
| Callback Mercado Pago | Marca PAID con status=approved/paymentId de URL sin consulta al proveedor en ese handler | Revisar: retorno del navegador no debe probar pago. Webhook real sí consulta proveedor |
| Saldo preventa | settle-balance verifica acceso y actualiza saldo; genera ID simulado si falta paymentId | No ejecuta cobro real ni verifica pago externo |
| Webhook simulado | Admite host local o clave de simulación con fallback en código | Separar simulación y revisar exposición productiva |
| Firmas entrantes | WebhookSecurityService existe, sin llamadas halladas desde handlers actuales | No afirmar que su existencia/tests garantizan firmas de Mercado Pago/Flow |
| Solicitudes catálogo | GET público devuelve todas las solicitudes del servicio | Revisar privacidad de emails/notas y acceso propietario |
| Tracking | GET y POST sin autorización propietaria/admin interna | Revisar alcance público y registro en proveedor |
| Analytics | GET/POST públicos; memoria/archivo como respaldo | Revisar exposición y concurrencia/persistencia |
| Contacto | Valida/honeypot/sanitiza y registra metadatos en logs | Respuesta no implica email, ticket o persistencia de mensaje |
| Transición preventa | POST fuera de /api/admin sin autorización explícita; servicio opera en memoria | Revisar permisos y persistencia antes de usar como administración real |
| CI | ci.yml configura Node 20; package.json exige 24.x | Alinear workflow y runtime al mantener despliegues |
| Reservas | TTL/barrido de servicio en memoria | No se halló cron que cancele pedidos persistidos por expiración |
| Pagos | Pasarela ausente/fallida puede devolver SIMULATED_SANDBOX | Leer gateway.mode; éxito checkout no prueba cobro externo |
| IA | Radar/iconos/autocompletado tienen heurísticas/presets | No todos los datos proceden de Gemini o búsqueda web |
| AfterShip | Fallback simulado sin clave o según fallo | Vista de tracking no prueba movimiento real |
| Prisma/Stripe | Esquema/dependencias/enums sin adaptadores operativos hallados | No presentarlos como servicios activos |
| Rate limit | Map en middleware | No comparte ventana entre instancias |
| SDK/JSON/memoria | Fallbacks no uniformes entre servicios | No equivalen a persistencia duradera Firestore |
| Auditoría | Solo escrituras integradas con contexto | No incluye todas las mutaciones |

Prioridades para ampliar operación: pago confirmado por proveedor, liquidación real de saldo y privacidad de rutas públicas. Este documento no declara que estos puntos estén corregidos.

Fuentes: [callback](../../src/app/api/checkout/mercadopago/callback/route.ts), [saldo](../../src/app/api/orders/[id]/settle-balance/route.ts), [webhook](../../src/app/api/checkout/mercadopago/webhook/route.ts), [solicitudes](../../src/app/api/catalog/product-requests/route.ts), [tracking](../../src/app/api/tracking/[id]/route.ts), [contacto](../../src/app/api/contact/route.ts).
