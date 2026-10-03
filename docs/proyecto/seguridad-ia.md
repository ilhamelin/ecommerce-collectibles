# Seguridad e IA

## Identidad y permisos

Firebase Auth emite ID tokens. requestIdentity verifica Bearer con control de revocación o acepta cookie administrativa firmada. admin-session permite identidad verificada cuyo email está configurado; también existe cuenta demo explícita según entorno. Emite omni_admin_session HttpOnly, SameSite=Lax y Secure en producción, durante ocho horas. ADMIN_SESSION_SECRET requiere al menos 32 caracteres.

Middleware protege /admin y /api/admin/*. Numerosos handlers también verifican permisos, pero no todos. Productos/pedidos/usuarios fuera del prefijo administrativo tienen autorización por operación. canReadOrder permite administrador, propietario verificado o recibo firmado omni_order_access. Un ID/email en la URL o un rol local no otorga acceso.

Auth identifica al usuario; autorización controla acciones; App Check verifica procedencia de la app. Son controles distintos.

## IA integrada

| Función | Método y API | Acceso |
|---|---|---|
| Autocompletar | POST /api/admin/auto-fill-product | Middleware admin |
| Foto | POST /api/catalog/visual-search | Visitantes admitidos |
| Sommelier | POST /api/sommelier/chat | Visitantes admitidos |
| Iconos | POST /api/admin/branding/generate-icon | Admin antes de cuota |
| Radar | GET /api/admin/radar | Admin antes de cuota |
| Stock | POST /api/admin/predictive-stock | Admin antes de cuota |

identityHeaders(true) obtiene ID token disponible y App Check con ReCaptchaEnterpriseProvider; envía X-Firebase-AppCheck. Configuración pública: NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY. Verificación servidor: Firebase Admin.

| Modo | Token válido | Ausente/inválido |
|---|---|---|
| monitor (default) | Ejecuta si hay cuota | Ejecuta si hay cuota; suma unchecked |
| enforce | Ejecuta si hay cuota | 403 antes de reservar/ejecutar |

La variable no protege automáticamente toda la web ni activa enforcement de otros servicios Firebase desde su consola. GET de stock consulta métricas/informe guardado sin generar IA y no consume cuota.

## Cuotas

Defaults: AI_USER_DAILY_REQUESTS=40, AI_GUEST_DAILY_REQUESTS=12, AI_GLOBAL_DAILY_REQUESTS=300, AI_GLOBAL_DAILY_TOKENS=2000000. Cada solicitud admitida reserva 48000 tokens, incluso si falla posteriormente o acaba en fallback. Con presupuesto default caben 41 reservas, aunque el límite de consultas sea 300. El día se calcula UTC.

requests=admitidas; tokens=reservas preventivas; blocked=cuota agotada; unchecked=admitidas sin token válido. Rechazos App Check no incrementan blocked/unchecked. usageMetadata en telemetría representa otra métrica: consumo informado por proveedor, no reserva ni facturación sincronizada.

Cuotas global y actor comparten transacción Firestore. Sin Admin DB en producción devuelve 503. protectedAiFetch limita hasta tres intentos y salida máxima 8192 tokens/intent. No confundir con rate limiter del middleware, un Map por instancia.

## Historial, headers y límites

Auditoría y versiones se generan en operaciones integradas con writeAdminDocument y actor contextual; no en toda mutación. Telemetría registra modelo/proveedor/latencia. Su API permite SIMULATE_CALL: identificar feature/origen antes de tratarla como consumo real.

Middleware filtra URL/user-agent, redirige HTTPS según header/entorno y limita por IP: auth 5/min, sensibles 20/min, general 80/min. No inspecciona todos los cuerpos ni sustituye Zod/autorización. Headers de framing, MIME, referrer y permissions no certifican PCI o cumplimiento legal.

## Verificación

Solicitud normal en dominio registrado: token, respuesta y contador correctos. Repetir sin X-Firebase-AppCheck conservando sesión admin cuando corresponda: enforce debe devolver 403 sin ejecutar modelo. Probar foto/chat como visitante. Mocks/emuladores no prueban el estado del despliegue. Consultar limitaciones para pagos y endpoints públicos.

Fuentes: [identidad](../../src/lib/auth/requestIdentity.ts), [sesión](../../src/lib/auth/adminSessionToken.ts), [pedido](../../src/lib/auth/orderAccess.ts), [App Check/cuotas](../../src/lib/services/aiProtection.ts), [reglas](../../firestore.rules).
