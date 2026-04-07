# Configuración de Supabase

## 🚀 Primeros Pasos

### 1. Crear un proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que se configure completamente

### 2. Configurar las variables de entorno

Copia el archivo `.env.example` a `.env.local` y completa las variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Puedes encontrar estos valores en:
- **Project URL**: Settings → API → Project URL
- **Anon Key**: Settings → API → Project API keys → anon public

### 3. Ejecutar las migraciones

Ve al SQL Editor en Supabase y ejecuta el contenido del archivo:
`supabase/migrations/001_initial_schema.sql`

### 4. Configurar Storage (Opcional)

Si quieres usar la funcionalidad de subida de avatares:

1. Ve a Storage en el dashboard de Supabase
2. El bucket `avatars` ya debería estar creado por la migración
3. Asegúrate de que tenga permisos públicos

## 🔧 Características Implementadas

### ✅ Autenticación
- Login/Registro con email y contraseña
- Manejo de estado de autenticación
- Protección de rutas

### ✅ Perfil de Usuario
- Información personal (nombre, email, bio, etc.)
- Información profesional (trabajo, compañía, ubicación)
- Zona horaria
- Validación completa con Zod

### ✅ Sistema de Skills
- Agregar/eliminar habilidades
- Validación de skills únicas
- Interfaz intuitiva

### ✅ Subida de Avatares
- Subida a Supabase Storage
- Validación de archivos (tipo, tamaño)
- URLs públicas automáticas

### ✅ Seguridad
- Row Level Security (RLS) habilitado
- Políticas de acceso por usuario
- Autenticación requerida

## 📁 Estructura de Base de Datos

### Tabla `profiles`
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to auth.users)
- first_name: TEXT
- last_name: TEXT
- display_name: TEXT
- email: TEXT
- bio: TEXT
- website: TEXT
- avatar_url: TEXT
- job_title: TEXT
- company: TEXT
- location: TEXT
- timezone: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Tabla `skills`
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to auth.users)
- skill_name: TEXT
- created_at: TIMESTAMP
```

## 🔒 Políticas de Seguridad

- **Profiles**: Solo el propietario puede ver/editar su perfil
- **Skills**: Solo el propietario puede gestionar sus skills
- **Storage**: Solo el propietario puede subir/ver sus avatares

## 🚀 Próximos Pasos

1. **Configurar autenticación social** (Google, GitHub, etc.)
2. **Agregar más campos al perfil** (enlaces sociales, portfolio)
3. **Implementar notificaciones por email**
4. **Agregar sistema de seguidores/amigos**
5. **Implementar búsqueda de usuarios**

## 🐛 Solución de Problemas

### Error: "Module not found: Can't resolve '@/lib/supabase/client'"
- Asegúrate de que las variables de entorno estén configuradas correctamente
- Verifica que `@supabase/supabase-js` esté instalado

### Error: "relation 'profiles' does not exist"
- Ejecuta las migraciones SQL en Supabase
- Verifica que estés en el proyecto correcto

### Error de autenticación
- Verifica que las claves API sean correctas
- Asegúrate de que RLS esté habilitado correctamente

¿Necesitas ayuda con algún paso específico?