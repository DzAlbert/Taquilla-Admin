# 🎰 Sistema Administrativo de Lotería de Animalitos

Un sistema completo para la administración de loterías de animalitos con integración de Supabase, gestión de usuarios, apuestas, sorteos y reportes en tiempo real.

## 🚀 Características Principales

- 🔐 **Autenticación y autorización** con roles y permisos
- 🎫 **Gestión de apuestas** con validación en tiempo real
- 🏆 **Sistema de sorteos** automatizado
- 💰 **Gestión de pozos** y distribución de premios
- 📊 **Reportes y estadísticas** detalladas
- 🔄 **Transferencias y retiros** seguros
- 🔑 **API Keys** para integración externa
- 📱 **Interfaz responsive** con Tailwind CSS

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Estado**: Zustand + React Hooks
- **Iconos**: Phosphor Icons
- **Notificaciones**: Sonner

## 📋 Prerequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta en [Supabase](https://supabase.com)

## ⚡ Instalación Rápida

### 1. Clonar e instalar dependencias

```bash
git clone <tu-repositorio>
cd sistema-administrativo
npm install
```

### 2. Configurar Supabase

#### a) Crear proyecto en Supabase
1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Crea un nuevo proyecto
3. Ve a **Settings** > **API** 
4. Copia tu **Project URL** y **anon key**

#### b) Configurar variables de entorno
Ya existe un archivo `.env` con las credenciales configuradas:

```env
VITE_SUPABASE_URL=https://dxfivioylmbpumzcpwtu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### c) Ejecutar el schema de la base de datos
1. En Supabase Dashboard, ve a **SQL Editor**
2. Crea una nueva consulta
3. Copia y pega el contenido de `supabase-schema.sql`
4. Ejecuta el script

#### d) Inicializar datos
1. Copia y pega el contenido de `init-data.sql` en SQL Editor
2. Ejecuta el script para crear roles, usuario admin y datos iniciales

### 3. Iniciar la aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5000`

### 4. Verificar configuración

Ejecuta el script de verificación:

```bash
./setup-supabase.sh
```

## � Credenciales de Acceso

### Usuario Administrador
- **Email**: `admin@loteria.com`
- **Contraseña**: `Admin123!`

Este usuario tiene acceso completo al sistema.

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes de UI
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── LoginScreen.tsx # Pantalla de login
│   ├── *Dialog.tsx     # Modales del sistema
│   └── *Card.tsx       # Tarjetas de información
├── hooks/              # Custom hooks
│   ├── use-auth.ts     # Hook de autenticación local
│   └── use-supabase-auth.ts # Hook de Supabase
├── lib/                # Utilidades y configuración
│   ├── supabase.ts     # Cliente de Supabase
│   ├── types.ts        # Tipos TypeScript
│   └── utils.ts        # Funciones utilitarias
└── config/             # Configuración
    └── supabase.config.ts
```

## 🎮 Uso del Sistema

### Roles y Permisos

- **Super Administrador**: Acceso completo
- **Administrador**: Gestión de operaciones principales
- **Operador**: Apuestas y sorteos
- **Cajero**: Transferencias y retiros
- **Consultor**: Solo reportes

### Funcionalidades Principales

1. **Gestión de Usuarios**: Crear, editar, activar/desactivar usuarios
2. **Roles y Permisos**: Asignar roles con permisos específicos
3. **Loterías**: Configurar loterías con horarios y límites
4. **Apuestas**: Registrar apuestas con validación en tiempo real
5. **Sorteos**: Ejecutar sorteos y calcular ganadores
6. **Pozos**: Gestionar distribución de premios entre pozos
7. **Transferencias**: Mover fondos entre pozos
8. **Retiros**: Procesar retiros de ganadores
9. **Reportes**: Visualizar estadísticas y métricas
10. **API Keys**: Generar keys para integración externa

## 🔧 Scripts Disponibles

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Construir para producción
npm run preview    # Vista previa de producción
npm run lint       # Linter de código
```

## 📊 Base de Datos

El sistema utiliza las siguientes tablas principales:

- `users` - Usuarios del sistema
- `roles` - Roles y permisos
- `user_roles` - Relación usuarios-roles
- `lotteries` - Configuración de loterías
- `bets` - Registro de apuestas
- `draws` - Resultados de sorteos
- `pots` - Gestión de pozos
- `transfers` - Transferencias entre pozos
- `withdrawals` - Retiros procesados
- `api_keys` - Claves de API

## � Seguridad

- Autenticación basada en JWT
- Hashing de contraseñas con bcrypt
- Políticas de seguridad RLS en Supabase
- Validación de permisos por endpoint
- Auditoría de acciones del sistema

## 🚀 Despliegue

### Variables de Entorno para Producción

```env
VITE_SUPABASE_URL=tu-url-de-produccion
VITE_SUPABASE_ANON_KEY=tu-anon-key-de-produccion
```

### Construir para Producción

```bash
npm run build
```

Los archivos estarán en la carpeta `dist/`

## 📝 Licencia

MIT License - Ver archivo `LICENSE` para más detalles.

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear un issue en GitHub
- Revisar la documentación en `SUPABASE_INTEGRATION.md`
