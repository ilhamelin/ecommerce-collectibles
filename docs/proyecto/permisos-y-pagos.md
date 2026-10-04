# Permisos de APIs y confirmación fiable de pagos

Revisión: 3 de octubre de 2026. Se modificó código y se probó en entorno de tests/emulador; no se realizaron cobros ni escrituras en la base productiva.

## Accesos

| Ruta | Acceso aplicado |
|---|---|
| GET /api/catalog/product-requests | Administrador o identidad verificada: solamente sus solicitudes, excluyendo invitadas no verificadas |
| POST /api/catalog/product-requests | Admite invitados; UID declarado se ignora. Con identidad, correo y UID se derivan del token verificado |
| GET /api/tracking/[id] | Propietario del pedido, recibo firmado de invitado o admin. Consulta OT arbitraria: solo admin |
| POST /api/tracking/[id] | Cookie administrativa firmada antes de contactar AfterShip |
| GET /api/analytics | Cookie administrativa firmada |
| POST /api/analytics | Público, de 1 a 50 eventos validados; UID únicamente de identidad verificada, no del cuerpo |
| POST /api/preorders/[id]/transition | Cookie administrativa firmada antes de ejecutar transición |
| POST /api/orders/[id]/settle-balance | Propietario, recibo firmado o admin; inicia cobro, no liquida directamente |

El seguimiento y solicitudes de cuenta usan headers de identidad del cliente. Beacon de analítica se considera anónimo; no acredita usuarios. Las rutas públicas de creación/ingesta siguen sujetas al rate limit existente, que no es distribuido. Transiciones de preventa y estadísticas conservan sus limitaciones de persistencia anteriores.

## Flujo de pago

```mermaid
sequenceDiagram
  participant C as Cliente
  participant API as Checkout / saldo
  participant P as Mercado Pago o Flow
  participant V as Verificador servidor
  participant DB as Firestore
  C->>API: Iniciar pago
  API->>P: Crear cobro con referencia e importe del servidor
  P-->>C: Pantalla de pago
  P->>V: Notificación firmada MP / token Flow
  V->>P: Consultar pago con credenciales del comercio
  P-->>V: Estado, moneda, importe y referencia
  V->>DB: Transacción: recibo único, pedido y stock legado si corresponde
  DB-->>V: Confirmación persistida o fallo sin cambios parciales
  C->>API: Consultar pedido
  API-->>C: Estado almacenado; URL del navegador no prueba pago
```

Mercado Pago valida x-signature (ts/v1), x-request-id y data.id según su manifiesto HMAC. Después consulta el pago con el access token privado. No acepta firmas genéricas del JSON ni la antigua rama simulada. El callback consulta al proveedor, coteja la referencia del pedido y redirige pendiente ante fallo; status=approved en una URL no acredita nada.

Flow recibe token y llama a payment/getStatus usando apiKey y parámetros firmados con secretKey. Solamente status=2 habilita la transacción. Referencias antiguas orderNumber se resuelven al ID canónico del pedido; nuevos cobros usan order.id.

Ambos flujos cotejan CLP, importe entero, pasarela, pedido activo y modo LIVE/SANDBOX. Flow también compara flowOrder con el ID creado cuando está almacenado. Los pagos nuevos no usan memoria como confirmación alternativa: requieren Admin SDK/Firestore.

La transacción escribe payment_confirmations y el estado del pedido juntos. El hash proveedor/ID impide reutilizar la misma transacción para otro pedido o saldo. Reintentos del mismo pago son idempotentes. Si el checkout ya descontó stock, no vuelve a descontarse; para pedidos legados el movimiento se incluye en la transacción. Si falla inventario/persistencia, no se marca PAID.

Un segundo pago distinto sobre un pedido ya pagado, un importe diferente o un pago para pedido cancelado requiere revisión: no se ignora ni se usa para modificar el pedido. La devolución al cliente es un proceso operativo distinto; no se ejecutan reembolsos automáticos.

## Saldo de preventa

La interfaz de Mi cuenta ofrece Pagar saldo con Mercado Pago. La API también admite paymentMethod=WEBPAY. No acepta paymentId proporcionado por el navegador. El abono inicial debe estar confirmado y el pedido activo.

La referencia order.id~balance identifica un cobro separado por el saldo almacenado. El servidor guarda balanceCheckoutGateway y devuelve el enlace. remainingBalanceLater y balancePaid solo cambian en la confirmación de proveedor, sin otro descuento de stock. Los importes CLP se redondean al peso, igual que los adaptadores.

## Configuración en Vercel y Mercado Pago

1. En Tu integración de Mercado Pago, configurar notificaciones Webhooks de pagos hacia https://ecommerce-collectibles.vercel.app/api/checkout/mercadopago/webhook.
2. Copiar la clave secreta de firma generada en MERCADOPAGO_WEBHOOK_SECRET en Vercel, para los entornos utilizados. No es MERCADOPAGO_ACCESS_TOKEN ni una clave pública. No usar NEXT_PUBLIC_.
3. Mantener MERCADOPAGO_ACCESS_TOKEN y MERCADOPAGO_SANDBOX_MODE coherentes. Pruebas con credenciales Sandbox; producción con credenciales live y modo false. Flow usa FLOW_API_KEY, FLOW_SECRET_KEY y FLOW_SANDBOX_MODE, con URL de notificación generada por el adapter.
4. Crear un nuevo despliegue tras editar variables. Salud del sistema muestra si la firma MP está configurada; esto no prueba una conexión externa.
5. Realizar una compra de prueba en Sandbox y comprobar el pedido desde el servidor. Repetir la notificación no debe duplicar stock ni confirmaciones. Sin firma válida: 403; sin secreto o con proveedor/persistencia indisponible: 503; evidencia incompatible: 409, salvo referencia/ID inválidos: 400/404 según ruta.

Sin pasarela configurada o si falla, checkout devuelve error y mantiene el pedido pendiente para reintento; no devuelve una simulación que parezca un cobro. La clave SANDBOX_SIMULATION_KEY no habilita pagos. El sandbox auténtico del proveedor sí está soportado.

## Límites y revisión operativa

Los pagos anteriores a esta corrección no se conciliaron automáticamente: revisar los que fueron acreditados por callback/simulador antiguo. Un pedido legado ya pagado con el mismo ID auténtico puede registrar su recibo verificado; no inventar evidencia si no existe.

El correo de confirmación inicial es de mejor esfuerzo después del commit; un fallo de SMTP no revierte el pago. No hay una cola persistente de reintento de correo. Los pagos de saldo no reenvían el recibo del abono inicial. La pantalla no afirma que exista boleta electrónica SII emitida.

La transacción de inventario al crear checkout y la solicitud externa de cobro siguen siendo pasos separados. La expiración automática de reservas persistidas y la conciliación periódica de pagos perdidos no se añaden en este cambio. Transferencias bancarias requieren verificación administrativa y siguen siendo pendientes de recepción; no se consultan automáticamente en un banco.

Fuentes oficiales: [Webhooks Mercado Pago](https://www.mercadopago.cl/developers/en/docs/split-payments/additional-content/your-integrations/notifications/webhooks), [estado de pago Flow](https://developers.flow.cl/docs/tutorial-basics/status).

Pruebas: firma inválida/ausente, IDs discordantes, parámetros de URL falsificados, estado pendiente, proveedor indisponible, validación importe/moneda/pasarela/entorno, saldo real, propietario/admin, secreto de webhook, simulación bloqueada, stock reservado/legado, concurrencia y rollback en Firestore Emulator.
