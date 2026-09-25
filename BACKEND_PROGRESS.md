# Avance backend — 2026-09-25

## Fuentes y alcance verificados

- PDF local `Spring Talendig - copia (1).pdf`: leído íntegramente, 5 páginas, mediante pypdf instalado únicamente en `.tools/python`.
- Frontend React/Vite: servicios, autenticación, roles, formularios, pantallas, filtros, constantes y configuración de ejemplo revisados. Contrato actual en `http://localhost:3000/api`.
- Repositorio indicado por el usuario: https://github.com/GravielPV/Grupo-I. Rama remota observada: `main`, commit `3ca58ff8b3a18e64870980e085294dc9390f7f2b`.
- Historial consultado mediante copia bare en `.tools/upstream.git`: corrección de useEffect (`3ca58ff`), protección de rutas y eliminación propia de admin (`d481544`), formatos (`f7f94fc`), login y creación de usuarios (`b4a743d`).
- La carpeta de trabajo es una copia sin `.git`. No se inicializó ni reemplazó el repositorio, no se crearon commits ni se hizo push o merge. Los issues trabajados quedan abiertos; ver la incidencia de cierre automático abajo. Las actualizaciones del tablero no publican el código.
- Autenticación inicialmente ausente y luego sin permiso Projects; el usuario completó la autorización durante la sesión. Cuenta activa observada: GravielPV. Se consultaron `gh project list`, `view`, `field-list`, `item-list` y los 19 issues, incluidos comentarios de alcance/base.
- [Project 1](https://github.com/users/GravielPV/projects/1): privado, 19 elementos. Campo Status con valores Todo, In progress, Under review, Done. No hay responsables ni valores de prioridad/iteración/fechas asignados a los elementos consultados; los sprints, prioridades obligatorias/opcionales y dependencias están en los cuerpos de los issues. No se asignaron tareas a personas ni se inventaron fechas.
- Se distinguió #4 (autenticación backend) de #5 (pantalla de login y navegación frontend). #5 no se modificó. Las demás historias mezclan entregables API e interfaz; se conserva In progress cuando queda aceptación de interfaz.

## Plan aplicado

1. Sprint 1: persistencia, inicio de sesión y permisos, crear/eliminar usuarios, agregar/listar productos.
2. Sprint 2: editar/eliminar productos, stock, búsqueda y vencimientos.
3. Complemento explícito del rol admin: editar usuarios.
4. Pruebas HTTP, persistencia, compilación y lint del frontend; documentación de integración.

## Funcionalidades implementadas localmente

Estos estados describen la implementación backend; no equivalen a aceptación E2E del sistema completo. El estado final del Project y sus enlaces se registra abajo.

| Historia PDF | Sprint | Implementación backend | Evidencia |
| --- | --- | --- | --- |
| HU01 Login | 1 | Implementada | Login admin/employee, hash scrypt, Bearer opaco, sesiones persistidas con caducidad, logout y /me |
| HU02 Crear usuario | 1 | Implementada | Solo admin, validación, username único, respuesta sin secretos |
| HU03 Eliminar usuario | 1 | Implementada | Solo admin, revocación inmediata, protección del último admin |
| HU04 Agregar producto | 1 | Implementada | Nombre, categoría, precio, stock y vencimiento obligatorios |
| HU12 Listado | 1 | Implementada | Array completo con contrato compatible, lectura autenticada |
| HU05 Editar producto | 2 | Implementada | PUT completo, validación y persistencia |
| HU06 Eliminar producto | 2 | Implementada | DELETE admin, 204 y 404 según corresponda |
| HU07 Stock | 2 | Implementada | Stock entero >=0, indicador/filtro bajo <=5 como frontend |
| HU08 Búsqueda | 2 | Implementada | Nombre o categoría, filtros combinables |
| HU09 Vencimiento | 2 | Implementada | Fecha calendario real, obligatoria y futura al escribir |
| HU10 Próximos a vencer | 2 | Implementada en API | Filtro admin, 0–29 días; pendientes ajustes visuales frontend |
| HU11 Alerta/bloqueo de venta (opcional) | 3 | Parcial | Estado expired y availableForSale; no existe flujo de ventas donde aplicar bloqueo |
| Edición de usuarios, descripción del rol | Sin HU propia | Implementada en API | PUT admin; revoca sesiones; falta pantalla frontend |

Infraestructura: Express 5, SQLite con migración versionada, claves foráneas y restricciones, precios en centavos, CORS limitado por entorno, errores JSON, límite de cuerpo, limitador de login, bootstrap sin contraseña predeterminada, `.env.example` y `.gitignore`.

## Seguimiento final de GitHub Projects

Se publicaron comentarios con alcance, pruebas y pendientes en cada issue trabajado. Cada comentario aclara que el código permanece local y no hay push ni commits. Los elementos trabajados pasaron primero a In progress una vez recuperado el acceso al Project; la implementación inicial había avanzado durante el bloqueo de autenticación, que quedó registrado en este informe.

| Issue | Estado del Project | Evidencia / pendiente |
| --- | --- | --- |
| [#2 Modelo y migraciones](https://github.com/GravielPV/Grupo-I/issues/2#issuecomment-5838524496) | Done | Migración desde cero, persistencia, usuarios y datos ficticios de prueba verificados |
| [#3 Crear usuarios](https://github.com/GravielPV/Grupo-I/issues/3#issuecomment-5838525084) | Done | Alta, login nuevo empleado, hash, duplicados y permisos verificados |
| [#4 Autenticación backend](https://github.com/GravielPV/Grupo-I/issues/4#issuecomment-5838525783) | Done | Sesión, roles, errores, caducidad y logout verificados |
| [#6 Revocar usuarios](https://github.com/GravielPV/Grupo-I/issues/6#issuecomment-5838526507) | Done | Usuario eliminado pierde login y sesión previa; último admin protegido |
| [#7 Alta productos](https://github.com/GravielPV/Grupo-I/issues/7#issuecomment-5838527103) | In progress | API terminada; formulario debe admitir precio cero y aceptación visual pendiente |
| [#8 Listado](https://github.com/GravielPV/Grupo-I/issues/8#issuecomment-5838527695) | In progress | API terminada; aceptación visual pendiente |
| [#9 Edición](https://github.com/GravielPV/Grupo-I/issues/9#issuecomment-5838528306) | In progress | API terminada; aceptación de formulario/refresco pendiente |
| [#10 Eliminación](https://github.com/GravielPV/Grupo-I/issues/10#issuecomment-5838529107) | In progress | API terminada; probar confirmación/cancelación en navegador |
| [#11 Stock](https://github.com/GravielPV/Grupo-I/issues/11#issuecomment-5838529785) | In progress | API terminada; aceptación de indicadores visuales pendiente |
| [#12 Búsqueda](https://github.com/GravielPV/Grupo-I/issues/12#issuecomment-5838530497) | In progress | API terminada; aceptación E2E pendiente |
| [#13 Fechas](https://github.com/GravielPV/Grupo-I/issues/13#issuecomment-5838531068) | In progress | API conserva día; corregir cálculo/presentación frontend |
| [#14 Próximos vencimientos](https://github.com/GravielPV/Grupo-I/issues/14#issuecomment-5838531625) | In progress | Filtro y orden backend terminados; alinear dashboard/insignia |
| [#15 HU11 opcional](https://github.com/GravielPV/Grupo-I/issues/15#issuecomment-5838532244) | In progress | Indicadores y dependencia documentados; validación visual pendiente |
| [#18 Documentación y demo](https://github.com/GravielPV/Grupo-I/issues/18#issuecomment-5838532843) | In progress | Guías completas; ensayo E2E y entrega remota pendientes |
| [#19 Alcance](https://github.com/GravielPV/Grupo-I/issues/19#issuecomment-5838533401) | In progress | Decisiones locales comunicadas; acuerdos del equipo pendientes |

No se alteraron #1, #5, #16 ni #17. Los cuatro Done representan criterios cumplidos y probados en el entorno local; los issues permanecen abiertos y la publicación del código necesita autorización del usuario.

Incidencia de seguimiento: tras mover #2, #3, #4 y #6 a Done, la verificación detectó los cuatro issues CLOSED, aparentemente por automatización del Project. No se ejecutó `gh issue close`. Se reabrieron explícitamente los cuatro con `gh issue reopen` para respetar la instrucción de no cerrar issues. No se cambió la configuración global del tablero.

## Decisiones y diferencias documentadas

- PDF, código previo e issues no definen framework ni motor backend. Se eligió Node.js/Express/SQLite para aprovechar JavaScript y no exigir otro servicio. El issue #19 deja pendiente acordar tecnología con el equipo; la decisión local se comunica allí sin atribuir un acuerdo inexistente.
- El PDF pide editar usuarios en la descripción del administrador, pero solo enumera HU de creación/eliminación; se añadió el endpoint sin alterar frontend.
- HU10 establece menos de 30 días. El frontend cuenta hasta 30 inclusive. La API aplica 0–29 días.
- El frontend interpreta fechas sin hora como UTC antes de normalizarlas a hora local, con posible desfase de un día. La API usa días calendario y zona configurable. Convención adoptada: vencido si su fecha es anterior a hoy.
- Fecha futura al crear/editar, stock bajo <=5 y contraseña de mínimo 6 caracteres siguen las validaciones/constantes del frontend; no son umbrales explícitos del PDF.
- Las categorías no están limitadas por el PDF; la API acepta texto no vacío y admite las cuatro del frontend.
- Los issues #2 y #7 exigen precio no negativo: la API admite cero. El formulario frontend exige >0 y muestra cero como vacío al editar; ajuste documentado para su responsable.
- El issue #14 añade orden por vencimiento más cercano; implementado para `expiringSoon=true` y probado.
- El issue #1 está cerrado pero su elemento figura In progress; no se cambió el estado del issue ni se reabrió.
- HU11 no se declara terminada: no se inventó un módulo de ventas para una historia opcional sin flujo definido.

## Pruebas y resultados

- `npm --prefix backend install`: instalación correcta; auditoría informó 0 vulnerabilidades.
- `npm --prefix backend test`: **14/14 pruebas pasaron en la regresión final**, sin fallos, incluyendo precio cero y orden de vencimiento. Cubren HTTP real, roles, contraseñas, tokens, revocación, último admin, CRUD, validaciones, filtros, límites 0/29/30 días, CORS, JSON, tamaño de solicitud, limitación de login, persistencia, migración idempotente y bootstrap. También verifican login del usuario creado, rechazo de login tras eliminarlo, conservación del registro ante edición inválida, cambio de fecha y filtros combinados.
- `node --test backend/test/bootstrap.test.js`: también pasó individualmente; requiere credenciales, inicializa una vez y rechaza sobrescribir usuarios.
- `npm --prefix frontend ci`: instalación desde lockfile correcta; auditoría informó 0 vulnerabilidades.
- `npm --prefix frontend run build`: pasó, Vite compiló 121 módulos.
- `npm --prefix frontend run lint`: pasó sin errores.
- Comparación de 53 archivos frontend con el commit remoto `3ca58ff`: ninguno diferente.
- No se realizó prueba E2E en navegador ni aceptación visual del equipo. No se declara terminado el sprint 4.
- No se crearon cuentas ni medicamentos en una base de desarrollo real. Las pruebas usan bases aisladas y credenciales solo de prueba.

## Pendientes y próximos pasos

1. Completar la revisión del equipo sobre stack, edición de usuarios y asignaciones del issue #19.
2. Verificar la integración/aceptación visual de las historias mixtas antes de pasarlas a Done; los criterios frontend no se consideran cubiertos por pruebas API.
3. Convertir el trabajo local en cambios sobre un checkout Git conservando los archivos del compañero. La copia bare de investigación no convierte esta carpeta en un checkout. No hay commits ni cambios remotos.
4. Crear el administrador local siguiendo `backend/README.md`, iniciar API y frontend, realizar demo/E2E con ambos roles.
5. Aplicar por el responsable frontend los ajustes descritos en `backend/FRONTEND_INTEGRATION.md`: fechas, límite de 30 días, rol del resumen, logout remoto y edición de usuarios.
6. Decidir con los criterios reales del tablero cómo aceptar HU11, sin asumir que un indicador sustituye un bloqueo de venta.

## Archivos de referencia

- `backend/README.md`: instalación, entorno, arquitectura y comandos.
- `backend/API.md`: rutas, métodos, entradas, respuestas y errores.
- `backend/FRONTEND_INTEGRATION.md`: compatibilidad y cambios mínimos pendientes.
- `backend/test/`: pruebas reproducibles.

No se modificaron pantallas ni servicios del frontend. Las herramientas descargadas en `.tools`, dependencias y artefactos `frontend/dist` están excluidos de Git.
