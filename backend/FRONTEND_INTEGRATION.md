# Integración sin cambiar las pantallas

El frontend existente usa `VITE_API_URL=http://localhost:3000/api`, Bearer desde `pharmacy_token`, `{token,user}` en login, arrays directos para productos y usuarios, y `error.response.data.message`. Esos contratos se mantienen. No se modificó código ni configuración existente del frontend.

Pendientes para el responsable frontend:

1. Vencimientos: `src/utils/expiration.js` hace `new Date("YYYY-MM-DD")`, que se interpreta como UTC y puede desplazar la fecha un día al aplicar hora local. Consumir `daysUntilExpiration`, `expired` y `expiringSoon` del backend evita ese error y unifica la zona horaria de la farmacia. Para mostrar la fecha, tratarla como fecha calendario, sin convertirla desde UTC.
2. `Dashboard.jsx` y `ExpirationBadge.jsx` usan <=30; el PDF HU10 dice menos de 30. Utilizar `expiringSoon` o un filtro `GET /products?expiringSoon=true` para admin. El dashboard hoy muestra ese resumen a ambos roles; HU10 lo asigna al administrador.
3. `AuthProvider.jsx` hace logout solo en localStorage. Llamar `POST /auth/logout` antes de limpiar la sesión permite revocarla inmediatamente en el servidor. Al abrir una sesión guardada, `GET /auth/me` permite comprobar su vigencia y rol actual.
4. Edición de usuarios: el PDF la menciona en la descripción del administrador, aunque no tiene HU separada. Ya existe `PUT /users/:id`; falta servicio/formulario frontend. Si el administrador se edita a sí mismo, debe iniciar sesión de nuevo.
5. Mantener precio numérico con hasta dos decimales y stock entero; los issues #2 y #7 permiten precio cero, mientras `ProductForm.jsx` exige >0 y usa `initialData.price || ""`, que oculta el cero. Ajustar a precio >=0 y `initialData.price ?? ""` para admitir ese caso. El backend replica la validación de fecha futura del formulario. El backend permite categorías no vacías adicionales; ampliar el select queda a decisión del equipo, no es requisito nuevo.

Flujo manual de demo: inicializar administrador, login, crear empleado y producto, editar precio/stock, buscar por nombre/categoría, abrir sesión de empleado y comprobar que solo consulta, eliminar empleado desde admin y verificar rechazo de su token. El API cubre esos permisos aunque se manipulen las rutas o localStorage.

HU11 sigue parcial: el API aporta el estado de caducidad y el frontend ya tiene una insignia visual, pero no existe un flujo de ventas donde bloquear una venta. No debe marcarse esa historia como terminada ni inventarse facturación para completarla.
