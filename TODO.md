# TODO — fichita-employes-register (Admin Panel + Backend)

> Archivo generado automáticamente para que una nueva sesión continúe el trabajo.
> Última revisión: 2026-08-24

---

## 🔴 Crítico (hacer primero)

### 1. Corregir nombre de archivo `pagest.tsx`
- **Archivo**: `src/app/dashboard/users/pagest.tsx`
- **Acción**: Renombrar a `page.tsx` (typo — falta la 'r' de 'pages' o sobra la 't')
- **Veredicto**: La página es un placeholder ("Pendiente: administración de usuarios y roles"). Si no se va a implementar, **eliminarla del sidebar y el archivo completo**. Si sí, renombrar y desarrollar.

### 2. Tardanzas hardcodeadas a 0
- **Archivo**: `src/app/dashboard/dashboard/page.tsx` línea 50 y `src/actions/attendanceActions.ts` línea 420
- **Problema**: `tardanzasSemanales: 0` está hardcodeado. El tipo `DashboardStats` lo incluye pero nunca se calcula.
- **Acción**: Implementar el cálculo de tardanzas. Lógica: comparar `timestamp` de la primera ENTRADA del día contra la `entryTime` del turno asignado al empleado. Si la diferencia es > tolerance (ej: 5 min), contar como tardanza. Requiere:
  - Verificar si `TurnService` tiene la lógica de turnos por empleado
  - Si los turnos no están asignados a empleados (falta UI para eso), primero implementar asignación de turnos

---

## 🟡 Importante (segundo orden)

### 3. CRUD de Ubicaciones/Sedes
- **Modelo existe**: `src/backend/models/Location.ts` (name, lat, lng, radiusMeters, address, active)
- **Repositorio existe**: `src/backend/repositories/LocationRepository.ts`
- **Falta**: Página en el admin para crear/editar/eliminar ubicaciones. Actualmente las sedes se crean directo en la DB.
- **Acción**: Crear `src/app/dashboard/locations/page.tsx` con:
  - Lista de ubicaciones (tabla desktop + cards mobile)
  - Formulario de creación (nombre, dirección, lat/lng con mapa o búsqueda, radio en metros)
  - Editar/eliminar ubicación
  - Agregar al sidebar en `src/components/Sidebar/menuItems.ts`

### 4. UI de Asignación de Turnos a Empleados
- **Servicio existe**: `src/backend/services/TurnService.ts` tiene `computeHours()` y `getRange()`
- **Falta**: Formulario para que el admin defina los horarios de entrada/salida de cada empleado por día de la semana
- **Impacto**: Sin esto no se pueden calcular tardanzas (punto 2) ni mostrar turnos al empleado en la app mobile
- **Acción**: Crear modal o página dentro de empleados para asignar turnos

### 5. UI de Invitaciones (Invite Employee)
- **Acción existe**: `src/actions/inviteActions.ts` — crea usuario en Supabase y lo vincula al empleado
- **Falta**: Botón/formulario en la página de empleados para invitar (asignar email + password al empleado)
- **Acción**: Agregar componente `InviteEmployeeButton` en `src/components/employees/` que use la action existente. Mostrar solo para empleados sin `authUserId`.

### 6. Página de Settings/Configuración
- **API existe**: `src/app/api/settings/photo-requirement/route.ts` — toggle para requerir foto en check-in
- **Falta**: Página en el admin para manage settings
- **Acción**: Crear `src/app/dashboard/settings/page.tsx` con al menos el toggle de photo requirement. Considerar agregar más settings en el futuro (tolerancia de tardanza, timezone, etc.)

### 7. README real
- **Archivo**: `README.md` (actualmente es el boilerplate de create-next-app)
- **Acción**: Reemplazar con documentación real:
  - Requisitos (Node 18+, PostgreSQL, Supabase project)
  - Variables de entorno (referenciar `.env.example`)
  - Setup (install, env, seed scripts, dev)
  - Arquitectura (breve: modular monolith, TypeORM, Supabase auth)
  - API mobile endpoints (lista rápida)
  - Scripts de backfill (seed-default-business, seed-demo-data, link-users)

---

## 🔵 Feature: Vista completa del empleado en web (parity con app mobile)

