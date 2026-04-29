# Proposal: pantalla-login

## Intent

Añadir autenticación completa con Supabase Auth al sistema restock. El sistema actualmente redirect directo a `/dashboard` sin verificación de identidad. Necesitamos una pantalla de login funcional en español que permita: iniciar sesión, registro de usuario, recuperación de contraseña, confirmación de email, y redirección segura al dashboard.

## Scope

### In Scope
- Pantalla de login con email/password
- Registro de usuario nuevo (sign up)
- Recuperación de contraseña (olvido de contraseña)
- Confirmación de email al registrarse
- Redirección al dashboard tras login exitoso
- Protección de rutas autenticadas

### Out of Scope
- Autenticación con redes sociales (Google, Facebook)
- Two-Factor Authentication (2FA)
- Perfil de usuario editable
- Cerrar sesión desde dashboard (logueo requerido)

## Capabilities

### New Capabilities
- `auth-login`: Autenticación con email/password usando Supabase Auth
- `auth-signup`: Registro de nuevo usuario con confirmación de email
- `auth-password-reset`: Recuperación de contraseña por email
- `auth-protected-routes`: Protección de rutas que requieren autenticación

### Modified Capabilities
- Ninguna — comportamiento nuevo

## Approach

Utilizar el SDK de Supabase Auth (supabase-js) ya configurado en el proyecto. El flujo será:

1. **Login**: `supabase.auth.signInWithPassword()` → redirect a `/dashboard`
2. **Signup**: `supabase.auth.signUp()` → email de confirmación → login después de confirmar
3. **Password Reset**: `supabase.auth.resetPasswordForEmail()` → link en email → nuevo password

Crear una página `/login` centralizada que muestre las 3 opciones (login, registro, olvido) mediante navegación interna (estados o rutas separadas).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/page.tsx` | Modified | Cambiar redirect de /dashboard a /login si no hay sesión |
| `app/login/page.tsx` | New | Pantalla principal de autenticación |
| `app/dashboard/page.tsx` | Modified | Añadir verificación de auth antes de mostrar contenido |
| `lib/supabase/client.ts` | Modified | Añadir funciones helper de autenticación |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Usuario no confirma email | Medium | Mostrar mensaje claro de "revisa tu email" después de signup |
| Error de red en auth | Low | Manejar errores de Supabase y mostrar feedback al usuario |
| Sesión expirada en dashboard | Medium | Verificar sesión en cada request, hacer redirect a login |

## Rollback Plan

1. Revertir `app/page.tsx` al redirect original a `/dashboard`
2. Eliminar carpeta `app/login/`
3. Quitar verificación de auth del dashboard
4. Eliminar funciones helper de auth del cliente

## Dependencies

- Supabase Auth configurado y activo (YA existe en el proyecto)
- Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (YA configuradas)

## Success Criteria

- [ ] Usuario puede iniciar sesión con email/password válido
- [ ] Usuario no registrado puede crear cuenta nueva
- [ ] Sistema envía email de confirmación al registrarse
- [ ] Usuario puede recuperar contraseña vía email
- [ ] Después de login exitoso, redirect a `/dashboard`
- [ ] Dashboard accesible solo si hay sesión activa
- [ ] Todo el flujo funciona en español