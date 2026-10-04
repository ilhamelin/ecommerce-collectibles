# Contenido y herramientas de administración

Implementado el 4 de octubre de 2026. Acceso: **Admin → Herramientas**, en `/admin/tools`. El laboratorio también aparece en **Personalización Visual → Laboratorio de la tienda**. Todas las operaciones de gestión requieren sesión administrativa verificada por el servidor.

## Importar productos desde Excel o CSV

En la pestaña Importador descarga una plantilla CSV o XLSX. Se admiten archivos `.csv` y `.xlsx`, hasta 2 MiB, una hoja y 100 productos. No se admiten XLS, XLSM, macros, fórmulas ni celdas complejas. Las columnas obligatorias, en este orden, son:

`sku,nombre,tipo,precio,costo,stock,descripcion,imagen`

Tipos: FIGURE, VIDEO_GAME, COLLECTIBLE, CONSOLE, HARDWARE y OTHER. Precio y costo usan pesos CLP enteros, incluyendo valores como 54990. Stock también es entero. Imagen acepta una URL HTTPS o ruta local; puede quedar vacía.

1. Elige crear productos nuevos o actualizar por SKU.
2. Carga el archivo y revisa la tabla: los errores aparecen por fila.
3. Selecciona hasta 25 filas válidas. Revisa el lote y confirma para guardarlo.

La vista previa no modifica productos. Expira después de una hora. Cada vista previa confirma un único lote; para importar más filas vuelve a cargar el archivo. SKU duplicados o ambiguos, packs y preventas deben resolverse en el editor especializado. El stock no puede quedar por debajo del reservado. Actualizar conserva precio normal y especificaciones existentes; una imagen vacía conserva las anteriores. Una imagen indicada reemplaza la lista de imágenes de ese producto.

El servidor vuelve a verificar el catálogo durante la transacción. Si alguien cambió un producto o creó el mismo SKU, rechaza todo el lote con 409. Productos, historial y marca de lote confirmado se guardan juntos. Repetir una confirmación ya realizada no duplica productos.

## Biblioteca de imágenes

En Imágenes puedes subir PNG, JPG o WebP de hasta 5 MiB. El navegador reduce la resolución a un máximo de 1200 píxeles por lado y comprime a WebP hasta 350 KiB. Se rechazan imágenes de más de 20 megapíxeles. El servidor comprueba tamaño, tipo y firma del formato. SVG no se admite.

Puedes buscar por nombre o etiquetas, renombrar, cambiar etiquetas, mover al inicio, copiar la URL y archivar o recuperar. La biblioteca admite hasta 100 imágenes almacenadas. Archivar oculta la imagen de la lista activa; conserva el archivo y su URL para evitar romper productos. No libera capacidad: no existe borrado físico en esta primera versión.

Los editores de producto nuevo y existente incluyen **Biblioteca de imágenes**. Elegir una foto añade su URL al formulario; el producto se modifica al guardar el formulario. Las fotos son públicas mediante `/api/media/[id]`, necesarias para mostrarlas en la tienda. Los metadatos de gestión son privados. La imagen se almacena en Firestore, sin configurar un proveedor adicional de almacenamiento. Esta solución tiene límites deliberados para una biblioteca pequeña; una biblioteca grande requeriría migración a almacenamiento de archivos.

## Laboratorio de la tienda

El laboratorio trabaja sobre la **portada principal**, con sus textos, enlaces, producto destacado y dos colores. Usa el mismo componente de la tienda. Ofrece una vista compacta de 390 píxeles y una vista amplia, además de comparación con la portada publicada. No simula todos los tamaños de navegador ni edita el tema completo.

Guardar crea un borrador privado y deja intacta la portada pública. Publicar exige confirmación y comprueba que la portada no cambió desde la creación del borrador. Si hubo otro guardado, actualiza y crea un nuevo borrador. Si elegiste un producto destacado, debe seguir disponible.

