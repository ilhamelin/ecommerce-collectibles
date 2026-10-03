# Arquitectura

## Modelo implementado

Next.js App Router reúne tienda, portal de clientes y administración. Route Handlers del mismo proyecto constituyen el backend; servicios TypeScript encapsulan lógica. Firestore es la persistencia operativa; Firebase Auth proporciona identidad y Firebase Admin opera en servidor. Prisma/PostgreSQL existe como esquema alternativo, sin PrismaClient conectado hallado en src.

No se encontró una cola ni cron productivo en la configuración inspeccionada. Los proveedores se llaman desde las peticiones. Map/singletons/JSON son por proceso o entorno local; no constituyen almacenamiento compartido de Vercel.

## Contexto y proveedores

```mermaid
flowchart LR
  C[Cliente] --> W[Tienda y cuenta]
  A[Administrador] --> P[Panel admin]
  W --> N[Next.js en Vercel]
  P --> N
  N --> F[(Firestore)]
  N --> AUTH[Firebase Auth]
  N --> G[Gemini]
  N --> MP[Mercado Pago]
  N --> FL[Flow y Webpay]
  N --> AS[AfterShip]
  N --> E[SMTP]
  W --> AC[Firebase App Check]
  P --> AC
```

## Capas

```mermaid
flowchart TB
  subgraph Navegador
    UI[React y componentes] --> ST[Zustand]
    UI --> HTTP[Clientes HTTP y lectores NDJSON]
    SDK[Firebase Auth y App Check] --> HTTP
  end
  HTTP --> MW[Middleware: cookie, filtros y rate limit]
  subgraph Servidor_Next
    MW --> API[Route Handlers]
    API --> PER[Identidad y permisos]
    PER --> SV[Servicios de dominio e IA]
    SV --> DB[Adaptadores y transacciones]
    SV --> EXT[Adaptadores de proveedores]
  end
  DB --> FS[(Firestore)]
  DB -. alternativas locales .-> MEM[Memoria y JSON]
  EXT --> PR[Gemini, pagos, tracking, SMTP]
```

Algunas lecturas utilizan SDK Firebase directamente; no todo acceso pasa por HTTP. Las reglas permiten catálogo/configuración pública y deniegan escrituras SDK cliente. Firebase Admin necesita permisos en las APIs porque las reglas de cliente no lo limitan.

## Checkout

```mermaid
sequenceDiagram
  participant B as Navegador
  participant API as POST checkout
  participant S as CheckoutService
  participant F as Firestore
  participant P as Mercado Pago o Flow
  B->>API: Carrito y clave idempotente
  API->>API: Validar y calcular hash
  API->>F: Buscar pedido por ID derivado
  alt Pedido nuevo
    API->>S: Calcular importes y reservas
    S-->>API: Pedido candidato
    API->>F: Transacción pedido y descuento stock
  else Reintento compatible
    F-->>API: Pedido existente
  end
  API->>P: Crear preferencia u orden
  P-->>API: URL de pago
  API-->>B: 201, gateway y cookie recibo
  B->>P: Pagar
  P->>API: Webhook proveedor
  API->>P: Consultar estado real
  API->>F: Confirmar pago sin doble descuento
```

Transferencia no necesita redirección externa. Una pasarela no configurada puede devolver simulación. El callback de retorno Mercado Pago tiene otro camino que confía en URL: ver limitaciones. La llamada a pasarela es posterior a la transacción de inventario y no es atómica con ella.

## Protección IA

```mermaid
sequenceDiagram
  participant C as Interfaz
  participant AC as App Check
  participant API as API IA
  participant F as Firestore cuotas
  participant G as Gemini
  C->>AC: Obtener token
  AC-->>C: Token
  C->>API: Entrada, token e identidad disponible
  API->>API: Verificar acceso y App Check
  alt enforce y token inválido
    API-->>C: 403 antes de ejecutar IA
  else Token admitido según modo
    API->>F: Reservar consulta y 48000 tokens
    alt Cuota agotada
      API-->>C: 429
    else Cuota disponible
      API->>G: Hasta tres intentos
      G-->>API: Resultado y usageMetadata
      API->>F: Telemetría cuando corresponde
      API-->>C: JSON o NDJSON
    end
  end
```

Sin persistencia de cuota en producción devuelve 503. Fallos posteriores a reservar consumen cuota. La reserva no representa facturación.

## Auditoría

```mermaid
flowchart LR
  E[Editor admin] --> H[Actor en withAdminHistory]
  H --> T[Transacción]
  T --> D[Documento actual]
  T --> A[admin_audit: antes y después]
  T --> V[visual_versions]
  V --> R[Restaurar mediante editor validado]
  R --> H
```

Solo las mutaciones integradas con writeAdminDocument/contexto quedan bajo este mecanismo; no toda escritura del repositorio.

Fuentes: [middleware](../../src/middleware.ts), [checkout](../../src/app/api/checkout/route.ts), [transacciones](../../src/lib/firebase/commerce.ts), [IA](../../src/lib/services/aiProtection.ts), [historial](../../src/lib/services/adminHistory.ts).
