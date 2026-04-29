# Delta for role-based-access

## ADDED Requirements

### Requirement: Control de Acceso por Rol

El sistema DEBE implementar control de acceso basado en roles (RBAC).

El sistema DEBERÁ verificar el rol del usuario antes de permitir operaciones sensibles.

#### Scenario: Admin accede al dashboard

- GIVEN un usuario autenticado con rol "admin"
- WHEN accede a /dashboard
- THEN ve todos los pedidos del sistema

#### Scenario: Repartidor ve solo pedidos despachados

- GIVEN un usuario autenticado con rol "repartidor"
- WHEN accede a /dashboard
- THEN ve solo pedidos con estado "despachado"

### Requirement: Middleware de Verificación

El sistema DEBE verificar autenticación y rol en API routes protegidas.

Las API routes DEBERÁN responder 401 si no hay usuario autenticado.

#### Scenario: Sin auth devuelve 401

- GIVEN solicitud a /api/pedido sin token
- WHEN llega al servidor
- THEN devuelve status 401

#### Scenario: Con auth valido devuelve 200

- GIVEN solicitud a /api/pedido con token válido
- WHEN llega al servidor
- THEN devuelve status 200 y datos

## MODIFIED Requirements

*(Ninguno — capacidades completamente nuevas)*