La publicación escribe la portada, el historial y una versión guardada en una sola transacción. Conserva la portada anterior como versión inicial cuando corresponde e invalida la portada pública. Se muestran los últimos 20 borradores; no se eliminan automáticamente los anteriores.

## Asistente de administración

El asistente interpreta consultas como «productos sin imagen», «productos sin descripción», «productos sin stock» o búsquedas por nombre/SKU/tipo. Consulta hasta 1000 productos y devuelve hasta 100 resultados.

**Solo el texto que escribes se envía a Gemini.** El catálogo se filtra dentro del servidor; nombres, precios, stock y clientes del catálogo no se adjuntan a la petición al modelo. La respuesta del modelo se valida contra un esquema cerrado. No ejecuta comandos arbitrarios ni modifica precios, stock o pedidos.

Puedes pedir borradores de descripción para hasta cinco resultados. Se componen localmente con el nombre del producto y una introducción genérica propuesta por el modelo; requieren revisión humana y no acreditan datos técnicos. Se muestra antes/después. Selecciona, revisa y confirma para aplicar. Las propuestas expiran en una hora y la transacción rechaza productos modificados mientras revisabas. Solo cambia la descripción y la fecha de actualización, con historial.

Usa la configuración Gemini existente, App Check y las cuotas persistentes de IA. Una respuesta inválida o un proveedor indisponible muestra error; no se sustituye por una respuesta ficticia. No necesita otra variable de entorno.

## Fichas para redes

Elige un producto para generar una ficha cuadrada (1080 × 1080), vertical (1080 × 1350) o historia (1080 × 1920). Puedes editar la marca, el color de fondo, mostrar u ocultar el precio y elegir otra foto de la biblioteca. Usa el nombre, precio y condición de preventa reales del catálogo.

Descarga PNG o JPG. Se genera en el navegador; no publica en redes sociales ni envía mensajes. Si una imagen externa no autoriza su uso en canvas mediante CORS, el generador lo indica: selecciona una foto de la biblioteca para exportar. La vista solo habilita descargas al completar la generación.

## APIs y datos

| API | Métodos | Uso |
|---|---|---|
| `/api/admin/tools/catalog` | GET | Catálogo privado para laboratorio y fichas |
| `/api/admin/import` | POST | Vista previa o confirmación del lote |
| `/api/admin/media` | GET, POST, PATCH | Listado, subida y metadatos de imágenes |
| `/api/media/[id]` | GET | Archivo raster público por UUID |
| `/api/admin/laboratory` | GET, POST | Portada, borradores, guardado y publicación |
| `/api/admin/assistant` | POST, PATCH | Consulta protegida y aplicación de propuestas |

Colecciones nuevas privadas: `import_jobs`, `media_assets`, `media_blobs`, `media_control`, `visual_drafts`, `assistant_plans`. El acceso directo desde clientes Firestore está denegado por las reglas existentes; solo el servidor accede. La ruta pública de imagen entrega únicamente el binario permitido. Los trabajos y propuestas caducan lógicamente, sin borrado TTL automático; debe considerarse retención si aumenta el uso. Las mutaciones reutilizan `admin_audit` y las publicaciones `visual_versions`.

```mermaid
flowchart LR
  A[Admin autenticado] --> B[Herramientas React]
  B --> C[API con sesión firmada y validación]
  C --> D[Firestore: borradores y biblioteca]
  C --> E[Transacción: productos / portada + historial]
  B --> F[Canvas: descarga PNG/JPG]
  C --> G[App Check y cuotas]
  G --> H[Gemini: solo consulta escrita]
  H --> I[Plan validado]
  I --> J[Filtrado local del catálogo]
  J --> B
```

## Verificación y despliegue

Las pruebas cubren plantillas XLSX reales, CSV, límites, MIME, acceso no autorizado, confirmaciones de interfaz, conflictos y privacidad del asistente. El emulador comprueba permisos y transacciones reales, sin escribir en producción. Despliega el código nuevo en Vercel para ver el menú. No requiere nuevas variables; necesita las credenciales Firebase y Gemini ya configuradas. No se habilitan cobros ni ventas reales.
