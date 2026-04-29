# Auth Signup Specification

## Purpose

Definir el flujo de registro de nuevos usuarios con confirmación de email.

## Requirements

### Requirement: UserSignupNew

El sistema DEBE permitir a nuevos usuarios crear una cuenta con email y password.

#### Scenario: Registro exitoso de nuevo usuario

- GIVEN un usuario que desea registrarse con email "nuevo@ejemplo.com"
- WHEN el usuario completa el formulario con email "nuevo@ejemplo.com" y password "SecurePass456"
- AND hace clic en "Registrarse"
- THEN el sistema crea el usuario en Supabase Auth
- AND el sistema envía email de confirmación a "nuevo@ejemplo.com"
- AND el sistema muestra mensaje "Revisa tu email para confirmar tu cuenta"
- AND el sistema permanece en página de login (no redirige aún)

#### Scenario: Registro con email ya existente

- GIVENUn usuario con email "existente@ejemplo.com" ya registrado
- WHEN el usuario intenta registrarse con ese mismo email
- THEN el sistema muestra error "Este email ya está registrado"
- AND el formulario permite reintentar con otro email

#### Scenario: Registro con password débil

- GIVEN el formulario de registro
- WHEN el usuario ingresa password "123" (menos de 6 caracteres)
- AND hace clic en "Registrarse"
- THEN el sistema muestra error "La contraseña debe tener al menos 6 caracteres"
- AND el registro no se procesa

### Requirement: UserSignupEmailConfirmation

El sistema DEBE requerir confirmación de email antes de permitir acceso completo.

#### Scenario: Usuario confirma email exitosamente

- GIVEN un usuario que se registró pero no ha confirmado su email
- WHEN el usuario hace clic en el link de confirmación del email
- THEN el sistema marca el email como confirmado
- AND el sistema permite iniciar sesión

#### Scenario: Usuario intenta login sin confirmar email

- GIVEN un usuario registrado pero sin confirmar email
- WHEN el usuario intenta iniciar sesión
- THEN el sistema muestra error "Debes confirmar tu email antes de iniciar sesión"
- AND el sistema no permite acceso

### Requirement: UserSignupValidation

El sistema DEBE validar los campos del formulario de registro.

#### Scenario: Envío con email vacío

- GIVEN el formulario de registro vacío
- WHEN el usuario hace clic en "Registrarse"
- THEN el sistema muestra error "Ingresa tu email"
- AND no procesa el registro

#### Scenario: Envío con password vacía

- GIVEN el formulario con email completado
- WHEN el usuario deja password vacío y hace clic en "Registrarse"
- THEN el sistema muestra error "Ingresa una contraseña"
- AND no procesa el registro