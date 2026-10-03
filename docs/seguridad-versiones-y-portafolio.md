# Seguridad, versiones visuales y recorrido de portafolio

Los cambios se prepararon en el código local. Vercel y Firebase no se modifican desde estas pruebas.

## Dónde encontrar las funciones

- Catálogo y ficha del producto: botón **Comparar**. Máximo tres productos; la barra inferior abre una tabla adaptable a móviles. Guarda identificadores, usa precios/fichas vigentes y elimina selecciones al confirmar un catálogo sin esos productos.
- **Admin → Métricas & KPI → Seguridad e historial**: últimos 50 cambios confirmados, administrador, fecha, documento y datos antes/después. Incluye cuotas IA de hoy, reservas preventivas de tokens y consultas bloqueadas.
- **Admin → Personalización Visual → Versiones y campañas**: últimos 100 guardados visuales, nombres de campañas, revisión del contenido y recuperación confirmada. La portada y la marca tienen vista gráfica; el resto muestra la configuración guardada.
- Pie de página y menú móvil: **El proyecto / Recorrido interactivo**, en `/portfolio`. Los ejemplos son ficticios y locales. No otorgan permisos administrativos ni ejecutan pagos, consultas IA o escrituras en Firebase.

## Reglas de Firestore

El catálogo y las configuraciones publicadas conservan lectura pública. Los perfiles y pedidos solo permiten lectura por propietario; el correo debe estar verificado cuando se usa para identificar una cuenta antigua. Todas las escrituras del SDK cliente quedan denegadas. Las API del servidor verifican autorización y usan Firebase Admin.

Las reglas dejan de reconocer administradores por fragmentos de correo, bloquean categorías abiertas, creación directa de pedidos, autopromoción de roles y acceso a colecciones futuras. Perfiles, favoritos y eliminación de cuentas pasan por API con tokens Firebase; una cuenta de demostración guardada en el navegador no acredita identidad cloud.

**Desplegar en Vercel no actualiza las reglas de Firebase.** El archivo `firestore.rules` debe revisarse y publicarse por separado en el proyecto correcto cuando decidas activarlo. El archivo `firebase.json` permite probarlas localmente; no asigna automáticamente un proyecto de producción.

Las reglas son un prototipo validado en emulador y no una certificación exhaustiva. El inventario de rutas y SDK se revisó antes del cambio. Pruebas de ataque: listados privados, lectura entre cuentas, escrituras no autorizadas, correos con “admin”, roles manipulados, cambio de propietario, campos extra, tipos incorrectos, campos omitidos, datos enormes, timestamps alterados, cambios directos de estado, pedidos falsos y subcolecciones huérfanas. Todos deben rechazarse. No hay escrituras de cliente permitidas que puedan saltarse validadores; la validación editable del perfil se realiza con Zod en el servidor.

## Privacidad de pedidos y alertas

Las API de pedidos y alertas exigen identidad verificada y limitan la consulta a la cuenta propietaria. Un correo, identificador o cabecera de rol suministrados por el cliente no conceden acceso. El estado de un pedido solo puede editarlo una sesión administrativa firmada; la animación de seguimiento es una simulación local.

Para conservar el checkout como invitado, el servidor emite una cookie HttpOnly firmada, limitada a su último pedido y con duración de 48 horas. Sirve para la confirmación y consulta en ese navegador; no permite listar historiales ajenos. La firma usa el secreto administrativo existente o, como alternativa, la clave de Firebase Admin, con separación criptográfica de propósito. No requiere otra variable si esos secretos ya están configurados. Una rotación del secreto invalida los comprobantes anteriores. Las suscripciones públicas a alertas siguen disponibles, pero un identificador enviado por el cliente no las vincula a una cuenta verificada.

## Auditoría y versiones

Las mutaciones administrativas de productos, categorías y las cinco secciones visuales usan una transacción: documento + auditoría + versión visual. Si falla el registro, el cambio no se confirma. Los registros usan el correo de la sesión firmada, nunca una cabecera o un actor suministrado en el cuerpo.

Las colecciones `admin_audit`, `visual_versions` y `ai_quotas` están reservadas al servidor. Los guardados anteriores a esta implementación no tienen historial retroactivo. Al modificar por primera vez una sección ya existente se conserva también su diseño previo; no se reconstruyen versiones más antiguas. Para conservar una campaña asigna un nombre a la configuración actual; recuperar reutiliza los validadores de su editor, revisa el catálogo y retira enlaces e identificadores de productos eliminados. Si falla la lectura del catálogo, la recuperación se cancela.

