# 🎮 OmniCollector Chile — Plataforma de E-Commerce Especializada

[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Cloud_Firestore-Firebase-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Mercado Pago](https://img.shields.io/badge/Mercado_Pago-Chile_SDK-009EE3?style=for-the-badge&logo=mercadopago)](https://www.mercadopago.cl/)
[![Vitest](https://img.shields.io/badge/Vitest-53%2F53_Passed-6E9F18?style=for-the-badge&logo=vitest)](https://vitest.dev/)

**OmniCollector Chile** es una plataforma moderna de comercio electrónico de alta precisión arquitectónica desarrollada en **Next.js 14 (App Router)** y **TypeScript estricto**, especializada en el mercado chileno de **videojuegos**, **figuras a escala licenciadas** y **cartas coleccionables certificadas (PSA / CGC / BGS)**, operando íntegramente en moneda nacional (**Pesos Chilenos - CLP**).

---

## 🌟 Características Principales

### 1. 💰 Moneda Nacional Chilena (CLP)
- Todos los cálculos matemáticos, transacciones y cobros operan en números enteros sin fracciones decimales, garantizando consistencia absoluta en el comercio minorista chileno (`$ 59.990 CLP`, `$ 249.990 CLP`, `$ 4.890.000 CLP`).

### 2. ⏳ Motor de Preventas & Pie del 20% (`PreOrderEngine`)
- Permite reservar figuras a escala de alto valor abonando un **pie inicial del 20%**.
- El **saldo restante (80%)** queda congelado e inmutable, emitiéndose la liquidación automática al momento del arribo del lote a aduana/bodega central.
- Máquina de estados de 6 fases: `ANNOUNCED` → `PREORDER_OPEN` → `MANUFACTURING` → `IN_TRANSIT_CUSTOMS` → `WAREHOUSE_RECEIVED` → `FULFILLED`.

### 3. 📦 Motor de Bundles Dinámicos (`BundleEngine`)
- Implementa el patrón estructural **Composite**.
- La disponibilidad en stock del paquete se calcula en $O(n)$ como `min(stock_i / req_i)`.
- Reserva atómica estricta: si uno de los componentes se agota, el paquete se bloquea instantáneamente para proteger el margen retail agregado.

### 4. 🛡️ Control de Concurrencia & TTL de 15 Minutos
- Bloqueo pesimista de inventario para piezas únicas (ej. *Charizard 1st Edition PSA 9*).
- **TTL de 15 minutos**: si el comprador no completa el pago en la pasarela, el temporizador devuelve automáticamente el artículo al stock disponible.
- Prevención de pagos duplicados mediante cabeceras de idempotencia.

### 5. 💳 Pasarela de Pagos (Mercado Pago / Webpay Plus)
- Integración nativa con el SDK oficial de **Mercado Pago Chile**.
- Soporte para **Sandbox simulado** con verificación de tarjetas de prueba Visa / Mastercard / Redcompra.
- Webhooks con validación de firmas y sincronización de estados de pago.

### 6. 🚚 Panel de Administrador (`/admin/orders` y `/admin/products`)
- **Gestión de Pedidos**: Modificación en tiempo real del estado de cada orden (`CONFIRMED`, `PAID`, `PREPARING`, `DISPATCHED`, `DELIVERED`, `CANCELLED`).
- **Logística**: Asignación de courier chileno (*Starken, Chilexpress, CorreosChile*) y código de seguimiento.
- **Notas Internas**: Registro de instrucciones de empaque o acuerdos con clientes.
- **Gestión de Catálogo**: Creación y edición de productos, control de stock, márgenes de costo y generación de SKU.

### 7. 👤 Portal de Clientes & Seguimiento en Vivo (`/account`)
- **Historial de Pedidos en Vivo**: Conectado directamente a Cloud Firestore para reflejar cambios del administrador de inmediato.
- **Línea de Tiempo / Stepper de 4 Fases**:
  1. *Pedido Realizado*
  2. *En Bodega (Empaque Blindado)*
  3. *En Camino (Courier & N° de Seguimiento)*
  4. *Entregado*
- **Herramientas de Cliente**: Copia rápida de tracking en 1 clic, enlace de rastreo, botón directo para consultas por **WhatsApp** y descarga de comprobantes.
- **Lista de Favoritos (Wishlist)**: Guardado en Firestore con botón de añadir directamente al carrito.

---

## 🎨 Sistema de Diseño (Design System)

La interfaz utiliza una paleta moderna, limpia y con alto contraste, eliminando fondos oscuros pesados:

| Token | Color | Hex | Uso |
| :--- | :--- | :--- | :--- |
| **Base Canvas** | Blanco Cálido | `#F7F7F5` | Fondos de página y superficies neutras |
| **Cards & Surfaces** | Blanco Puro | `#FFFFFF` | Tarjetas de producto, tablas y modales |
| **Borders** | Gris Claro | `#E5E5E5` | Divisiones y bordes de componentes |
| **Typography Primary** | Casi Negro | `#1A1A1A` | Títulos, precios y textos principales |
| **Typography Secondary** | Gris Medio | `#666666` | Metadatos, fechas y subtítulos |
| **Brand Primary** | Azul Marino | `#1F3A5F` | Encabezados, barras de navegación y branding |
| **Brand Accent (CTA)** | Naranja Cálido | `#FF6B35` | Botones de compra, estados activos y badges |

---

## 📂 Estructura del Proyecto

```text
ecommerce-collectibles/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Pipeline de validación continua (Test & Build)
│       └── deploy.yml             # Pipeline de empaquetado y release web para producción
├── prisma/
│   └── schema.prisma              # Definición relacional del modelo de datos
├── public/                        # Activos estáticos, logos e ilustraciones
├── src/
│   ├── app/
│   │   ├── account/               # Portal de usuario: Seguimiento de pedidos y perfil
│   │   ├── admin/
│   │   │   ├── orders/            # Panel admin: Gestión y estados de pedidos
│   │   │   └── products/          # Panel admin: Catálogo, inventario y nuevo producto
│   │   ├── api/
│   │   │   ├── checkout/          # Endpoints de creación y webhooks de pago
│   │   │   ├── orders/            # API REST de pedidos (GET, PATCH, DELETE)
│   │   │   └── products/          # API REST de productos y catálogo
│   │   ├── auth/                  # Inicio de sesión y registro de cuentas
│   │   ├── catalog/               # Catálogo público con filtros y búsqueda
│   │   ├── checkout/              # Flujo de pago y sandbox de Mercado Pago
│   │   ├── order-confirmation/    # Comprobante electrónico de compra
│   │   ├── product/[slug]/        # Ficha técnica detallada de cada producto
│   │   ├── globals.css            # Estilos globales y variables de Tailwind
│   │   ├── layout.tsx             # Layout raíz del e-commerce
│   │   └── page.tsx               # Portada principal (Hero, Colecciones, Novedades)
│   ├── components/                # Componentes reutilizables (Navbar, Footer, Modales, etc.)
│   └── lib/
│       ├── db/                    # Almacenamiento transaccional en memoria (fallback)
│       ├── firebase/              # Conexión a Cloud Firestore (Cliente y Admin SDK)
│       ├── payments/              # Lógica de Mercado Pago y pasarelas
│       ├── services/              # Motores de negocio (PreOrderService, BundleService, etc.)
│       ├── store/                 # Estado global con Zustand (AuthStore, CartStore)
│       └── utils/                 # Formateadores CLP y utilidades de moneda
├── tests/                         # Suite de 53 pruebas unitarias e integración (Vitest)
├── .env.example                   # Plantilla de variables de entorno
├── .gitignore                     # Archivos ignorados para protección de secretos
├── package.json                   # Dependencias y scripts del proyecto
└── README.md                      # Presentación y documentación oficial
```

---

## 🚀 Puesta en Marcha Local

### Prerrequisitos
- **Node.js**: versión 18.17+ o 20.x recomendada.
- **npm** o **pnpm**.

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/ecommerce-collectibles.git
cd ecommerce-collectibles
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Copia el archivo de ejemplo a `.env.local`:
```bash
cp .env.example .env.local
```
*(Para desarrollo local, el sistema incluye persistencia transaccional con fallback automático en memoria si aún no has configurado tus credenciales de Firebase o Mercado Pago).*

### 4. Ejecutar Pruebas Unitarias
```bash
npm run test
```
> **Resultado esperado**: 53 pruebas aprobadas (10 suites en Vitest: reservas con TTL, preventas, bundles, checkout, autenticación y Firestore).

### 5. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
Abre tu navegador en **[http://localhost:3000](http://localhost:3000)**.

---

## ⚙️ Integración Continua con GitHub Actions

El repositorio cuenta con flujos de trabajo automatizados en `.github/workflows/`:

### 1. `ci.yml` (Integración Continua)
Se activa en cada `push` o `pull_request` a las ramas `main`, `master` o `develop`:
- Descarga el código y configura Node.js 20 con caché de dependencias.
- Ejecuta las 53 pruebas unitarias en **Vitest**.
- Compila la aplicación web con **Next.js Production Build** (`npm run build`).
- Guarda el artefacto de compilación generado.

### 2. `deploy.yml` (Empaquetado y Release Web)
Se activa automáticamente al fusionar código en `main`:
- Construye el bundle optimizado para producción.
- Empaqueta el release listo para desplegar en proveedores cloud (Vercel, AWS, VPS, Docker o Google Cloud).

### Secretos Recomendados en GitHub Actions:
Para conectar tu base de datos y pasarela en producción, agrega los siguientes secretos en **Settings -> Secrets and variables -> Actions**:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `MERCADOPAGO_ACCESS_TOKEN`

---

## 👥 Cuentas de Prueba Pre-configuradas

Puedes iniciar sesión inmediatamente en la plataforma utilizando las siguientes credenciales:

| Perfil | Correo Electrónico | Contraseña | Rol y Acceso |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@omnicollector.cl` | `admin123` | Acceso a `/admin/orders` y `/admin/products` |
| **Cliente Frecuente** | `cliente@omnicollector.cl` | `cliente123` | Historial de pedidos con tracking en `/account` |

---

## 📄 Licencia

Este proyecto se encuentra bajo la licencia **MIT**. Desarrollado para coleccionistas y comercio minorista en Chile.
