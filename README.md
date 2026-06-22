# TraceChain Frontend

Interfaz web de TraceChain, una plataforma SaaS académica para la trazabilidad de cadenas agroalimentarias. Está pensada para empresas productoras, procesadoras, comercializadoras o auditoras que necesitan registrar lotes, movimientos, inspecciones, usuarios, permisos, reportes y consulta pública por QR.

Este repositorio contiene la aplicación cliente construida con React, TypeScript y Vite. Consume la API REST del backend de TraceChain.

## Qué permite hacer

- Registrar una organización con verificación de correo por código (la organización se crea solo al confirmar el código).
- Iniciar sesión con verificación en dos pasos (código enviado al correo).
- Administrar lotes agroalimentarios con información sanitaria, fechas, cantidades y estado.
- Consultar el detalle de un lote, su código QR y su historial público.
- Registrar movimientos de trazabilidad: creación, traslado, transformación, división, mezcla y cambio de estado.
- Ver dashboard con KPIs, alertas y gráficos.
- Gestionar usuarios, roles y permisos por organización.
- Gestionar organizaciones, planes y usuarios globales como super admin.
- Personalizar cupos de organizaciones sin depender únicamente del plan base.
- Registrar inspecciones, auditorías y hallazgos, con responsable asignado, estado de seguimiento, vista de detalle y filtro de "mis pendientes".
- Gestionar inventario de materias primas y proveedores, y enlazar materias primas usadas al crear un lote para trazabilidad de producto a insumo.
- Exportar reportes desde las pestañas de lotes y movimientos.
- Preparar la vista de analítica para integración con Apache Superset.
- Usar una interfaz responsive con sidebar colapsable, drawer móvil, modales reutilizables y tablas adaptadas.

## Stack

| Área | Tecnología |
|---|---|
| UI | React 19 + TypeScript |
| Bundler | Vite |
| Estilos | Tailwind CSS v4 |
| Routing | React Router DOM v7 |
| Estado servidor | TanStack React Query v5 |
| Estado local/auth | Zustand |
| HTTP | Axios |
| Toasts | Sonner |
| Gráficos | Recharts |
| Package manager | pnpm |

## Arquitectura

La aplicación está organizada por capas y por dominio. Las llamadas HTTP viven en `src/api`, las páginas en `src/pages`, los componentes reutilizables en `src/components`, y las reglas comunes en `src/lib`.

```txt
src/
├── api/                 # Funciones HTTP por módulo
├── components/
│   ├── layout/          # Layout, sidebar y navegación principal
│   └── ui/              # Modal, Badge, EmptyState, PasswordInput, etc.
├── hooks/               # Hooks de auth y permisos
├── lib/                 # Validación, errores API, constantes, toasts
├── pages/
│   ├── admin/           # Organizaciones, usuarios globales, planes
│   ├── auth/            # Login (2FA) y registro con verificación de correo
│   ├── billing/         # Mi organización y uso del plan
│   ├── dashboard/       # KPIs y gráficos
│   ├── lots/            # Lotes y detalle (con ingredientes/proveedor)
│   ├── movements/       # Movimientos
│   ├── inspections/     # Inspecciones, detalle, responsable y estado
│   ├── inventory/       # Materias primas y proveedores
│   ├── reports/         # Analítica / Superset
│   ├── roles/           # Roles, permisos y usuarios por rol
│   └── public/          # Vista pública por QR
├── types/               # Tipos TypeScript compartidos
├── env.ts               # Variables de entorno tipadas
├── App.tsx              # Rutas y providers
└── main.tsx
```

## Rutas principales

| Ruta | Descripción |
|---|---|
| `/login` | Inicio de sesión con verificación en dos pasos |
| `/register` | Registro de organización con verificación de correo |
| `/dashboard` | Dashboard operativo |
| `/lots` | Listado, filtros, creación y exportación de lotes |
| `/lots/:id` | Detalle, edición, QR y trazabilidad de ingredientes del lote |
| `/movements` | Movimientos, filtros y exportación |
| `/audit` | Bitácora de auditoría |
| `/inspections` | Inspecciones, hallazgos, responsable y filtros de estado |
| `/inspections/:id` | Detalle de inspección y cambio de estado de seguimiento |
| `/inventory` | Materias primas y proveedores |
| `/users` | Usuarios de la organización |
| `/reports` | Analítica / integración Superset |
| `/profile` | Perfil del usuario |
| `/billing` | Datos y uso de la organización |
| `/public/:qrCode` | Trazabilidad pública sin autenticación |
| `/admin/organizations` | Organizaciones globales |
| `/admin/users` | Usuarios globales |
| `/admin/roles` | Roles y permisos por organización |
| `/admin/plans` | Planes y límites base |

## Seguridad y permisos

El frontend trabaja con JWT entregado por el backend y guarda el contexto de sesión en Zustand/localStorage. Las rutas protegidas validan autenticación y permisos.

Hay dos niveles principales:

- `Super Admin`: administra la plataforma completa, organizaciones, planes, roles globales por organización y usuarios de todas las organizaciones.
- Usuarios de organización: acceden según permisos asignados a su rol dinámico.

Los permisos son dinámicos y vienen desde el backend. La UI oculta o muestra opciones según `usePermissions`.

## Validación y errores

La app incluye validación reutilizable en `src/lib/validation.ts`:

- Email con formato válido.
- Slug normalizado a minúsculas y guiones.
- Contraseña fuerte: mínimo 8 caracteres, una mayúscula, una minúscula y un número.

Los formularios muestran mensajes claros usando `getApiMessage` y `notify.apiError`, leyendo los errores estructurados que responde el backend.

## Variables de entorno

Crear `.env` a partir de `.env.example`:

```env
VITE_API_URL=http://localhost:3000/api
```

Si `VITE_API_URL` queda vacío, la app no podrá comunicarse correctamente con el backend.

## Instalación

```bash
pnpm install
cp .env.example .env
pnpm dev
```

La app queda disponible en:

```txt
http://localhost:5173
```

## Scripts

| Comando | Descripción |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Compilación de producción |
| `pnpm preview` | Vista previa del build |
| `pnpm lint` | Revisión con ESLint |

## Flujo recomendado

1. Levantar backend en `http://localhost:3000`.
2. Configurar `VITE_API_URL=http://localhost:3000/api`.
3. Ejecutar `pnpm dev`.
4. Registrar organización en `/register` o ingresar con usuario seed.
5. Usar el área `Admin` solo con usuario super admin.

## Convenciones

- Componentes reutilizables en `src/components/ui`.
- Lógica HTTP fuera de las páginas, dentro de `src/api`.
- Tipos compartidos en `src/types`.
- Reglas de validación y constantes en `src/lib`.
- Las páginas grandes se dividen en componentes locales cuando la UI crece.

