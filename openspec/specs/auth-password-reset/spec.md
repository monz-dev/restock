# Auth Password Reset Specification

## Purpose

Definir el flujo de recuperación de contraseña mediante email.

## Requirements

### Requirement: UserPasswordResetRequest

El sistema DEBE permitir a usuarios solicitar un link de recuperación de contraseña.

#### Scenario: Solicitud de recuperación exitosa

- GIVEN un usuario olvidado con email "recuperar@ejemplo.com"
- WHEN el usuario hace clic en "¿Olvidaste tu contraseña?" y completa su email
- AND hace clic en "Recuperar Contraseña"
- THEN el sistema envía email con link de recuperación a "recuperar@ejemplo.com"
- AND el sistema muestra mensaje "Revisa tu email para recuperar tu contraseña"

#### Scenario: Solicitud con email no registrado

- GIVENNingún usuario con email "noexiste@ejemplo.com"
- WHEN el usuario solicita recuperación para ese email
- THEN el sistema muestra mensaje "Si el email existe, recibirás un enlace de recuperación"
- AND el sistema NO revela si el email está o no registrado (seguridad)

### Requirement: UserPasswordResetComplete

El sistema DEBE permitir establecer nueva contraseña mediante el link de recuperación.

#### Scenario: Establecer nueva contraseña

- GIVEN un usuario que recebeu link de recuperación válido
- WHEN el usuario abre el link y establece nueva contraseña "NuevaPass789"
- AND confirma la misma contraseña
- THEN el sistema actualiza la contraseña en Supabase Auth
- AND el sistema muestra mensaje "Contraseña actualizada"
- AND el sistema redirige a página de login

#### Scenario: Link de recuperación expirado

- GIVEN un usuario con link de recuperación vencido (más de 1 hora)
- WHEN el usuario intenta usar el link
- THEN el sistema muestra error "El enlace ha expirado"
- AND el sistema sugiere solicitar uno nuevo

#### Scenario: Nueva contraseña no coincide

- GIVEN el formulario de nueva contraseña
- WHEN el usuario ingresa "Password123" y confirma "Different456"
- THEN el sistema muestra error "Las contraseñas no coinciden"
- AND no actualiza la contraseña