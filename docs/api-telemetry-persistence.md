# Persistencia de consumo de APIs

El servidor guarda cada llamada en `kpi_snapshots/api_telemetry_store/events/{id}` con Firebase Admin. Los registros antiguos del documento principal siguen incluidos sin duplicados. La memoria y los archivos locales son solo una alternativa de desarrollo; `/tmp` de Vercel no conserva datos entre instancias.

En Vercel, configurar `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` de la cuenta de servicio del proyecto existente. Son secretos exclusivos del servidor: no usar el prefijo `NEXT_PUBLIC_`. La cuenta debe tener permisos de lectura y escritura de Firestore. El inicializador admite saltos de línea escapados en la clave privada.

Sin conexión persistente, el panel muestra un error en lugar de un historial vacío. Las fallas de telemetría no bloquean compras ni respuestas de IA; se registran en los logs del servidor.

Verificación posterior al despliegue: ejecutar una función de IA, consultar el panel, recargar y comprobar el mismo evento, tokens y costo. Cambiar el período solo filtra la vista. No usar “Limpiar historial” para actualizar. Las cuotas y costos son referencias estimadas, no datos de facturación de Google.

Las pruebas automatizadas cubren recargas y reinicios sin caché, escrituras concurrentes, compatibilidad del historial anterior, borrado persistente y errores de conexión. La prueba con Firestore está aislada y no modifica la base desplegada.
