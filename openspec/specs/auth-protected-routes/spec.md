# Auth Protected Routes Specification

## Purpose

Definir la protección de rutas que requieren autenticación y el comportamiento de redirect.

## Requirements

### Requirement: ProtectedRouteAccess

El sistema DEBE proteger rutas autenticadas y redirigir a login si no hay sesión.

#### Scenario: Acceso a dashboard sin autenticación

- GIVENNingún usuario autenticado
- WHEN el usuario intenta acceder a "/dashboard"
- THEN el sistema redirige a "/login"
- AND el sistema recuerda la ruta original para posible redirect tras login

#### Scenario: Acceso a dashboard con sesión activa

- GIVENUn usuario autenticado con sesión válida
- WHEN el usuario accede a "/dashboard"
- THEN el sistema permite acceso al contenido del dashboard
- AND muestra los datos del usuario

### Requirement: PostLoginRedirect

El sistema DEBE redirigir a la ruta original después de un login exitoso.

#### Scenario: Redirect a ruta original después de login

- GIVEN un usuario que intentó acceder a "/dashboard" sin autenticación
- AND fue redirigido a "/login"
- WHEN el usuario inicia sesión correctamente
- THEN el sistema redirige a "/dashboard"

### Requirement: SessionExpiration

El sistema DEBE manejar expiración de sesión apropiadamente.

#### Scenario: Sesión expira mientras usa la app

- GIVEN un usuario autenticado pero la sesión expiró o fue invalidada
- WHEN el usuario realiza una acción que requiere autenticación
- THEN el sistema redirige a "/login"
- AND el sistema muestra mensaje "Tu sesión ha expirado"