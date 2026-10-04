# Limitaciones verificadas

Observaciones del código; no se modificó lógica ni se auditó el despliegue al documentar. Sirven para distinguir comportamiento implementado de garantías todavía pendientes.

| Área | Comportamiento observado | Implicación |
|---|---|---|
| Callback Mercado Pago | Corregido: consulta proveedor y referencia; sin confirmación redirige pendiente | Revisar configuración y pagos anteriores a esta corrección |
| Saldo preventa | Corregido: inicia pasarela con importe almacenado; webhook liquida en transacción | Interfaz cliente ofrece Mercado Pago; API también admite Flow |
| Webhook simulado | Corregido: rechaza toda notificación simulada | El simulador antiguo no acredita pagos |
| Firmas entrantes | Mercado Pago valida su manifiesto; Flow consulta API con firma del comercio | WebhookSecurityService genérico no es el verificador de este flujo |
| Solicitudes catálogo | Corregido: GET solo propietario/admin; POST deriva identidad del servidor | Invitados pueden crear sin quedar vinculados a una identidad declarada |
| Tracking | Corregido: lectura por acceso al pedido; registro y OT directa solo admin | AfterShip todavía puede usar fallback simulado |
| Analytics | Corregido: GET admin; POST público acotado con uid derivado del token | Los eventos anónimos no prueban identidad; persistencia/concurrencia sigue limitada |
| Contacto | Valida/honeypot/sanitiza y registra metadatos en logs | Respuesta no implica email, ticket o persistencia de mensaje |
| Transición preventa | Corregido: requiere cookie administrativa firmada | Servicio sigue en memoria; no asumir persistencia |
| CI | ci.yml configura Node 20; package.json exige 24.x | Alinear workflow y runtime al mantener despliegues |
| Reservas | TTL/barrido de servicio en memoria | No se halló cron que cancele pedidos persistidos por expiración |
| Pagos | Corregido: falla sin pasarela real; no devuelve simulación como alternativa | Sandbox del proveedor debe coincidir con el modo del pedido |
| IA | Radar/iconos/autocompletado tienen heurísticas/presets | No todos los datos proceden de Gemini o búsqueda web |
| AfterShip | Fallback simulado sin clave o según fallo | Vista de tracking no prueba movimiento real |
| Prisma/Stripe | Esquema/dependencias/enums sin adaptadores operativos hallados | No presentarlos como servicios activos |
| Rate limit | Map en middleware | No comparte ventana entre instancias |
| SDK/JSON/memoria | Fallbacks no uniformes entre servicios | No equivalen a persistencia duradera Firestore |
| Auditoría | Solo escrituras integradas con contexto | No incluye todas las mutaciones |

Prioridades para ampliar operación: pago confirmado por proveedor, liquidación real de saldo y privacidad de rutas públicas. Las filas marcadas como corregidas corresponden a la revisión de permisos y pagos; no implican que se hayan conciliado pagos antiguos. [Guía operativa](permisos-y-pagos.md).

Fuentes: [callback](../../src/app/api/checkout/mercadopago/callback/route.ts), [saldo](../../src/app/api/orders/[id]/settle-balance/route.ts), [webhook](../../src/app/api/checkout/mercadopago/webhook/route.ts), [solicitudes](../../src/app/api/catalog/product-requests/route.ts), [tracking](../../src/app/api/tracking/[id]/route.ts), [contacto](../../src/app/api/contact/route.ts).
