# TraceChain — Frontend

Interfaz web para el sistema de trazabilidad agroalimentaria TraceChain. Construida en React + TypeScript + Vite, consume la API REST del backend.

## Requisitos previos

Tener instalado:
- [Node.js v20+](https://nodejs.org)
- [pnpm](https://pnpm.io) — `npm install -g pnpm`
- Backend corriendo en `http://localhost:3000`

## Setup inicial

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-org/tracechain-frontend.git
cd tracechain-frontend
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Crear el archivo de variables de entorno

```bash
cp .env.example .env
```

### 4. Arrancar el servidor de desarrollo

```bash
pnpm dev
```

App en `http://localhost:5173`

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Servidor de desarrollo con hot reload |
| `pnpm build` | Build de producción |
| `pnpm preview` | Preview del build de producción |
| `pnpm lint` | Linter ESLint |

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | React 19 + TypeScript |
| Bundler | Vite |
| Estilos | Tailwind CSS |
| Routing | React Router DOM v7 |
| HTTP | Axios |
| Estado servidor | TanStack React Query |
| Package manager | pnpm |

---

## Variables de entorno

```
VITE_API_URL=http://localhost:3000/api
```

---

## Estructura del proyecto

```
tracechain-frontend/
├── src/
│   ├── api/              ← cliente axios y llamadas al backend
│   ├── components/
│   │   ├── ui/           ← componentes reutilizables (Button, Input, Table, Badge)
│   │   └── layout/       ← Sidebar, Navbar, Layout principal
│   ├── pages/
│   │   ├── auth/         ← Login
│   │   ├── dashboard/    ← Dashboard con KPIs y alertas
│   │   ├── lots/         ← Lista, detalle y creación de lotes
│   │   ├── movements/    ← Movimientos de lotes
│   │   └── audit/        ← Bitácora de auditoría
│   ├── hooks/            ← custom hooks con React Query
│   ├── types/            ← tipos TypeScript
│   ├── utils/            ← helpers
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── .env.example
└── package.json
```

---

## Flujo de trabajo Git

```
master    → código estable / entregas
develop   → integración del equipo
feature/* → trabajo individual por módulo
```

Nunca hacer push directo a `master` o `develop`. Todo va por Pull Request.

```bash
# Antes de empezar a trabajar
git checkout develop
git pull origin develop
git checkout -b feature/nombre-de-la-tarea

# Al terminar
git push origin feature/nombre-de-la-tarea
# → abrir PR hacia develop en GitHub
```

### Convención de commits

```
feat: descripción      → nueva funcionalidad
fix: descripción       → corrección de bug
chore: descripción     → configuración, dependencias
docs: descripción      → documentación
style: descripción     → cambios de estilos
```

---

## Conexión con el backend

El frontend consume la API REST del backend en `http://localhost:3000`. Asegúrate de que el backend esté corriendo antes de arrancar el frontend.

Para arrancar el backend:
```bash
cd ../tracechain-backend
docker compose up -d
pnpm dev
```