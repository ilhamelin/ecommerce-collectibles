# Frontend

## Stack y estructura

Next.js 14, React 18, TypeScript y Tailwind 3. Lucide para iconos, Radix para controles, Motion para animación, Swiper para carruseles, Leaflet para mapas y Zustand para estado. package.json declara rangos; package-lock.json contiene versiones resueltas. Node requerido: 24.x.

| Ubicación | Función |
|---|---|
| src/app | Páginas, layouts, carga/error y API |
| src/components/home | Portada, carrusel, selección editorial y banners |
| src/components/catalog | Tarjetas, comparación y búsqueda por foto |
| src/components/product | Galería, zoom, metadata y suscripciones |
| src/components/admin | Editores, formularios y consola IA |
| src/components/common | Diálogos, avisos y sincronización de referencias |
| src/components/chat | Sommelier |
| src/lib/store | Carrito, identidad, comparación y avisos |

El [layout raíz](../../src/app/layout.tsx) incluye navbar/footer, carrito, comparación, banners, chat y navegación móvil. El layout admin incorpora navegación específica. Componentes use client gestionan interacción; Firebase Admin y credenciales privadas pertenecen al servidor.

## Estado

cartStore: cantidades/carrito; authStore: identidad/perfil/favoritos; compareStore: hasta tres productos; toastStore: avisos. El estado local no autoriza operaciones ni fija inventario definitivo. catalogClient deduplica solicitudes y cachea 30 segundos por defecto; ProductReferenceSync sincroniza referencias y consulta también cada 60 segundos. Una lectura fallida no debe equivaler a borrar catálogo.

## Diseño y funciones

Fondo #F7F7F5, blanco, azul #1F3A5F y naranja #FF6B35. Tailwind/globals.css y componentes componen el diseño. Las consolas oscuras IA muestran eventos reales emitidos por servidor, no pensamiento interno ni una búsqueda web que no se haya ejecutado.

- Crear producto: nombre/tipo o imagen → identidad/App Check → propuesta IA/stream → revisar formulario → guardar API. Generar no publica el producto. originalPrice es manual; precio sugerido usa normalización del formulario.
- Buscar por foto: archivo local → validación → envío al iniciar identificación → progreso → comparación catálogo o solicitud de incorporación. El lector soporta eventos fragmentados entre chunks.
- Radar genera en carga/escaneo; stock lee métricas guardadas y ejecuta IA al escanear. Errores de cuota/protección se muestran conservando informe anterior disponible.
- Personalización: portada, marca, slider, anuncios y laterales tienen editores; versiones visuales permiten recuperación validada.
- Cuenta/pedidos: identidad verificada controla las APIs; el rol mostrado en navegador no es prueba de acceso.
- /portfolio ofrece ejemplos locales; su ejecución no prueba operaciones productivas.

## Páginas implementadas
| Ruta | Fuente |
|---|---|
| `/account` | [Código](../../src/app/account/page.tsx) |
| `/admin/announcement` | [Código](../../src/app/admin/announcement/page.tsx) |
| `/admin/api-usage` | [Código](../../src/app/admin/api-usage/page.tsx) |
| `/admin/branding` | [Código](../../src/app/admin/branding/page.tsx) |
| `/admin/categories/new` | [Código](../../src/app/admin/categories/new/page.tsx) |
| `/admin/home-hero` | [Código](../../src/app/admin/home-hero/page.tsx) |
| `/admin/orders` | [Código](../../src/app/admin/orders/page.tsx) |
| `/admin` | [Código](../../src/app/admin/page.tsx) |
| `/admin/predictive-stock` | [Código](../../src/app/admin/predictive-stock/page.tsx) |
| `/admin/products/[id]/edit` | [Código](../../src/app/admin/products/[id]/edit/page.tsx) |
| `/admin/products/new` | [Código](../../src/app/admin/products/new/page.tsx) |
| `/admin/products` | [Código](../../src/app/admin/products/page.tsx) |
| `/admin/radar` | [Código](../../src/app/admin/radar/page.tsx) |
| `/admin/security` | [Código](../../src/app/admin/security/page.tsx) |
| `/admin/showcase` | [Código](../../src/app/admin/showcase/page.tsx) |
| `/admin/side-banners` | [Código](../../src/app/admin/side-banners/page.tsx) |
| `/admin/slider` | [Código](../../src/app/admin/slider/page.tsx) |
| `/admin/users` | [Código](../../src/app/admin/users/page.tsx) |
| `/admin/visual-versions` | [Código](../../src/app/admin/visual-versions/page.tsx) |
| `/auth/login` | [Código](../../src/app/auth/login/page.tsx) |
| `/aviso-legal` | [Código](../../src/app/aviso-legal/page.tsx) |
| `/catalog` | [Código](../../src/app/catalog/page.tsx) |
| `/checkout` | [Código](../../src/app/checkout/page.tsx) |
| `/checkout/sandbox-payment` | [Código](../../src/app/checkout/sandbox-payment/page.tsx) |
| `/contacto` | [Código](../../src/app/contacto/page.tsx) |
| `/order-confirmation/[orderId]` | [Código](../../src/app/order-confirmation/[orderId]/page.tsx) |
| `/` | [Código](../../src/app/page.tsx) |
| `/politica-de-privacidad` | [Código](../../src/app/politica-de-privacidad/page.tsx) |
| `/portfolio` | [Código](../../src/app/portfolio/page.tsx) |
| `/privacy` | [Código](../../src/app/privacy/page.tsx) |
| `/product/[slug]` | [Código](../../src/app/product/[slug]/page.tsx) |
| `/terminos-y-condiciones` | [Código](../../src/app/terminos-y-condiciones/page.tsx) |
| `/terms` | [Código](../../src/app/terms/page.tsx) |
| `/tracking/[id]` | [Código](../../src/app/tracking/[id]/page.tsx) |
| `/tracking` | [Código](../../src/app/tracking/page.tsx) |
| `/verify/[passportId]` | [Código](../../src/app/verify/[passportId]/page.tsx) |

Al extender la UI reutilizar stores/clientes, validar estados de carga/error y foco en escritorio/móvil. Para IA usar identityHeaders(true). Actualizar esquemas y tests cuando cambie un formulario.
