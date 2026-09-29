# Backend

Node.js >=22.14, Express 5 y driver oficial de MongoDB. Sigue la [guía de instalación](../README.md) para conectar Atlas e inicializar el administrador.

## Variables

| Variable | Valor | Uso |
| --- | --- | --- |
| DATABASE_DRIVER | mongodb | Almacenamiento principal |
| MONGODB_URI | Obligatoria | URI privada de Atlas |
| MONGODB_DATABASE | tu_pharmacy | Base de datos |
| PORT | 3000 | Puerto HTTP |
| HOST | 127.0.0.1 | Interfaz HTTP; usa 0.0.0.0 si tu alojamiento lo requiere |
| CORS_ORIGINS | http://localhost:5173 | Orígenes exactos separados por comas |
| BUSINESS_TIME_ZONE | America/Santo_Domingo en .env.example | Zona para vencimientos |
| SESSION_HOURS | 8 | Duración de sesión, máximo 168 horas |
| ADMIN_NAME / ADMIN_USERNAME / ADMIN_PASSWORD | Sin contraseña predeterminada | Inicialización del administrador |

## Persistencia

`connect.js` selecciona el almacén. `mongo-store.js` administra un único cliente y su pool, crea índices únicos y utiliza transacciones para las operaciones relacionadas. Atlas admite las transacciones requeridas; una instalación local debe ser un replica set.

Se conservan identificadores numéricos y los contratos del frontend. Los precios se almacenan en centavos. Las sesiones tienen un índice TTL para limpieza y se valida su vencimiento en cada petición. La eliminación o edición de cuentas revoca sus sesiones.

Las transacciones toman un bloqueo de escritura común para proteger las reglas que abarcan varios documentos, incluidos el último administrador y los movimientos de stock. Esto prioriza consistencia para el volumen de una farmacia; limita la concurrencia de escrituras.

`DATABASE_DRIVER=sqlite` y `DATABASE_PATH=./data/pharmacy.sqlite` conservan el modo anterior para las pruebas de regresión de usuarios y productos. Categorías y movimientos requieren MongoDB. No se transfieren automáticamente los datos SQLite a Atlas: se conserva el archivo original y Atlas usa su propia base.

## API e inventario

Consulta [API.md](API.md). Las categorías en uso no pueden eliminarse. El historial de movimientos guarda el nombre del producto y del usuario al registrarse y se conserva al eliminar esos registros. Para modificar existencias de un producto en MongoDB se utiliza un movimiento; editar el producto no cambia su stock.

## Operación

El servidor solo abre el puerto después de conectar y crear los índices. Al recibir SIGINT o SIGTERM cierra HTTP y MongoDB. `npm run check-db` permite diagnosticar el acceso sin mostrar credenciales.

El limitador de login funciona por IP y por proceso. Para publicar la aplicación, configura HTTPS en tu alojamiento, el origen del frontend y el acceso de red de Atlas. No hay configuración de despliegue específica incluida.

Documentación oficial: [conexiones del driver](https://www.mongodb.com/docs/drivers/node/current/connect/connection-targets/) y [transacciones](https://www.mongodb.com/docs/drivers/node/current/crud/transactions/).
