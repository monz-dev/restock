# Delta for one-click-ordering

## Purpose

Página cliente mobile-first para que comercios soliciten productos con un solo clic, sin autenticación, usando URL única como identificador.

## ADDED Requirements

### Requirement: Página de cliente con botones por producto

El sistema DEBE mostrar una página móvil con botones para cada producto disponible, donde cada botón genera un pedido independiente al presionarlo.

La página DEBE:
1. Mostrar el nombre del cliente en el header
2. Listar todos los productos disponibles con su nombre y precio
3. Incluir un botón por producto que al presionarlo cree un pedido
4. Mostrar confirmación visual ("Pedido enviado") tras crear el pedido

#### Scenario: Cliente presiona botón de producto

- GIVEN un cliente con URL única (ej: `/cliente-123`)
- WHEN presiona el botón de un producto
- THEN se crea un pedido en la base de datos
- AND se muestra confirmación visual "Pedido enviado"

#### Scenario: Cliente presiona múltiples productos

- GIVEN un cliente que presiona botón de producto A
- WHEN luego presiona el botón de producto B
- THEN se crean dos pedidos independientes
- AND ambos aparecen en el dashboard del proveedor

#### Scenario: Error de red al crear pedido

- GIVEN conexión a internet inestable
- WHEN falla la creación del pedido
- THEN se muestra mensaje de error "No se pudo enviar. Intenta de nuevo"
- AND el pedido NO se duplica al reintentar

### Requirement: Registro de pedido sin autenticación

El sistema DEBE registrar cada pedido con: cliente_id (desde URL), producto_id, timestamp.

El endpoint `POST /api/pedido` DEBE:
1. Aceptar `{ producto_id }` en el body
2. Extraer `cliente_id` del path de la URL
3. Insertar en tabla `pedidos` con timestamp automático
4. Retornar `{ success: true, pedido_id: ... }`

#### Scenario: Crear pedido exitosamente

- GIVEN cliente-123 en URL `/cliente-123`
- WHEN POST a `/api/pedido` con `{ producto_id: "pizza-margarita" }`
- THEN registro en tabla `pedidos` con cliente_id="cliente-123"
- AND respuesta `{ success: true, pedido_id: "uuid" }`

### Requirement: URL única por cliente

El sistema DEBE identificar al cliente por el path de la URL (formato: `/[cliente_id]`).

#### Scenario: Acceder con URL de cliente

- GIVEN URL del sistema con identificador (ej: `ejemplo.com/cliente-456`)
- WHEN el comerciante accede desde su móvil
- THEN la página muestra los productos disponibles
- AND el pedido se asocia automáticamente a cliente-456

---

## Acceptance Criteria

- [ ] Página carga en <2s en conexión 3G
- [ ] Botón genera pedido con un solo toque
- [ ] Confirmación visible por al menos 2 segundos
- [ ] No requiere login ni registro previo
- [ ] works offline después de primer acceso (PWA)