# Delta for user-roles

## ADDED Requirements

### Requirement: Sistema de Roles

El sistema DEBE implementar un sistema de roles para control de acceso basado en RBAC (Role-Based Access Control).

El sistema DEBE incluir los roles: admin, proveedor, cliente, repartidor.

#### Scenario: Roles definidos en base de datos

- GIVEN base de datos vacía
- WHEN se ejecuta la migración de roles
- THEN existen 4 registros en la tabla `roles` con los nombres especificados

#### Scenario: Usuario tiene rol asignado

- GIVEN un usuario autenticado en auth.users
- WHEN se le asigna el rol "cliente"
- THEN existe un registro en `usuario_roles` con el user_id y rol_id correspondientes

### Requirement: Permisos Estructurales

El sistema DEBE incluir una tabla de permisos para permisos granulares futuros.

Los permisos DEBERÁN poder asociarse a usuarios de forma directa para casos especiales.

#### Scenario: Estructura de permisos existe

- GIVEN la migración ejecutada
- WHEN se consulta `permisos`
- THEN la tabla existe con columnas: id, nombre, descripcion

### Requirement: RLS por Rol

Las tablas del sistema DEBEN tener políticas RLS basadas en el rol del usuario autenticado.

Las políticas RLS DEBERÁN permitir/denegar operaciones según el rol asignado.

#### Scenario: Admin puede leer todo

- GIVEN un usuario con rol "admin"
- WHEN consulta la tabla `pedidos`
- THEN recibe todos los registros (sin filtro)

#### Scenario: Cliente solo ve sus pedidos

- GIVEN un usuario con rol "cliente" y cliente_id asociado
- WHEN consulta la tabla `pedidos`
- THEN recibe solo los pedidos donde cliente_id = su cliente_id

## MODIFIED Requirements

### Requirement: Tabla Pedidos con Creador

(Previously: Tabla pedidos sin referencia a usuario)

La tabla `pedidos` DEBE incluir una referencia al usuario que la creó (`created_by`).

Esto permite auditoria y filtrado por rol.

#### Scenario: Pedido con created_by

- GIVEN un usuario autenticado
- WHEN crea un pedido via API
- THEN el registro incluye el user_id del creador

## REMOVED Requirements

### Requirement: Pedidos Públicos

(Reason: RLS restrictivo reemplaza acceso público)

- ~~Cualquier usuario puede insertar pedidos~~
- ~~Las políticas RLS permiten acceso sin autenticación~~