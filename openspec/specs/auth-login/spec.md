# Auth Login Specification

## Purpose

Definir el comportamiento del sistema de autenticación mediante email y password usando Supabase Auth.

## Requirements

### Requirement: UserLoginWithEmail

El sistema DEBE permitir a usuarios existentes iniciar sesión usando su email y password.

#### Scenario: Login exitoso con credenciales válidas

- GIVEN un usuario registrado con email "test@ejemplo.com" y password correcto
- WHEN el usuario envía email "test@ejemplo.com" y password "password123" en el formulario de login
- THEN el sistema verifica credenciales con Supabase Auth
- AND el sistema redirige al usuario a "/dashboard"
- AND el sistema muestra mensaje de bienvenida "¡Bienvenido de nuevo!"

#### Scenario: Login fallido con password incorrecto

- GIVEN un usuario registrado con email "test@ejemplo.com"
- WHEN el usuario envía email "test@ejemplo.com" y password "wrongpassword"
- THEN el sistema muestra error "Email o contraseña incorrectos"
- AND el sistema NO redirige al dashboard
- AND el formulario permanece visible para reintentar

#### Scenario: Login fallido con email no registrado

- GIVENNingún usuario con email "noexiste@ejemplo.com"
- WHEN el usuario envía este email y cualquier password
- THEN el sistema muestra error "Email o contraseña incorrectos"
- AND el sistema NO redirige al dashboard

### Requirement: UserLoginValidation

El sistema DEBE validar el formato del email y que los campos no estén vacíos antes de enviar.

#### Scenario: Envío de formulario con email vacío

- GIVEN el formulario de login vacío
- WHEN el usuario hace clic en "Iniciar Sesión" sin completar campos
- THEN el sistema muestra error en campo email "Ingresa tu email"
- AND el sistema no envía la solicitud

#### Scenario: Envío de formulario con email inválido

- GIVEN el formulario con email "invalid-email"
- WHEN el usuario hace clic en "Iniciar Sesión"
- THEN el sistema muestra error en campo email "Ingresa un email válido"
- AND el sistema no envía la solicitud

### Requirement: UserLoginLoading

El sistema DEBE mostrar feedback visual mientras Procesa el login.

#### Scenario: Mostrar estado de carga durante login

- GIVEN el usuario envia credenciales válidas
- WHEN el sistema está verificando con Supabase Auth
- THEN el sistema muestra indicador de carga
- AND el botón muestra estado deshabilitado
- AND el sistema no permite doble clic