> **Contexto**: Actualmente la vista web del empleado (`/scanner`) solo tiene el QR scanner. La app mobile (`fichero`) tiene 5 pantallas: home, scanner, horas, justificaciones, perfil. El objetivo es que la web tenga las mismas funcionalidades.
>
> **Todas las API routes ya existen** (`/api/mobile/*`). Solo falta crear las páginas web que las consuman.

### 12. Layout del empleado (fuera del dashboard)
- **Ruta actual**: `/scanner/page.tsx` — layout suelto, sin sidebar ni nav
- **Acción**: Crear un layout separado para las rutas del empleado que no sea el dashboard:
  - Opción A: Usar un layout en `src/app/(employee)/layout.tsx` con navegación inferior o lateral (como la app mobile tiene tabs)
  - Opción B: Mantener las rutas bajo `src/app/scanner/`, `src/app/hours/`, etc. con un layout compartido
  - **Recomendación**: Opción A — agrupar bajo `(employee)` para separar limpiamente del dashboard admin
- **Archivos a crear**:
  - `src/app/(employee)/layout.tsx` — layout con nav (tabs inferior en mobile, sidebar en desktop)
  - Mover `src/app/scanner/page.tsx` → `src/app/(employee)/scanner/page.tsx`

### 13. Home del empleado
- **Pantalla equivalente**: `fichero/src/app/(app)/home.tsx`
- **API necesaria**: Ya existe — `GET /api/mobile/attendance/today` + `GET /api/auth/me`
- **Contenido**:
  - Saludo con nombre del empleado
  - Estado del día (trabajando / sin registro)
  - Botones rápidos: Registrar entrada / Registrar salida
  - Accesos directos a Horas y Justificaciones
  - Info de cuenta (email, rol, empresa)
- **Archivo a crear**: `src/app/(employee)/home/page.tsx`

### 14. Horas del empleado
- **Pantalla equivalente**: `fichero/src/app/(app)/hours.tsx`
- **API necesaria**: Ya existe — `GET /api/mobile/hours?range=week|month|payweek`
- **Contenido**:
  - Segmented control: Semana / Mes / Quincena
  - Resumen: total horas + días trabajados
  - Lista de turnos (entrada/salida, abierto/cerrado)
- **Archivo a crear**: `src/app/(employee)/hours/page.tsx`

### 15. Justificaciones del empleado
- **Pantalla equivalente**: `fichero/src/app/(app)/justifications.tsx`
- **API necesaria**: Ya existe — `GET /api/mobile/justifications` + `POST /api/mobile/justifications` (multipart)
- **Contenido**:
  - Formulario de nueva justificación: fecha (con date picker, NO text input libre), motivo, adjunto (PDF/PNG/JPEG, máx 5MB)
  - Lista de justificaciones existentes con estado (pendiente/aprobada/rechazada)
  - Comentario del admin si rechazada
- **Nota**: La versión mobile usa TextInput para la fecha — en web aprovechar `<input type="date">` nativo
- **Archivo a crear**: `src/app/(employee)/justifications/page.tsx`

### 16. Perfil del empleado
- **Pantalla equivalente**: `fichero/src/app/(app)/profile.tsx`
- **API necesaria**: Ya existe — `GET /api/auth/me` (retorna employee + business + devices)
- **Contenido**:
  - Info del empleado (nombre, email)
  - Datos de la empresa
  - Dispositivos vinculados (highlight del actual si aplica — en web no hay device binding como en mobile, pero se puede mostrar)
  - Botón de cerrar sesión
- **Archivo a crear**: `src/app/(employee)/profile/page.tsx`

### 17. Navegación del empleado
- **Pantalla equivalente**: `fichero/src/components/app-tabs.tsx` (5 tabs: Inicio, Escanear, Horas, Justificaciones, Perfil)
- **Acción**: Crear componente de navegación para el layout del empleado:
  - **Mobile**: Bottom tab bar (5 tabs con iconos, no emojis)
  - **Desktop**: Sidebar horizontal o vertical colapsable
  - Usar `react-icons` (ya instalado) para los iconos
- **Archivo a crear**: `src/components/employee-nav.tsx`

