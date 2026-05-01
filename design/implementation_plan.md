# Reestructuración de Arquitectura por Roles

Plan para adecuar la estructura del proyecto según los roles que necesitas (`OWNER`, `ADMIN`, `PROVEEDOR`, `CLIENTE`, `REPARTIDOR`), asegurándonos de NO romper lo que ya está funcionando en producción.

## Background

El proyecto actualmente es un MVP en Next.js (App Router) y Supabase. 
La estructura real (basada en el sistema de archivos actual) tiene las rutas `dashboard`, `mis-pedidos` y `login` en la raíz de `app/`, a diferencia del `README.md` que las marcaba en grupos de rutas `(dashboard)` y `(auth)`. 

Tenemos que agregar nuevas pantallas, reestructurar la navegación (footer) y añadir un sistema robusto de control de acceso basado en roles (RBAC) con una estrategia aditiva para evitar _downtime_ en producción.

## User Review Required

> [!IMPORTANT]
> **Base de Datos:** Necesitamos confirmar cómo están mapeados los roles actualmente en Supabase. ¿Están en un campo `role` de la tabla `usuarios` o se usa un enum? Este plan propone añadir los nuevos roles sin modificar los existentes temporalmente, para asegurar retrocompatibilidad.
> **Pantalla de Finanzas:** El rol `ADMIN` no debe ver las "pantallas financieras". Actualmente no existe una pantalla financiera. ¿Deseas que la creemos ahora (por ejemplo, `/dashboard/finanzas`) o solo preparamos la lógica para cuando exista?

## Proposed Changes

### Estructura de Rutas (Next.js App Router)
Vamos a agrupar todas las rutas que requieren autenticación bajo un grupo `(protected)`. Esto permite tener un **único `layout.tsx`** que maneje el Footer condicional sin afectar páginas públicas como el catálogo `[slug]` o el login.

#### [NEW] app/(protected)/layout.tsx
- Contendrá la validación de sesión principal.
- Renderizará el `FooterNavigation` pasándole el rol del usuario autenticado.

#### [NEW] app/(protected)/finanzas/page.tsx
- Pantalla exclusiva para el **OWNER**. (Métricas globales, ingresos).

#### [NEW] app/(protected)/repartos/page.tsx
- Pantalla exclusiva para el **REPARTIDOR**. Lista de pedidos asignados con estado "En camino" para poder marcarlos como "Entregados".

#### [MODIFY] Rutas Existentes
Moveremos las rutas actuales dentro del grupo protegido para consolidar el layout:
- `app/dashboard` -> `app/(protected)/pedidos` (o mantener `/dashboard`, pero haciéndolo la vista del PROVEEDOR).
- `app/mis-pedidos` -> `app/(protected)/mis-pedidos` (Vista del CLIENTE).
- `app/admin` (si existe, crearla) -> `app/(protected)/admin`.

---

### Lógica de Control de Acceso (Middleware / Layout)

#### [MODIFY] middleware.ts (o equivalente)
- **Reglas de Redirección Inteligente:**
  - Si un usuario hace login, se le redirige según su rol:
    - `OWNER` / `ADMIN` -> `/dashboard` (vista gerencial)
    - `PROVEEDOR` -> `/pedidos` (sus clientes)
    - `CLIENTE` -> `/mis-pedidos`
    - `REPARTIDOR` -> `/repartos`
- **Protección de Rutas (Server-side):**
  - Impedir que `ADMIN` entre a `/finanzas`.
  - Impedir que `CLIENTE` entre a `/pedidos` de proveedor.

---

### Adecuación del Footer / Navegación

#### [MODIFY] components/FooterNavigation.tsx (Nuevo o Existente)
Crearemos un componente cliente que muestre iconos distintos dependiendo del rol:
- **OWNER**: [Home] [Pedidos] [Finanzas] [Admin]
- **ADMIN**: [Home] [Pedidos] [Admin]
- **PROVEEDOR**: [Mis Pedidos Asignados] [Perfil]
- **CLIENTE**: [Mis Pedidos] [Catálogo]
- **REPARTIDOR**: [Ruta/Repartos] [Perfil]

---

### Pasos Seguros (Zero-Downtime Migration)

Para no romper producción, los pasos serán:

1. **Fase 1: Base de datos y Tipos:**
   - Se creo el nuevo rol (`owner`) a la tabla/enum.
   - Actualizar los tipos de TypeScript (`types/index.ts` o similares) para el rol creado.
2. **Fase 2: Componentes Aislados:**
   - Crear el nuevo `FooterNavigation.tsx` (pero no reemplazar el viejo aún).
   - Crear las páginas `/finanzas` y `/repartos` de forma aislada.
3. **Fase 3: Agrupación y Layouts:**
   - Mover el código al grupo `(protected)`. En Next.js esto no cambia las URLs externas, por lo que los marcadores de los usuarios no se romperán (la URL `/mis-pedidos` seguirá siendo `/mis-pedidos` aunque esté en `app/(protected)/mis-pedidos`).
4. **Fase 4: Despliegue:**
   - Testear localmente. Una vez en producción, el sistema convivirá perfectamente con los usuarios actuales.

## Verification Plan

### Automated Tests
- Validar mediante el compilador de TypeScript que todos los enums de roles estén actualizados en todos los componentes.
- Si hay test unitarios, correr validaciones sobre la lógica de RBAC.

### Manual Verification
- Iniciar sesión con un usuario de prueba para CADA rol y verificar que:
  - El ruteo post-login es correcto.
  - El Footer muestra exactamente los botones permitidos.
  - El acceso forzado por URL (ej. un repartidor intentando entrar a `/finanzas`) sea rechazado.
