# Delta for realtime-dashboard

## Purpose

Dashboard móvil para el proveedor que muestra pedidos entrantes en tiempo real sin recargar la página.

## ADDED Requirements

### Requirement: Dashboard en tiempo real

El sistema DEBE mostrar una lista de pedidos que se actualiza automáticamente cuando llegan nuevos pedidos, sin intervención del usuario.

El dashboard DEBE:
1. Mostrar todos los pedidos recientes (últimos 50)
2. Ordenar por timestamp descendente (más reciente primero)
3. Mostrar: cliente_id, producto, hora del pedido
4. Actualizar automáticamente via Supabase Realtime
5. Indicador visual de nuevos pedidos

#### Scenario: Nuevo pedido llega al dashboard

- GIVEN dashboard abierto con pedidos existentes
- WHEN un cliente crea un nuevo pedido
- THEN el pedido aparece arriba en la lista
- AND el dashboard NO requiere recargar

#### Scenario: Dashboard vacío

- GIVEN no hay pedidos en el sistema
- WHEN el proveedor abrié el dashboard
- THEN muestra "No hay pedidos todavía"
- AND permanece en espera de nuevos pedidos

#### Scenario: Pérdida de conexión Realtime

- GIVEN conexión de red perdida
- WHEN se reestablece la conexión
- THEN el dashboard rescarga los pedidos recientes
- AND reanuda la suscripción en tiempo real

### Requirement: Visualización de detalles del pedido

El sistema DEBE mostrar información completa del pedido: cliente, producto, cantidad, timestamp.

#### Scenario: Ver detalles de pedido

- GIVEN lista de pedidos en dashboard
- WHEN el proveedor toca un pedido
- THEN muestra: cliente, producto, hora exacta
- AND opción de marcar como "atendido"

### Requirement: Estado del pedido

El sistema DEBE permitir marcar pedidos como "atendido" o "pendiente".

#### Scenario: Marcar pedido como atendido

- GIVEN pedido pendientes en lista
- WHEN el proveedor toca "Marcar atendido"
- THEN el pedido cambia a estado "atendido"
- AND se marca visualmente diferente

---

## Acceptance Criteria

- [ ] Pedido nuevo aparece en <2s tras crearse
- [ ] No requiere recargar página
- [ ] Muestra al menos 50 pedidos recientes
- [ ] Funciona en móvil (responsive)
- [ ] Fallback a polling si Realtime falla