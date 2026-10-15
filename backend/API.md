# Contrato HTTP

Base: `http://localhost:3000/api`. Cuerpos JSON con `Content-Type: application/json`; límite 16 KiB. Autenticación: `Authorization: Bearer <token>` en todas las rutas salvo login y health. El token es opaco; no decodificarlo como JWT. Usuarios y contraseñas nunca se devuelven juntos; hashes y tokens almacenados no se exponen.

| Método | Ruta | Permiso | Entrada | Respuesta |
| --- | --- | --- | --- | --- |
| GET | /health | Público | Ninguna | 200 `{status:"ok"}` |
| POST | /auth/login | Público | `{username,password}` | 200 `{token,user}` |
| GET | /auth/me | Ambos roles | Ninguna | 200 usuario actual |
| POST | /auth/logout | Ambos roles | Ninguna | 204, sesión revocada |
| GET | /users | Admin | Ninguna | 200 array de usuarios |
| POST | /users | Admin | `{name,username,password,role}` | 201 usuario |
| PUT | /users/:id | Admin | `{name,username,role,password?}` | 200 usuario; revoca todas sus sesiones |
| DELETE | /users/:id | Admin | Ninguna | 204, elimina usuario y sesiones |
| GET | /products | Ambos roles | Filtros opcionales abajo | 200 array de productos |
| GET | /products/:id | Ambos roles | Ninguna | 200 producto |
| POST | /products | Admin | Producto de entrada | 201 producto y encabezado Location |
| PUT | /products/:id | Admin | Producto completo de entrada | 200 producto |
| DELETE | /products/:id | Admin | Ninguna | 204 |

Usuario de salida:

```json
{"id":1,"name":"Administrador","username":"admin","role":"admin","createdAt":"2026-09-25T16:00:00.000Z"}
```

Nombre: 1–120 caracteres tras recortar espacios. Username: 1–80, letras ASCII, números, punto, guion y guion bajo; se almacena en minúsculas, es único sin distinguir mayúsculas. Password: mínimo 6 caracteres, máximo 256 bytes; no se recorta. Roles admitidos: `admin`, `employee`. El último administrador no puede eliminarse ni pasar a empleado (409). Una edición de usuario conserva su contraseña si se omite `password`.

Producto de entrada, tanto creación como actualización:

```json
{"name":"Paracetamol 500mg","category":"Analgésico","price":12.35,"stock":50,"expirationDate":"2027-03-12"}
```

Nombre: 1–120 caracteres; categoría: texto de 1–80. Se aceptan categorías adicionales porque el PDF no limita el catálogo; el frontend ofrece cuatro. Precio: número no negativo, hasta dos decimales y máximo 9999999.99, conforme a los issues #2 y #7 (el frontend actualmente exige >0). Stock: número entero entre 0 y 2147483647. Fecha: fecha calendario real `YYYY-MM-DD`, obligatoria y posterior al día actual al crear/editar, como valida el frontend. Productos ya almacenados pueden vencer y seguir apareciendo.

Salida: todos los campos de entrada más `id` numérico, `createdAt`, `updatedAt`, `lowStock`, `daysUntilExpiration`, `expired`, `expiringSoon`, `availableForSale`. Ejemplo de propiedades calculadas: stock <=5 implica `lowStock=true`; los días se calculan en `BUSINESS_TIME_ZONE` sin convertir la fecha del medicamento a hora local del navegador.

Convención de fecha: un producto se considera vencido después de su fecha (`daysUntilExpiration < 0`), en concordancia con la comparación del frontend. Próximo a vencer: entre 0 y 29 días, conforme a «menos de 30 días» del PDF. `availableForSale` es falso con stock cero o fecha vencida; es un indicador, no una operación de venta. No se ha creado un módulo de ventas.

Filtros de `GET /products` combinados con AND:

| Parámetro | Ejemplo | Regla |
| --- | --- | --- |
| search | `?search=paracetamol` | Coincidencia parcial sin distinguir mayúsculas en nombre o categoría; hasta 120 caracteres |
| category | `?category=Analg%C3%A9sico` | Coincidencia exacta sin distinguir mayúsculas; hasta 80 caracteres |
| lowStock | `?lowStock=true` | Stock <=5; `false` aplica el inverso |
| expiringSoon | `?expiringSoon=true` | Solo admin; 0–29 días; `false` aplica el inverso |
| expired | `?expired=true` | Fecha anterior a hoy; `false` aplica el inverso |

Se rechazan filtros desconocidos, repetidos o booleanos distintos de `true`/`false`. El listado sin filtros devuelve todos los productos por id descendente, compatible con el frontend y HU12; `expiringSoon=true` ordena por fecha de vencimiento más cercana y luego por id, como pide el issue #14. No hay paginación en este MVP.

Errores:

```json
{"message":"Datos no válidos.","errors":{"stock":"Stock entero entre 0 y 2147483647."}}
```

`message` está siempre presente; `errors` es opcional. Códigos: 400 validación o JSON inválido; 401 credenciales/sesión inválidas; 403 rol u origen no autorizado; 404 recurso/ruta inexistente; 409 username duplicado o protección del último admin; 413 cuerpo demasiado grande; 429 demasiados intentos de login (incluye Retry-After); 500 error interno sin detalles sensibles. Respuestas 204 no tienen cuerpo.

## Categorías y movimientos (MongoDB)

