# PRD — MVP Sistema de Pedidos por Botón (Mobile First)

## 1. Resumen

Sistema web mobile-first que permite a comercios solicitar productos (ej. chorizo, queso) con un solo clic. Incluye desde el MVP un **dashboard optimizado para móvil** y **notificaciones en tiempo real** para el proveedor/operador.

---

## 2. Objetivo del MVP

Validar que:

- Los comercios utilizan el sistema de forma recurrente
- Los pedidos se registran correctamente
- El proveedor recibe notificaciones y responde

**Métrica principal:** número de pedidos por semana

---

## 3. Alcance (Scope)

### Incluido

- Página web **mobile-first** por cliente (sin autenticación)
- Botones por producto (ej. “Pedir chorizo”, “Pedir queso”)
- Registro de pedidos en base de datos
- **Dashboard básico (mobile-first)** para visualizar pedidos
- **Notificaciones en tiempo real dentro de la app (push/web)**
- Confirmación visual al usuario

### No incluido (fuera del MVP)

- Carrito de compras
- Pagos
- Gestión de inventario
- App móvil nativa (se puede usar PWA)

---

## 4. Usuarios

### Usuario principal

- Comercios locales (tiendas)

### Usuario secundario

- Proveedor/distribuidor (usa dashboard y recibe notificaciones)

---

## 5. Flujo principal

1. Cliente accede a su URL única
2. Visualiza botones de productos
3. Presiona un botón
4. Sistema registra pedido
5. Sistema envía notificación en tiempo real
6. Cliente recibe confirmación visual
7. Proveedor visualiza pedido en dashboard

---

## 6. Requisitos funcionales

### RF1: Página por cliente

- URL única por cliente
- Sin login
- Diseño optimizado para móvil

### RF2: Botones de productos

- Lista de productos visibles
- Cada botón genera un pedido independiente

### RF3: Registro de pedidos

Cada pedido debe guardar:

- ID cliente
- Producto
- unidad_medida
- Timestamp

### RF4: Notificaciones en tiempo real

- Notificación automática al recibir pedido
- Debe llegar dentro de la app (web push / tiempo real)

### RF5: Dashboard

- Lista de pedidos recientes
- Visualización en tiempo real
- Estado básico (pendiente)

### RF6: Confirmación

- Mensaje visible: “Pedido enviado”

---

## 7. Requisitos no funcionales

- Mobile-first (principalmente uso en celular)
- Tiempo de respuesta < 2 segundos
- Interfaz simple y clara
- Compatible con PWA (instalable en celular)
- Notificaciones en tiempo real

---

## 8. Modelo de datos (simplificado)

### Tabla: clientes

- id
- nombre
- identificador_url

### Tabla: productos

- id
- nombre

### Tabla: pedidos

- id
- cliente_id
- producto_id
- unidad_medida
- fecha

---

## 9. Arquitectura técnica (MVP)

### Frontend

- Web mobile-first (posible PWA)
- Página cliente + dashboard

### Backend

- Endpoint `/api/pedido`
- Inserción en base de datos
- Trigger de notificación en tiempo real

### Base de datos

- Almacenamiento de pedidos

### Notificaciones

- Web push o realtime (ej. suscripción en cliente proveedor)

---

## 10. API (básica)

### POST /api/pedido

**Body:**

```json
{
  "cliente_id": "string",
  "producto_id": "string",
  "unidad_medida": "string"
}
```

**Respuesta:**

```json
{
  "success": true
}
```

---

## 11. Criterios de éxito

- ≥ 10 pedidos en 2 semanas
- Uso recurrente por al menos 2 comercios
- Notificaciones funcionando en tiempo real
- Dashboard mostrando pedidos correctamente

---

## 12. Plan de validación

1. Implementar MVP
2. Probar con 2–3 comercios reales
3. Validar recepción de notificaciones en tiempo real
4. Medir uso durante 1–2 semanas
5. Recoger feedback

---

## 13. Riesgos

- Baja adopción por parte de comercios
- Problemas con notificaciones en tiempo real
- Dependencia de conexión a internet

---

## 14. Futuras mejoras (post-MVP)

- Multi-proveedor automático
- Historial de pedidos
- Analítica
- Notificaciones avanzadas (WhatsApp)
- Optimización logística

---

## 15. Timeline estimado

- Desarrollo: 2–5 días
- Pruebas: 3–7 días
- Validación: 2 semanas

---

## 16. Definición de “hecho” (Definition of Done)

- Sistema funcional en producción
- Dashboard accesible desde móvil
- Notificaciones en tiempo real funcionando
- Al menos 2 clientes activos
- Pedidos registrados correctamente

---

