# Campus Virtual - Instituto Privado Dalmacio Vélez Sarsfield

Una plataforma educativa moderna desarrollada con Next.js 15, diseñada para facilitar el acceso a recursos académicos, cursos y comunicación entre estudiantes y profesores del IPDVS.

## 🚀 Características

### ✅ Implementado
- **Sistema de autenticación completo** con NextAuth.js y Supabase
- **Dashboard interactivo** con 14 materias académicas
- **Calendario académico** con eventos, exámenes y tareas
- **Gestión de perfil de usuario** con información académica
- **Panel de configuración** con preferencias personalizables
- **Diseño responsive** optimizado para móviles y escritorio
- **Middleware de protección** de rutas autenticadas
- **Tests unitarios** configurados con Jest

### 🔄 En Desarrollo
- Sistema de comunicación docente-estudiante
- Carga y descarga de materiales académicos
- Sistema de calificaciones en tiempo real
- Notificaciones push y por email

## 🛠️ Tecnologías

**Frontend:**
- Next.js 15.3.4 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- React Hook Form + Zod

**Backend & Base de Datos:**
- Supabase (PostgreSQL)
- NextAuth.js para autenticación
- Prisma ORM
- API Routes de Next.js

**Testing:**
- Jest
- React Testing Library
- Jest Environment JSDOM

## 📦 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/BrunoBarraud/campus-websiteapp.git
cd campus-websiteapp
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.template .env.local
```

Completar las variables en `.env.local`:
```env
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Optional: Firebase (si decides usarlo)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
```

4. **Configurar base de datos**
```bash
# Ejecutar las migraciones en Supabase
# El archivo supabase-migration.sql contiene la estructura necesaria
```

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🏗️ Estructura del Proyecto

```
campus-websiteapp/
├── app/                          # App Router de Next.js
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Autenticación
│   │   │   ├── [...nextauth]/    # NextAuth.js
│   │   │   └── register/         # Registro de usuarios
│   │   └── sync-user/            # Sincronización de usuarios
│   ├── campus/                   # Rutas protegidas del campus
│   │   ├── auth/                 # Login y registro
│   │   ├── calendar/             # Calendario académico
│   │   ├── dashboard/            # Panel principal
│   │   ├── profile/              # Perfil de usuario
│   │   └── settings/             # Configuración
│   ├── components/               # Componentes específicos de app
│   │   └── auth/                 # Componentes de autenticación
│   └── lib/                      # Utilidades y configuración
│       ├── firebaseConfig.ts     # Configuración Firebase
│       └── supabaseClient.ts     # Cliente Supabase
├── components/                   # Componentes reutilizables
│   ├── dashboard/                # Componentes del dashboard
│   │   ├── Calendar.tsx          # Componente de calendario
│   │   ├── CourseCard.tsx        # Tarjetas de cursos
│   │   └── DashboardLayout.tsx   # Layout del dashboard
│   └── Home/                     # Componentes de la página principal
├── __tests__/                    # Tests unitarios
├── public/                       # Archivos estáticos
├── .env.template                 # Template de variables de entorno
└── middleware.ts                 # Middleware de Next.js
```

## 🎓 Funcionalidades Académicas

### Dashboard de Cursos
- **14 Materias disponibles**: Matemática, Lengua, Historia, Biología, Física, Química, Literatura, Artes Visuales, Filosofía, Educación Física, Música, Geografía, Programación, Economía
- **Información de profesores** actualizada
- **Búsqueda y filtros** para encontrar materias fácilmente
- **Acceso directo** a recursos de cada materia

### Calendario Académico
- **Vista mensual** interactiva
- **Tipos de eventos**: Exámenes, tareas, clases, feriados
- **Detalles de eventos** con información adicional
- **Próximos eventos** destacados
- **Navegación** entre meses

### Gestión de Perfil
- **Información personal** editable
- **Datos académicos**: curso, ID de estudiante, estado
- **Estadísticas**: promedio, asistencia, materias pendientes
- **Avatar personalizable**

### Configuración del Sistema
- **Preferencias de apariencia**: modo oscuro, idioma, zona horaria
- **Notificaciones**: generales, email, push
- **Privacidad**: perfil privado
- **Sistema**: guardado automático

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm run test

# Tests en modo watch
npm run test:watch

# Coverage de tests
npm run test:coverage
```

## 📚 API Routes

### Autenticación
- `POST /api/auth/register` - Registro de nuevos usuarios
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Usuarios
- `POST /api/sync-user` - Sincronización de datos de usuario

## 🔐 Seguridad

- **Middleware de autenticación** protege rutas sensibles
- **Validación de roles** en el backend
- **Sanitización de inputs** con Zod
- **Hashing de contraseñas** con bcryptjs
- **Variables de entorno** para información sensible

## 🚀 Deployment

### Vercel (Recomendado)
1. Conectar repositorio con Vercel
2. Configurar variables de entorno en el dashboard
3. Deploy automático en cada push a main

### Otros proveedores
El proyecto es compatible con cualquier plataforma que soporte Next.js:
- Netlify
- AWS Amplify
- Railway
- Heroku

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit los cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📝 Roadmap

### Próximas funcionalidades
- [ ] Sistema de mensajería docente-estudiante
- [ ] Biblioteca digital con materiales descargables
- [ ] Sistema de evaluaciones online
- [ ] Foros de discusión por materia
- [ ] Aplicación móvil con React Native
- [ ] Panel administrativo para profesores
- [ ] Integración con sistemas de videoconferencia
- [ ] Sistema de backup automático

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Equipo

- **Bruno Ariel Barraud** - Desarrollador Full Stack & Profesor de Programación
- **Instituto Privado Dalmacio Vélez Sarsfield** - Cliente

## 📞 Soporte

Para soporte técnico o consultas:
- Email: soporte@ipdvs.edu.ar
- GitHub Issues: [Crear un issue](https://github.com/BrunoBarraud/campus-websiteapp/issues)

---

**Instituto Privado Dalmacio Vélez Sarsfield** © 2025

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
