# Salud, búsqueda y notificaciones

## Dónde encontrarlas

- Administración → Métricas & KPI → Salud del sistema: /admin/health.
- Tienda → Catálogo: /catalog. Fabricante/marca y fecha de llegada están en los filtros de escritorio y móvil.
- Mi cuenta → Notificaciones: /account?tab=notifications.

## Panel de salud

Verifica una lectura de Firestore, consulta cuotas persistentes/App Check y muestra errores recientes de la telemetría del día UTC. Los errores de simulación se excluyen. Cada dependencia tiene cuatro segundos de espera; una dependencia fallida no oculta los demás resultados. El tiempo de lectura mide únicamente Firestore.

Gemini, Mercado Pago, Flow, AfterShip, SMTP y App Check se revisan por sus variables de configuración. «Configurado» no significa conexión verificada. No hay llamadas pagadas, cobros ni correos de prueba. El panel no calcula uptime. Se actualiza al abrir y mediante Actualizar; un error conserva la comprobación anterior con un aviso visible. No hacen falta nuevas variables de entorno.

## Catálogo

La búsqueda ignora acentos y mayúsculas. Conserva el comportamiento existente de todos los términos: busca nombre, SKU, descripción y metadatos. El fabricante se obtiene de figureMetadata, gameMetadata y manufacturer/brand/publisher en especificaciones propias, sin inventar opciones.

El filtro de llegada admite solamente productos en preventa con estimatedArrivalDate ISO registrado. Los textos como «Inmediata» o un mes estimado no se interpretan como fechas. El rango es inclusivo; un rango invertido muestra un aviso y no produce coincidencias.

Todos los filtros y el orden se conservan en la URL: category, q, sort, min, max, stock, platform, scale, condition, console, hardware, accessory, language, size, merch, audio, manufacturer, arrivalFrom, arrivalTo. Los aliases search/tag se migran a q. Los parámetros ajenos se preservan. Los cambios se escriben con replaceState tras 250 ms, sin crear una entrada del historial por cada pulsación. Se pueden compartir y recuperar al recargar; navegar a otro enlace de catálogo recupera sus filtros. Limpiar elimina filtros y restablece el orden.

## Centro de notificaciones

Presenta estados actuales comprobables, no un historial de eventos reconstruido: estado del pedido, seguimiento registrado, preventa marcada como recibida en bodega con saldo pendiente, disponibilidad que era inexistente al suscribirse y precio inferior al de la suscripción. Las suscripciones deben estar activas y no eliminadas. El stock descuenta reservas; las preventas no se anuncian como stock inmediato. Una suscripción solo de precio no recibe avisos de stock y viceversa.

La API consulta únicamente pedidos y alertas del correo verificado de la identidad. La interfaz permite ver solo sin leer, marcar una o todas y actualizar. No marca como leída hasta recibir confirmación del servidor. Un cambio de estado del pedido genera un ID distinto; la lectura anterior no oculta la novedad.

notification_reads guarda hasta 500 IDs leídos por identidad, con clave SHA-256 del UID (o correo para sesión administrativa) y updatedAt. Las escrituras son una transacción del Admin SDK: el cliente no puede escribir directamente y no puede enviar IDs ajenos. Las reglas actuales deniegan esta colección a clientes.

Límites actuales: hasta 200 pedidos y 200 suscripciones por consulta, catálogo consultado por el servidor y hasta 100 avisos visibles. No se promete recuperar todo el historial de cuentas que superen estos límites. Se refresca al abrir o pulsar Actualizar; no incluye push del navegador, envío automático por correo ni un proceso de vigilancia en segundo plano. Fecha de avisos de producto: updatedAt del producto o fecha de suscripción, sin inventar una fecha de detección.

## Comprobaciones

Las pruebas cubren filtros compartidos/restablecidos, validación de fechas, marcas, datos incompletos, stock reservado, lectura estable y nuevos estados, acceso y pertenencia a la cuenta, transacciones de lectura, fallos parciales, ocultación de secretos y estados de las pantallas.
