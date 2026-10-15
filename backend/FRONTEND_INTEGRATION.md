# Integración frontend y backend

El frontend usa `VITE_API_URL` (opcional, predeterminado `http://localhost:3000/api`). Las credenciales de MongoDB pertenecen exclusivamente a `backend/.env`.

## Inicio local

Mantén una terminal en `backend` con `npm.cmd run dev` y otra en `frontend` con `npm.cmd run dev`. Abre `http://localhost:5173`. Solo debe haber una instancia de cada servidor por dirección y puerto. `CORS_ORIGINS` admite localhost y 127.0.0.1, separados por coma.

## Pantallas conectadas

- Login, usuarios y roles: `/auth/login`, `/auth/logout`, `/auth/me`, `/users`.
- Inventario: `/products`, `/categories`, `/locations`, `/batches`.
- Kardex: `/movements`, `/movements/product/:id`.
- Ventas: `GET/POST /sales`, `PATCH /sales/:id/cancel`.
- Devoluciones: `GET/POST /returns`, `GET /returns/sale/:id`.
- Caja: `/cash-sessions`, `/cash-sessions/current`, `/cash-sessions/:id`, `POST /cash-sessions/open`, `POST /cash-sessions/close`.
- Configuración: `GET/PUT /settings`.

Los productos conservan `id` numérico y añaden `_id` como cadena para los componentes de ventas. Las ubicaciones, lotes, ventas, devoluciones y cajas también exponen `_id` como cadena. La categoría del producto es su nombre; la ubicación se envía como identificador y se recibe como objeto.

## Reglas aplicadas

- Usuarios autenticados consultan datos, registran ventas y abren caja. Solo existe una caja abierta por farmacia; las demás pueden abrir su propia caja. El usuario que la abrió o un administrador puede cerrarla. La cabecera envía X-Pharmacy-Id para identificar el establecimiento activo.
- Solo administradores cambian configuración, ubicaciones, productos e inventario, anulan ventas y registran devoluciones. Los botones correspondientes respetan el rol.
- Una venta exige caja abierta. Precio, total, cambio y stock se calculan en el servidor. Se utilizan primero los lotes no vencidos con vencimiento más cercano. No se permite stock negativo.
- Cada producto nuevo recibe un lote inicial con sus existencias. Los productos anteriores reciben este registro al consultar lotes o efectuar su primer movimiento. No se inventan compras ni ventas históricas.
- `POST /batches` recibe `product`, `batchNumber`, `stock` y `expirationDate`; registra una entrada y aumenta el stock. La interfaz actual administra movimientos sobre lotes existentes; no incluye una pantalla independiente para crear varios lotes.
- Una venta solo se anula mientras su caja sigue abierta y si no tiene devoluciones. La anulación restaura los lotes originales y registra el movimiento inverso.
- Las devoluciones pueden ser parciales, requieren caja abierta y no superan las unidades vendidas menos las ya devueltas. Restituyen el lote original. Se registran en la caja que está abierta al devolver, aunque la venta pertenezca a una caja anterior.
- El cierre conserva sus totales: fondo inicial + ventas en efectivo - reembolsos en efectivo. La diferencia es efectivo contado menos efectivo esperado.
- Los productos con ventas asociadas no se eliminan para conservar devoluciones e historial. Las ubicaciones en uso tampoco se eliminan.
- El dashboard muestra inventario aunque falle la consulta de ventas, con un aviso en lugar de importes falsos. Antes de iniciar sesión no se consulta la configuración protegida. Una sesión vencida se limpia sin recargar el documento.

Estas funciones completas usan MongoDB. El modo SQLite anterior se conserva para las pruebas de regresión de usuarios y productos.

## Validación

```powershell
npm.cmd test --prefix backend
npm.cmd run lint --prefix frontend
npm.cmd run build --prefix frontend
node --test frontend/test/dashboard.test.js
```

Las pruebas de integración usan MongoDB temporal con replica set y comprueban persistencia, rollback, permisos, lotes, ventas y devoluciones concurrentes y conciliación de caja. No usan las credenciales ni los datos de Atlas.

## Red de farmacias, códigos, fotos y tarjeta de demostración

- GET/POST /pharmacies consulta o crea farmacias. La primera conserva los datos anteriores con el nombre Farmacia principal; no se duplican existencias. Los usuarios y roles pertenecen a la red y pueden operar en la farmacia activa. Esta versión no restringe cuentas a una sucursal concreta.
- Cada farmacia tiene inventario, ubicaciones, movimientos, configuración, ventas, devoluciones y caja propios. Los usuarios autenticados consultan GET /availability?search=... para ver disponibilidad de toda la red por código o nombre, incluyendo solo lotes no vencidos en availableStock. La pantalla se actualiza cada 30 segundos y dispone de actualización manual. Todos los establecimientos usan el mismo servidor y MongoDB; no se ha publicado un servicio externo.
- El código identifica al artículo del catálogo compartido. Se genera ART-000001 o se proporciona uno manual de 3 a 40 caracteres. Un mismo artículo conserva su código entre farmacias; no puede duplicarse en el inventario de una misma farmacia ni cambiarse después de crearlo. Usar Agregar a mi farmacia desde la red precarga su identidad. El nombre es compartido y los precios/existencias son independientes. Los códigos ART- están reservados para generación automática.
- POST /images recibe el archivo binario JPG, PNG o WebP de hasta 3 MB, solo admin. Devuelve imageUrl, que se envía al guardar el producto. Las fotos se conservan en MongoDB y se sirven desde GET /images/:key mediante un identificador aleatorio. El formulario permite previsualizar, reemplazar y quitar la foto. No se necesita una cuenta de almacenamiento externo.
- En Nueva venta, elegir Tarjeta abre un terminal de demostración. Solo permite tarjetas de prueba: aprobación (4242), rechazo (0002), fondos insuficientes (9995). POST /card-payments recibe testCard y los items; calcula el importe en el servidor y devuelve autorización, referencia, marca y últimos cuatro dígitos. No recibe ni almacena PAN completo o CVV, ni realiza solicitudes a bancos.
- El pago aprobado se consume una sola vez al enviar paymentId en POST /sales. Está ligado a usuario, farmacia, caja, artículos, cantidades, precios y caduca a los cinco minutos. Un rechazo, autorización caducada, carrito modificado o venta fallida no descuenta inventario. El comprobante identifica expresamente la simulación. Anular registra una referencia de reverso simulado.
- Para devolver: Devoluciones → Buscar venta para devolver → abrir venta → Registrar devolución → seleccionar cantidades, motivo y método. Solo admin. Se restituye el lote original y se registra el reembolso en la caja activa de la misma farmacia. Tarjeta genera referencia DEMO-REFUND, sin movimiento bancario. El historial de devoluciones conserva el detalle.

Prueba adicional: backend/test/network.test.js verifica migración de datos anteriores, códigos, aislamiento entre farmacias, disponibilidad, fotos y sus permisos, autorizaciones rechazadas/caducadas/reutilizadas, venta con tarjeta, reverso y devolución parcial.
