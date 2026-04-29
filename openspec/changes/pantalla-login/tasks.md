# Tasks: pantalla-login

## Phase 1: Auth Helpers

- [x] 1.1 Añadir funciones helper de autenticación en lib/supabase/client.ts: signIn(email, password), signUp(email, password), resetPassword(email), getSession(), signOut()

## Phase 2: Login Page

- [x] 2.1 Crear app/login/page.tsx con componente de formulario de login
- [x] 2.2 Implementar validación de email y password vacíos
- [x] 2.3 Integrar signIn() de Supabase con manejo de errores
- [x] 2.4 Añadir estado de carga durante autenticación

## Phase 3: Signup Page

- [x] 3.1 Añadir formulario de registro en app/login/page.tsx
- [x] 3.2 Implementar signUp() con validación de password mínimo
- [x] 3.3 Mostrar mensaje de confirmación "revisa tu email"
- [x] 3.4 Manejar error de email ya registrado

## Phase 4: Password Reset

- [x] 4.1 Añadir flujo de recuperación de contraseña en app/login/page.tsx
- [x] 4.2 Implementar resetPassword() y formulario de nueva contraseña
- [x] 4.3 Añadir manejo de link expirado

## Phase 5: Protected Routes

- [x] 5.1 Modificar app/page.tsx para verificar sesión activa
- [x] 5.2 Redirigir a /login si no hay sesión (desde página principal)
- [x] 5.3 Proteger app/dashboard/page.tsx con verificación de auth
- [x] 5.4 Añadir redirect a ruta original después de login exitoso

## Phase 6: Testing / Verification

- [x] 6.1 Verificar login con credenciales válidas redirige a /dashboard
- [x] 6.2 Verificar login con password incorrecto muestra error
- [x] 6.3 Verificar usuario no autenticado no puede acceder a /dashboard
- [x] 6.4 Verificar flujo de recuperación de contraseña