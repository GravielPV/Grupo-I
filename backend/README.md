# Backend de Tu Pharmacy

API local para las historias obligatorias del PDF `Spring Talendig - copia (1).pdf`, páginas 1–5. Node.js >=22.14, Express 5 y SQLite integrada en Node. El documento no impone tecnología backend; se eligió Node por el entorno JavaScript existente y SQLite para persistir sin instalar un servidor adicional. En Node 22.14 `node:sqlite` emite un aviso experimental. El contenido del PDF no exige Java ni Spring.

## Ejecutar en Windows / PowerShell

Desde la raíz del proyecto:

```powershell
cd backend
npm ci
Copy-Item .env.example .env
```

Edita `.env`: define `ADMIN_NAME`, `ADMIN_USERNAME` y una contraseña propia en `ADMIN_PASSWORD`. No hay credenciales predeterminadas ni usuarios de demostración. Después:

```powershell
npm run bootstrap-admin
npm start
```

`bootstrap-admin` solo permite inicializar una base sin usuarios. No restablece claves ni sobrescribe cuentas. Después de crear el administrador, elimina `ADMIN_PASSWORD` de `.env`; el servidor no la necesita. Usa la API autenticada para crear otros usuarios. La base se crea automáticamente en `backend/data/pharmacy.sqlite`; la migración SQL se ejecuta una vez al abrirla.

En otra terminal:

```powershell
cd frontend
npm ci
npm run dev
```

El frontend ya incluye `.env.example` con `VITE_API_URL=http://localhost:3000/api`. Si no tienes `.env`, copia ese ejemplo. Si ya existe, comprueba localmente ese valor sin sobrescribirlo. Abre `http://localhost:5173` e ingresa con el administrador creado. Si Vite elige otro puerto, añádelo a `CORS_ORIGINS` y reinicia el backend.

## Configuración

| Variable | Valor por defecto | Uso |
| --- | --- | --- |
| PORT | 3000 | Puerto HTTP |
| HOST | 127.0.0.1 | Interfaz local |
| DATABASE_PATH | ./data/pharmacy.sqlite | Ruta relativa al directorio desde donde arranca Node |
| CORS_ORIGINS | http://localhost:5173 | Orígenes exactos separados por comas, sin barra final |
| BUSINESS_TIME_ZONE | America/La_Paz | Día calendario usado para vencimientos; ajustar a la farmacia |
| SESSION_HOURS | 8 | Duración de la sesión; mayor que 0 y hasta 168 |

`npm start` y `npm run dev` cargan `.env`. Las variables del proceso tienen precedencia. Los archivos `.env`, bases, dependencias y herramientas de trabajo están excluidos de Git.

## Arquitectura y datos

- `src/app.js`: rutas HTTP, autorización, operaciones de inventario y manejo central de errores. Inyección de base y reloj para pruebas.
- `src/security.js`: hash scrypt con sal aleatoria, comparación constante y tokens aleatorios de 256 bits. Solo se guarda SHA-256 del token de sesión.
- `src/validation.js`: contratos de entrada y errores públicos.
- `src/database.js`, `migrations/001_initial.sql`: persistencia SQLite, claves foráneas, restricciones, índices y versión de esquema.
- `src/config.js`, `src/server.js`, `src/bootstrap.js`: entorno, arranque y creación inicial del administrador.

Relaciones: `users` tiene muchas `sessions`, con eliminación en cascada; `products` es independiente. El PDF describe un vencimiento por producto, sin lotes, ventas, proveedores ni facturación. Precio almacenado como entero en centavos, representado como número en la API. Stock entero no negativo. Las operaciones de usuario que afectan al último administrador son transaccionales.

## Pruebas

```powershell
cd backend
npm test
```

Las pruebas realizan peticiones HTTP reales a un puerto temporal, con bases aisladas, y verifican roles, sesiones, usuarios, productos, filtros, fechas, errores, CORS y persistencia. No acceden a la base de desarrollo. Consulta los resultados y pendientes en `../BACKEND_PROGRESS.md`.

## Integración

Los servicios existentes funcionan sin cambios: login devuelve `{token,user}`, los listados devuelven arrays, los objetos conservan nombres camelCase y roles `admin`/`employee`. Ver [API.md](API.md) para todos los contratos y [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) para los ajustes pendientes del frontend.

El limitador de login es por IP, 20 intentos por 15 minutos, en memoria de una instancia; se reinicia con el proceso. No se confía en `X-Forwarded-For`. El diseño está orientado a la ejecución local del proyecto. Las sesiones sí persisten entre reinicios. La eliminación de usuarios revoca sus sesiones y cualquier edición exige volver a iniciar sesión.
