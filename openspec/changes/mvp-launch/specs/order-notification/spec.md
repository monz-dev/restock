# Delta for order-notification

## Purpose

Sistema de notificaciones visuales y sonoras en tiempo real para alertar al proveedor cuando llega un nuevo pedido.

## ADDED Requirements

### Requirement: Notificación visual de nuevo pedido

El sistema DEBE mostrar una notificación visual prominente cuando llega un nuevo pedido.

La notificación DEBE:
1. Appear como toast/banner en la parte superior
2. Incluir: "Nuevo pedido de [cliente_id] - [producto]"
3. Desaparecer automáticamente después de 5 segundos
4. O permitir dismiss manual

#### Scenario: Nuevo pedido genera notificación

- GIVEN dashboard abierto en primer plano
- WHEN cliente crea nuevo pedido
- THEN notificación visual aparece
- AND permanece visible por 5 segundos

#### Scenario: Notificación con dashboard en background

- GIVEN dashboard abierto pero no visible (otra pestaña)
- WHEN cliente crea nuevo pedido
- THEN el navegador muestra notification push (si hay permission)
- AND al volver al dashboard se ven los pedidos nuevos

### Requirement: Notificación sonora

El sistema DEBE reproducir un sonido al llegar un nuevo pedido.

#### Scenario: Sonido al nuevo pedido

- GIVEN nuevo pedido llega
- WHEN sound enabled en settings
- THEN sound de notificación suena
- AND proveedor es alertado auditivamente

### Requirement: Configuración de notificaciones

El sistema DEBE permitir al proveedor configurar: sonido on/off, notificaciones push on/off.

#### Scenario: Desactivar sonidos

- GIVEN proveedor va a settings
- WHEN desactiva "Sonido de notificación"
- THEN no se reproduce sonido al llegar pedidos
- AND las notificaciones visuales siguen funcionando

#### Scenario: Solicitar permisos de push notification

- GIVEN primer uso del dashboard
- WHEN navegador pide permisos de push
- THEN muestra explicación antes de aceptar
- AND solo activa si usuario acepta

---

## Acceptance Criteria

- [ ] Notificación visual visible inmediatamente tras pedido
- [ ] Sonido reproduce si está habilitado
- [ ] Push notification si permission granted
- [ ] Settings persistentes entre sesiones
- [ ] No molesta con notificaciones excesivas (rate limit 1/min)