En producción, productos, categorías y configuración visual devuelven un error si no se confirma el guardado cloud, evitando anunciar cambios que desaparecerían al reiniciar la instancia. Los registros solo cubren las mutaciones conectadas a este flujo; las operaciones del SDK Admin realizadas fuera de la aplicación no se auditan aquí. Las pantallas consultan los 50/100 registros más recientes; para un proyecto con mucho uso conviene definir una política de retención.

## Cuotas IA

Las cuatro funciones protegidas son autocompletado, búsqueda por foto, sommelier e icono de marca. Las cuotas comparten documentos diarios en Firestore y se reservan en una transacción antes de procesar la consulta, incluidas solicitudes fallidas/canceladas. Se permite hasta tres intentos de modelo por consulta y hasta 8192 tokens de salida por intento.

Valores opcionales de servidor:

| Variable | Valor predeterminado | Función |
| --- | --- | --- |
| `AI_USER_DAILY_REQUESTS` | 40 | Consultas por identidad verificada/día |
| `AI_GUEST_DAILY_REQUESTS` | 12 | Consultas por IP de visitante/día |
| `AI_GLOBAL_DAILY_REQUESTS` | 300 | Consultas globales/día |
| `AI_GLOBAL_DAILY_TOKENS` | 2000000 | Presupuesto preventivo de tokens estimados/día |
| `FIREBASE_APPCHECK_MODE` | monitor | `monitor` o `enforce` |

Cada consulta reserva 48000 tokens estimados. Se conserva la reserva incluso ante un fallo para evitar reintentos ilimitados. Es una estimación preventiva; no representa tokens facturados ni impone un importe monetario exacto. El consumo real continúa en el panel de telemetría existente. Los días cambian a las 00:00 UTC. Usuarios sin sesión se agrupan por IP; una red compartida comparte esa cuota.

No se necesitan nuevas variables para las cuotas si Firebase Admin ya funciona. En producción, si Firestore no está disponible la IA se pausa con un mensaje. En desarrollo sin Firebase se usa memoria limitada; esta alternativa no se utiliza en producción. Los contadores diarios incluyen `expiresAt` informativo; no se eliminan automáticamente ni se ha creado una tarea de mantenimiento.

## Activar App Check

1. Registra la aplicación web en **Firebase Console → App Check** con el proveedor reCAPTCHA Enterprise y los dominios correspondientes.
2. Configura en Vercel `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` con la clave pública del sitio, nunca con una clave privada de servicio.
3. Mantén `FIREBASE_APPCHECK_MODE=monitor` y crea un despliegue que tome las variables. Revisa **Seguridad e historial** y prueba las funciones IA.
4. Cuando los tokens sean válidos, cambia a `enforce` y vuelve a desplegar. El servidor exigirá `X-Firebase-AppCheck`; un token ausente o inválido recibe 403. Si falla, vuelve temporalmente a `monitor` mientras corriges el registro.

El modo de observación no certifica ni bloquea navegadores sin App Check. La autenticación, autorización y cuotas siguen aplicándose.

Referencias: [App Check para web](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider), [verificación en backend propio](https://firebase.google.com/docs/app-check/custom-resource-backend), [pruebas de reglas](https://firebase.google.com/docs/rules/unit-tests), [cabeceras de IP de Vercel](https://vercel.com/docs/headers/request-headers).

## Verificación reproducible

- `npm test`: pruebas de aplicación y UI; las dos suites de emulador se omiten si no existe `FIRESTORE_EMULATOR_HOST`.
- `npm run test:rules`: inicia Firestore en 127.0.0.1:8089 con proyectos `demo-*`, ejecuta ataques de reglas y transacciones reales y cierra el emulador. Requiere Java 21+ y descarga Firebase CLI mediante npx. Nunca utiliza un proyecto real.
- `npx tsc --noEmit`: comprobación completa de tipos, incluidos fixtures.
- `npm run build -- --no-lint`: compilación de producción.

Las transacciones se prueban con veinte llamadas simultáneas para una cuota global de diez, rollback ante una auditoría inválida y creación de versiones persistentes. No se hicieron pedidos reales, llamadas a modelos de pago ni escrituras en la base de datos desplegada.

Resultado local de esta implementación: 406 pruebas de aplicación aprobadas y 13 pruebas adicionales aprobadas en el emulador. TypeScript y compilación de producción completados. El recorrido se comprobó en escritorio y móvil (390 px), sin desbordamiento horizontal ni errores de consola. Las 13 pruebas del emulador se omiten en la suite general y se ejecutan por separado con `test:rules`.
