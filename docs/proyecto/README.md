# Documentación técnica de OmniCollector Chile

Revisión: 3 de octubre de 2026. Fuente: código del repositorio; no inspección de credenciales o despliegue.

OmniCollector es una tienda especializada en videojuegos, figuras y coleccionables, con moneda CLP, portal de clientes y administración con IA.

| Documento | Contenido |
|---|---|
| [Arquitectura](arquitectura.md) | Capas y diagramas Mermaid |
| [Frontend](frontend.md) | Páginas, componentes, estado y diseño |
| [Backend](backend.md) | Servicios, checkout e inventario |
| [APIs](apis.md) | Todas las rutas/métodos y contratos principales |
| [Datos](datos.md) | Entidades y colecciones Firestore |
| [Seguridad e IA](seguridad-ia.md) | Identidad, permisos, App Check, cuotas e historial |
| [Operación](operacion.md) | Variables, desarrollo, pruebas y diagnóstico |
| [Limitaciones](limitaciones.md) | Comportamientos verificados que requieren revisión |
| [Inventario JSON](inventario-api.json) | Rutas/métodos estructurados |

Lectura sugerida: arquitectura → frontend/backend → APIs → seguridad → operación. Mermaid es editable y se visualiza en un visor Markdown compatible, como GitHub. Los documentos complementan [seguridad y versiones](../seguridad-versiones-y-portafolio.md) y [telemetría](../api-telemetry-persistence.md).

«Público» indica ausencia de identidad obligatoria en el handler, sujeto al middleware. «Admin» incluye la barrera del middleware /api/admin; no garantiza una segunda verificación interna en cada handler. «Simulado» no demuestra conexión con un proveedor externo. El inventario cubre src/app/api/**/route.ts; los contratos detallados priorizan los flujos principales y deben contrastarse con sus esquemas fuente.

No se incluyen secretos ni valores .env. Al cambiar rutas actualizar APIs/inventario; al cambiar permisos actualizar seguridad; al cambiar colecciones actualizar datos. Las afirmaciones antiguas del README principal que difieran deben contrastarse con esta revisión y el código.

## Fuentes de diagramas

- [arquitectura-1.mmd](diagramas/arquitectura-1.mmd)
- [arquitectura-2.mmd](diagramas/arquitectura-2.mmd)
- [arquitectura-3.mmd](diagramas/arquitectura-3.mmd)
- [arquitectura-4.mmd](diagramas/arquitectura-4.mmd)
- [arquitectura-5.mmd](diagramas/arquitectura-5.mmd)
- [backend-1.mmd](diagramas/backend-1.mmd)
- [datos-1.mmd](diagramas/datos-1.mmd)