| Método | Ruta | Acceso | Respuesta |
| --- | --- | --- | --- |
| GET | /categories | Sesión | Array de `{id,name}` |
| POST | /categories | Admin | 201, `{id,name}`; recibe `{name}` |
| DELETE | /categories/:id | Admin | 204; 409 si tiene productos |
| GET | /movements | Sesión | Array de movimientos, más recientes primero |
| GET | /movements/product/:id | Sesión | `{product:{id,name,stock},movements:[]}` |
| POST | /movements | Admin | 201; registra movimiento y actualiza stock |

Un movimiento recibe `{product:"1",type:"entrada",quantity:5,reason:"Compra"}`. El tipo puede ser `entrada` o `salida`; la cantidad es un entero positivo. Devuelve 409 si la operación deja stock negativo o supera el máximo. Cada registro del historial incluye `id`, `product`, `user`, `type`, `quantity`, `reason`, `previousStock`, `newStock` y `createdAt`.

En MongoDB, `PUT /products/:id` permite omitir `stock` para conservarlo. Si se envía un stock distinto al actual, responde 409: los cambios de existencias se registran mediante movimientos.

## Red de farmacias, artículos, fotos y tarjeta simulada (MongoDB)

Las peticiones autenticadas pueden enviar `X-Pharmacy-Id`, con valor predeterminado `1`. Productos, ubicaciones, movimientos, configuración, caja, ventas y devoluciones se filtran por esa farmacia. Las cuentas y categorías pertenecen a la red compartida.

| Método | Ruta | Contrato |
| --- | --- | --- |
| GET | /pharmacies | Farmacias de la red |
| POST | /pharmacies | Admin; `{name,address,phone}` |
| GET | /availability?search=... | `{updatedAt,articles:[{code,name,imageUrl,category,pharmacies:[]}]}`; disponibilidad de toda la red |
| POST | /images | Admin; archivo binario con Content-Type image/jpeg, image/png o image/webp, máximo 3 MB; devuelve `{imageUrl}` |
| GET | /images/:key | Foto por identificador aleatorio, sin token |
| POST | /card-payments | `{testCard,items:[{product,quantity}]}`; testCard: approved, declined o insufficient. 201 aprobado, 402 rechazado |

Los productos reciben `code`, `imageUrl`, `pharmacyId` y `availableStock`. El código es único para el artículo compartido e inmutable; solo hay un registro de ese código por farmacia. La foto se carga antes de guardar el producto. La disponibilidad excluye lotes vencidos aunque estos sigan formando parte del stock total.

POST /sales con paymentMethod card exige paymentId aprobado, del mismo usuario/farmacia/caja y carrito. Caduca en cinco minutos y solo se consume una vez. El resultado incluye payment con simulated, reference, authorizationCode, brand, last4, amount y status. No se reciben números de tarjeta ni CVV. Rechazos y errores no descuentan stock. Las devoluciones con tarjeta incluyen refundReference y las anulaciones registran un reverso simulado. No existe conexión con bancos ni cargos reales.

## Ventas, caja, devoluciones y configuración (MongoDB)

Todas las rutas requieren sesión. `PATCH` está permitido en las solicitudes CORS.

| Método | Ruta | Acceso / datos |
| --- | --- | --- |
| GET / PUT | /settings | Lectura con sesión; escritura admin. Campos: pharmacyName, rnc, phone, email, address, receiptMessage, currency, currencySymbol |
| GET / POST | /locations | Lectura con sesión; creación admin con section, shelf, level |
| PUT / DELETE | /locations/:id | Admin; no se elimina una ubicación con productos |
| GET | /batches | Lotes de todos los productos |
| GET | /batches/product/:id | Lotes del producto |
| POST | /batches | Admin: product, batchNumber, stock, expirationDate; registra entrada |
| GET / POST | /sales | Historial; creación con items:[{product,quantity}], paymentMethod, amountReceived |
| PATCH | /sales/:id/cancel | Admin; caja de la venta abierta y sin devoluciones |
| GET / POST | /returns | Historial; creación admin con saleId, items:[{productId,quantity}], reason, refundMethod |
| GET | /returns/sale/:id | Devoluciones de una venta |
| GET | /cash-sessions | Historial de cajas |
| GET | /cash-sessions/current | Caja abierta y summary; null si no existe |
| GET | /cash-sessions/:id | Detalle y totales de una caja |
| POST | /cash-sessions/open | openingAmount; 409 si ya existe una caja abierta |
| POST | /cash-sessions/close | countedCash; cierra el usuario que abrió o un admin |

Medios de pago/reembolso: cash, card, transfer. Las cantidades son enteros positivos. Los importes se validan a dos decimales y se calculan en centavos. La venta requiere caja abierta; el servidor calcula precios, total y cambio. Los lotes vencidos se excluyen de las ventas. Los conflictos de stock, devoluciones excesivas y transiciones de caja inválidas responden 409.

Los recursos nuevos incluyen id numérico, _id como cadena y createdAt. Los productos añaden _id y location como objeto o null. POST/PUT de producto acepta location como identificador. Los movimientos aceptan batch para aplicar la variación a un lote concreto.

El cierre devuelve salesCount, unitsSold, totalSales, cashSales, cardSales, transferSales, returnsCount, totalRefunds, cashRefunds, cardRefunds, transferRefunds, expectedCash, countedCash y difference, además de los datos de apertura/cierre. La caja abierta incluye sus totales actuales dentro de summary. El cierre conserva los totales históricos. Véase FRONTEND_INTEGRATION.md para las reglas de anulación, devoluciones y conservación de historial.