### Notas de implementación
- **NO tocar el dashboard del admin** — son rutas separadas
- **Auth**: El middleware actual ya maneja la protección por rol (`employee` → solo `/scanner`, `/hours`, etc.; `admin` → solo `/dashboard`). Actualizar el matcher para incluir las nuevas rutas.
- **Multi-tenant**: Las API routes ya filtran por business via `getAdminFromSession()` o el employee ID del cookie. No hay que duplicar esa lógica.
- **Diseño**: Usar la misma paleta Tailwind del admin (grises, amber para primario, verde/rojo para estados). Mantener consistencia visual.

---

## 🟢 Nice to have (tercer orden)

### 8. Audit Log para cambios de empleado
- **Problema**: Si un admin edita `hourlyRate`, `weeklyHours`, o `active` de un empleado, no queda registro de quién hizo el cambio ni cuándo.
- **Acción**: Crear entity `AuditLog` (entity, repository, service) y loguear cambios en `employeeActions.ts`. No necesita UI en esta iteración — suficiente con que los datos queden en la DB para consulta futura.

### 9. Rate Limiting en API Routes
- **Problema**: Ninguna API route tiene rate limiting. Un cliente podría hacer brute force.
- **Acción**: Agregar rate limiting básico. Opciones:
  - Middleware con contador en memoria (suficiente para单实例)
  - Usar Upstash Ratelimit (serverless-friendly)
  - Priorizar: `/api/mobile/attendance/check-in`, `/api/mobile/qr/verify`, `/api/auth/*`

### 10. CORS robusto para mobile
- **Problema**: `MOBILE_CORS_ORIGINS` es una allowlist hardcodeada. En producción con ngrok o dominios custom, hay que actualizar manualmente.
- **Acción**:考虑:
  - Validar por header custom (ej: `X-App-Key`) en vez de origin
  - O configurar por Supabase project URL
  - Al menos documentar en `.env.example` cómo se usa

### 11. Tests
- **Estado**: No hay ningún test en el proyecto
- **Acción**: Empezar con tests de integración para las actions críticas:
  - `recordEntry` / `recordExit` (attendance flow)
  - `inviteEmployee` (RBAC + provisioning)
  - `scopeToAdminBusiness` (multi-tenant isolation)
  - Tests de unit para `TurnService` (cálculo de horas)

---

## 📋 Archivos referenciados

| Archivo | Rol |
|---|---|
| `src/app/dashboard/page.tsx` | Dashboard principal con stats (tardanzas hardcodeadas) |
| `src/app/dashboard/users/pagest.tsx` | Placeholder con typo en nombre |
| `src/actions/attendanceActions.ts` | Actions de asistencia (tardanzas en getDashboardStats) |
| `src/actions/inviteActions.ts` | Invite employee (sin UI) |
| `src/backend/models/Location.ts` | Entity de ubicaciones (sin CRUD UI) |
| `src/backend/models/Setting.ts` | Entity de settings (sin admin UI) |
| `src/backend/services/TurnService.ts` | Cálculo de turnos/horas |
| `src/components/Sidebar/menuItems.ts` | Items del sidebar (agregar locations/settings) |
| `src/app/api/settings/photo-requirement/route.ts` | API de setting (sin UI) |
| `src/app/scanner/page.tsx` | Scanner actual del empleado (mover a (employee)/) |
| `src/app/api/mobile/hours/route.ts` | API de horas (ya funcional) |
| `src/app/api/mobile/justifications/route.ts` | API de justificaciones (ya funcional) |
| `src/app/api/auth/me/route.ts` | API de perfil (ya funcional) |
| `src/middleware.ts` | Auth middleware — actualizar matcher para rutas employee |
| `README.md` | Boilerplate — reemplazar |
| `package.json` | Scripts de backfill sin protección de entorno |

---

## ⚠️ Notas para la sesión siguiente

1. **El middleware confía en cookies client-set** (`user_role`). Las actions ya usan `getAdminFromSession()` que consulta Supabase directamente — eso es correcto. Pero el middleware podría ser bypassed. No es crítico para MVP pero documentar.
2. **`photo` en Attendance es `text | null`** — si se almacena base64, escala mal. Verificar si es URL o path.
3. **Los scripts de backfill no validan entorno** — podrían correrse en producción por error.
4. **Multi-tenant está bien implementado** en las actions (scopeToAdminBusiness), pero el middleware no valida business scope.
