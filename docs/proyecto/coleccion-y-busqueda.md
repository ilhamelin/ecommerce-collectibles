# Mi colección y lista de búsqueda

## Dónde encontrarlo

Inicia sesión y entra en **Mi cuenta → Mi colección** (`/account?tab=collection`) o **Busco una pieza** (`/account?tab=wanted`). Estas secciones son independientes de favoritos y de los pedidos. No implican compras, cobros ni cambios de inventario.

Mi colección funciona como una vitrina privada. Admite piezas propias y productos vinculados al catálogo. Guarda nombre, categoría, universo/franquicia, edición, conservación, URL HTTPS de foto y notas. Permite editar, filtrar por nombre/universo/edición, categoría y conservación, y eliminar con confirmación.

Busco una pieza añade un presupuesto máximo opcional en CLP. **Ya la tengo** traslada la misma entrada a la colección, sin duplicarla ni alterar productos. Se puede modificar luego su conservación y foto. Límite: 60 entradas por lista.

## Sugerencias y avisos

Una entrada vinculada busca el ID exacto del producto. Una entrada propia compara todos los términos significativos del nombre y la edición, normalizando acentos y puntuación; también limita por categoría salvo Otra pieza. Universo y notas son metadata personal, no una identificación por IA.

Se excluyen preventas y productos sin stock disponible (stock menos reservado, o stock calculado). Se respeta el presupuesto, si existe. Hasta seis sugerencias por búsqueda, ordenadas por precio. Son aproximaciones por nombre, no certificaciones de que fabricante, variante o edición sean idénticos: comprobar la ficha antes de decidir.

El **Centro de notificaciones** añade avisos de búsquedas con sugerencias. Se calculan al consultar/actualizar las listas o el centro, sobre el catálogo actual. No hay tareas de fondo, correo, push ni monitor continuo. El ID del aviso se mantiene para el mismo conjunto de sugerencias, conservando la lectura. Si se agota el producto o se traslada/elimina la búsqueda, el aviso desaparece del feed actual.

## API y almacenamiento

`/api/users/collector`: GET devuelve `{success,data:{entries,matches,catalogAvailable}}`. POST crea `{kind,entry}`; PATCH modifica `{id,kind,entry}` (incluye traslado); DELETE usa `?id=UUID`. kind es COLLECTION o WANTED.

La identidad proviene de un token Firebase verificado o sesión administrativa firmada. Nunca se acepta UID/email/propietario del cuerpo. El propietario se obtiene mediante SHA-256 de `uid:UID` (o `email:correo` para sesión administrativa). Se guarda en `collector_profiles/{hash}` un documento con entries y updatedAt. Todas las respuestas son private/no-store.

Las escrituras de listas son transaccionales: evitan que dos guardados simultáneos sobrescriban entradas. Una eliminación/edición exige que el UUID exista en la lista de ese propietario. JSON estricto, longitudes acotadas, presupuesto entero positivo y fotos HTTPS (o rutas locales) protegen el contrato. No se guardan secretos, fotos binarias ni HTML ejecutable. La URL de foto se carga en el navegador con referrerPolicy=no-referrer; no se descarga desde el servidor ni se garantiza permanencia del alojamiento externo.

La colección es solo de servidor: las reglas actuales deniegan lectura/escritura directa desde el SDK cliente. No requiere cambiar reglas ni crear índices. La eliminación de cuenta retira los documentos asociados al ID del perfil, al correo de sesión y al UID verificado de quien elimina su propia cuenta. No fusiona automáticamente una colección de administrador basada en correo con otra de Firebase basada en UID.

Si Firebase no está disponible, se muestra error y no se anuncia un guardado ficticio/local. Una caída del catálogo no bloquea guardar piezas propias: catalogAvailable=false indica que las sugerencias no pudieron comprobarse. Un producto vinculado debe existir cuando se guarda; si fue eliminado, desvincularlo y conservar la pieza propia. Las piezas personales no se borran al retirar productos del catálogo.

## Configuración y pruebas

Utiliza las credenciales Firebase existentes. No introduce variables, proveedores ni bibliotecas nuevos. Desplegar el código actualizado para ver las pestañas. Los modos de prueba de pago permanecen independientes de estas funciones.

Pruebas de validación, propiedad, edición/eliminación, traslado, coincidencias, presupuesto, inventario, fallos y UI; el emulador comprueba guardados simultáneos sin pérdidas. Ningún test crea piezas en la base productiva.
