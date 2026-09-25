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
