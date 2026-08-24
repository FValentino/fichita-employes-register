# FichitaBit — Employee Attendance Register

Panel admin + backend para registro de asistencia de empleados con código QR.

## Requisitos

- Node.js 18+
- PostgreSQL (o Supabase-hosted Postgres)
- Supabase project (auth + database)

## Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```bash
cp .env.example .env.local
```

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Connection string de PostgreSQL |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo servidor) |
| `QR_SECRET_KEY` | Secreto para generar códigos QR |
| `MOBILE_CORS_ORIGINS` | Orígenes permitidos para API mobile (comma-separated) |

## Setup

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Correr en desarrollo
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

## Seed de datos demo

```bash
npx tsx scripts/seed-demo-data.ts
```

Crea:
- 1 usuario admin
- 5 empleados (1 admin + 4 regulares)
- Asistencia de demo para la última semana
- Setting `require_scan_photo = false`

## Arquitectura

**Modular Monolith** con Next.js App Router.

```
src/
├── app/                    # Rutas y páginas
│   ├── dashboard/          # Panel admin
│   │   ├── attendance/
│   │   ├── employees/
│   │   ├── locations/
│   │   ├── settings/
│   │   └── reports/
│   └── scanner/            # Scanner QR del empleado
├── actions/                # Server actions (lógica de negocio)
├── backend/
│   ├── models/             # Entidades TypeORM
│   ├── repositories/       # Acceso a datos
│   ├── services/           # Lógica de servicio
│   └── types/              # Tipos e interfaces
├── components/             # Componentes React
│   ├── employees/
│   ├── attendance/
│   └── Sidebar/
├── lib/                    # Utilidades (theme, supabase)
└── types/                  # Tipos compartidos
```

## Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** TypeORM, PostgreSQL
- **Auth:** Supabase Auth (cookie-based)
- **Forms:** React Hook Form + Zod
- **Mobile API:** Routes bajo `/api/mobile/*`

## API Mobile

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/mobile/attendance/check-in` | POST | Registrar entrada |
| `/api/mobile/attendance/check-out` | POST | Registrar salida |
| `/api/mobile/attendance/today` | GET | Asistencia del día |
| `/api/mobile/hours` | GET | Horas trabajadas |
| `/api/mobile/justifications` | GET/POST | Justificaciones |
| `/api/mobile/qr/verify` | POST | Verificar QR |
| `/api/mobile/me` | GET | Perfil del empleado |
| `/api/auth/me` | GET | Datos de autenticación |

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar en producción |
| `npm run lint` | Linting con ESLint |

## Licencia

Privado — FichitaBit
