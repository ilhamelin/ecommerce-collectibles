# Operación

## Arranque y pruebas

Node 24.x y npm según package.json; Java para emulador Firestore. PostgreSQL no es requisito del backend Firestore actual.

```powershell
npm ci
npm run dev
```

Abrir localhost:3000. Configurar .env.local privado, sin versionar. No obtener secretos de ejemplos.

```powershell
npx tsc --noEmit
npm test -- --reporter=dot
npm run build
npm run test:rules
```

test:rules ejecuta emulador y tests de reglas/persistencia con proyecto demo. La suite general omite esos tests cuando no hay emulador. Resultados históricos no prueban la versión actual. Esta entrega documental se verifica por enlaces/inventario/consistencia y no requiere llamadas pagadas.

## Variables

| Grupo | Nombres | Alcance |
|---|---|---|
| Firebase web | NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, NEXT_PUBLIC_FIREBASE_APP_ID | Configuración pública navegador |
| Firebase Admin | FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY | Servidor; project ID puede usar fallback público |
| Admin | ADMIN_SESSION_SECRET, ADMIN_EMAILS | Firma y emails permitidos |
| Demo | ADMIN_DEMO_EMAIL, ADMIN_DEMO_PASSWORD | Cuenta demo explícita |
| App Check | NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY, FIREBASE_APPCHECK_MODE | Sitio público y modo servidor |
| Gemini | GEMINI_API_KEY o GOOGLE_API_KEY | Privado servidor |
| Cuotas | AI_USER_DAILY_REQUESTS, AI_GUEST_DAILY_REQUESTS, AI_GLOBAL_DAILY_REQUESTS, AI_GLOBAL_DAILY_TOKENS | Servidor |
| Mercado Pago | MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_SANDBOX_MODE, MERCADOPAGO_WEBHOOK_SECRET | Servidor; false activa live según adapter/token |
| Flow | FLOW_API_KEY, FLOW_SECRET_KEY, FLOW_SANDBOX_MODE | Servidor; default sandbox |
| Simulación | SANDBOX_SIMULATION_KEY | Obsoleta: no habilita pagos simulados |
| Tracking | AFTERSHIP_API_KEY | Servidor |
| SMTP | SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM | Correo; puerto default 587 |
| Prisma alternativo | DATABASE_URL | Esquema relacional no activo en flujos inspeccionados |

Existe fallback NEXT_PUBLIC_GEMINI_API_KEY y NEXT_PUBLIC_ADMIN_EMAILS en código. No usar nombres públicos para secretos: pueden incorporarse al bundle. Documentar el fallback no lo elimina.

Private key Firebase conserva BEGIN/END PRIVATE KEY y contenido PEM íntegro; no es private_key_id. El normalizador soporta formatos de saltos de línea definidos en adminCredentials.ts.

## Despliegue

Variables NEXT_PUBLIC se incorporan al build. Elegir Production/Preview y desplegar de nuevo al editarlas; un despliegue anterior no cambia por actualizar la configuración. Comprobar dominio de clave App Check, acceso Firestore y reglas desplegadas. Desplegar Next.js no despliega reglas/índices/TTL automáticamente.

Después publicar: catálogo, login, pedido autorizado, sandbox explícito y seis funciones IA. Revisar logs del servidor y Firestore; no afirmar conexión real porque una vista use fallback. Esta documentación no ejecuta despliegues.

## Diagnóstico

| Síntoma | Revisar |
|---|---|
| 403 admin | Cookie firmada, expiración, email permitido y secreto |
| 403 IA | App Check header, site key y dominio |
| 429 | Cuota diaria vs ventana por minuto |
| 503 cuota | Firebase Admin y ai_quotas |
| ERR_REQUIRE_ESM | Etapa SDK, loader/versión y logs |
| 400 checkout | Issues Zod, idempotencyKey y cantidades |
| Pago aparente | gateway.mode y confirmación del proveedor; callback/simulador |
| Tracking genérico | Clave AfterShip y fallback |
| Tokens distintos | Reserva preventiva vs usageMetadata; UTC/reintentos |
| Contacto sin correo | Handler actual no envía email |

Fuentes: [scripts](../../package.json), [Firebase](../../src/lib/firebase/config.ts), [Admin](../../src/lib/firebase/admin.ts), [Gemini](../../src/lib/services/geminiClient.ts), [Next](../../next.config.mjs), [tests](../../vitest.config.ts).

## Integración continua

[ci.yml](../../.github/workflows/ci.yml) ejecuta npm ci, tests y build, y guarda artefacto .next. Actualmente usa Node 20, distinto de 24.x declarado en package.json; se registra la discrepancia como pendiente, sin modificar el workflow en esta entrega. Revisar .github/workflows/deploy.yml antes de atribuirle un despliegue efectivo de Vercel.

Configuración y pruebas de pagos: [guía](permisos-y-pagos.md).
