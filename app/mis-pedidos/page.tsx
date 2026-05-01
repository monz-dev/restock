'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getSession, signOut } from '@/lib/supabase/client';
import { AuthGuard } from '@/components/AuthGuard';

interface PedidoItem {
  id: string;
  cliente_id: string;
  producto_id: string;
  cantidad: number;
  estado: string;
  created_at: string;
  orden_id: string;
  producto_nombre?: string;
  producto_precio?: number;
  unidad_medida?: string;
  proveedor_nombre?: string;
  proveedor_logo?: string;
}

interface OrdenGroup {
  orden_id: string;
  items: PedidoItem[];
  estado: string;
  created_at: string;
  total: number;
}

function MisPedidosContent() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<PedidoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clienteAsignado, setClienteAsignado] = useState<any>(null);
  const [clientesAsignados, setClientesAsignados] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dark mode toggle
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  function toggleDarkMode() {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  async function handleLogout() {
    await signOut();
    router.push('/login');
  }

  useEffect(() => {
    async function fetchMisPedidos() {
      try {
        const session = await getSession();
        if (!session?.user) {
          router.push('/login');
          return;
        }

        const userId = (session as any).user?.id;

        // Get all assigned clients for this user
        const { data: allAssignments, error: assignmentsError } = await supabase
          .from('usuario_clientes')
          .select('cliente_id')
          .eq('usuario_id', userId);

        if (assignmentsError) {
          console.error('Error fetching assignments:', assignmentsError);
          setError('Error al cargar datos');
          setLoading(false);
          return;
        }

        if (!allAssignments || allAssignments.length === 0) {
          setError('No tienes clientes asignados. Contacta al administrador.');
          setLoading(false);
          return;
        }

        // Get all assigned clientes details
        const clienteIds = allAssignments.map((a: any) => a.cliente_id);
        const { data: clientesData, error: clientesError } = await supabase
          .from('clientes')
          .select('*')
          .in('id', clienteIds);

        if (clientesError) {
          console.error('Error fetching clientes:', clientesError);
        }

        const clientes = clientesData || [];
        setClientesAsignados(clientes);

        // Use first client as the main one for pedidos view
        const mainCliente = clientes[0];
        setClienteAsignado(mainCliente);

        // Fetch pedidos for the main cliente
        const { data: pedidosData } = await supabase
          .from('pedidos')
          .select('*')
          .eq('cliente_id', mainCliente.id)
          .order('created_at', { ascending: false });

        const allProductoIds = (pedidosData || []).map((p: any) => p.producto_id);
        const uniqueProductoIds = Array.from(new Set(allProductoIds));

        let productos: any[] = [];
        if (uniqueProductoIds.length > 0) {
          const { data: productosData } = await supabase
            .from('productos')
            .select('id, nombre, precio, unidad_medida, proveedor_id')
            .in('id', uniqueProductoIds);
          productos = productosData || [];
        }

        // Get all unique proveedor IDs
        const proveedorIds = Array.from(new Set(productos.map(p => p.proveedor_id).filter(Boolean)));
        
        let proveedores: any[] = [];
        if (proveedorIds.length > 0) {
          const { data: proveedoresData } = await supabase
            .from('proveedores')
            .select('id, nombre, url_logo')
            .in('id', proveedorIds);
          proveedores = proveedoresData || [];
        }

        const productoMap = new Map((productos || []).map((p: any) => [p.id, p]));
        const proveedorMap = new Map((proveedores || []).map((p: any) => [p.id, { nombre: p.nombre, logo: p.url_logo }]));

        const pedidosWithDetails = (pedidosData || []).map((p: any) => {
          const producto = productoMap.get(p.producto_id);
          const proveedor = producto ? proveedorMap.get(producto.proveedor_id) : null;
          return {
            ...p,
            producto_nombre: producto?.nombre,
            producto_precio: producto?.precio,
            unidad_medida: producto?.unidad_medida,
            proveedor_nombre: proveedor?.nombre,
            proveedor_logo: proveedor?.logo
          };
        });

        setPedidos(pedidosWithDetails);
      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar pedidos');
      } finally {
        setLoading(false);
      }
    }

    fetchMisPedidos();
  }, [router]);

  function groupPedidosByOrden(pedidos: PedidoItem[]): OrdenGroup[] {
    const groups = new Map<string, PedidoItem[]>();
    pedidos.forEach(p => {
      const key = p.orden_id || p.id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    });

    const result: OrdenGroup[] = [];
    groups.forEach((items, ordenId) => {
      const total = items.reduce((sum, item) => {
        return sum + (Number(item.producto_precio) || 0) * item.cantidad;
      }, 0);
      result.push({ orden_id: ordenId, items, estado: items[0].estado, created_at: items[0].created_at, total });
    });

    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return result;
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
  }

  const ordenes = groupPedidosByOrden(pedidos);

  // Filter ordenes by search query (proveedor or producto)
  const filteredOrdenes = ordenes.filter(o => {
    const matchesSearch = !searchQuery || 
      o.items[0]?.proveedor_nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some(item => item.producto_nombre?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface grid-dot">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-surface-high border-t-primary-container rounded-full animate-spin" />
        <p className="text-sm text-on-surface-variant">Cargando pedidos...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-surface grid-dot">
      <div className="flex flex-col items-center gap-3">
        <span className="material-icons text-6xl text-error mb-4">error</span>
        <h2 className="text-xl font-semibold text-on-surface mb-2">Sin clientes asignados</h2>
        <p className="text-on-surface-variant mb-4">{error}</p>
        <button onClick={() => router.push('/login')} className="px-4 py-2 bg-primary-container text-on-primary-container rounded">Cerrar Sesión</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface grid-dot">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 z-50 flex justify-between items-center w-full px-6 h-16 bg-surface-bright border-b border-outline-variant">
        <div className="flex items-center gap-4">
          <h1 className="font-manrope text-sm font-semibold tracking-tight uppercase text-primary">
            Mis Pedidos
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleDarkMode}
            aria-label="Cambiar tema" 
            className="p-2 rounded transition-colors text-primary hover:bg-surface-high"
          >
            <span className="material-symbols-outlined">
              {darkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button 
            onClick={handleLogout}
            aria-label="Cerrar sesión" 
            className="p-2 rounded transition-colors text-primary hover:bg-surface-high"
          >
            <span className="material-symbols-outlined">
              logout
            </span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto w-full">
        {/* Clients Section - Show all assigned clients */}
        {clientesAsignados.length > 0 && (
          <section className="mb-8">
            <h2 className="font-h2 text-h2 text-on-surface mb-4">Mis Establecimientos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clientesAsignados.map(cliente => (
                <a
                  key={cliente.id}
                  href={`/${cliente.slug}`}
                  className="block p-4 border border-outline-variant bg-surface-container rounded-lg hover:border-primary transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                        {cliente.nombre}
                      </h3>
                      {cliente.direccion && (
                        <p className="text-sm text-on-surface-variant mt-1">
                          {cliente.direccion}
                        </p>
                      )}
                    </div>
                    <span className="material-symbols-outlined text-primary">arrow_forward</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Search Section */}
        <section className="mb-6">
          <div className="relative border border-outline-variant bg-surface-container p-1 group focus-within:border-primary-container transition-colors rounded">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-icons text-outline group-focus-within:text-primary-container">search</span>
            </div>
            <input 
              className="w-full bg-transparent border-none focus:ring-0 pl-12 pr-4 py-3 text-on-surface placeholder:text-outline-variant rounded"
              placeholder="Buscar por proveedor o producto..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        {/* Orders Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-h2 text-h2 text-on-surface">Historial de Pedidos</h2>
            <span className="text-sm text-on-surface-variant">{filteredOrdenes.length} orders</span>
          </div>

          {filteredOrdenes.length === 0 ? (
            <div className="border border-outline-variant bg-surface-container rounded-lg p-12 text-center">
              <span className="material-icons text-6xl text-outline mb-4">inbox</span>
              <h3 className="font-h2 text-h2 mb-2 text-on-surface">Sin pedidos</h3>
              <p className="text-body-sm text-on-surface-variant">
                Aún no has hecho ningún pedido
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredOrdenes.map(orden => (
                <div 
                  key={orden.orden_id} 
                  className="border border-outline-variant bg-surface-container rounded-lg overflow-hidden hover:border-outline transition-all flex flex-col h-full"
                >
                  {/* Header */}
                  <div className="p-6 border-b border-outline-variant bg-surface-high/50">
                    {/* Provider name with logo */}
                    {(orden.items[0]?.proveedor_nombre || orden.items[0]?.proveedor_logo) && (
                      <div className="flex items-center gap-3 mb-3">
                        {orden.items[0]?.proveedor_logo ? (
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-surface flex items-center justify-center">
                            <img 
                              src={orden.items[0].proveedor_logo} 
                              alt={orden.items[0].proveedor_nombre}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <span className="material-symbols-outlined text-lg text-primary">store</span>
                        )}
                        <span className="text-sm font-semibold text-primary">
                          {orden.items[0].proveedor_nombre}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase border ${
                        orden.estado === 'pendiente' ? 'bg-status-pendiente-bg text-status-pendiente border-status-pendiente' :
                        orden.estado === 'despachado' ? 'bg-status-despachado-bg text-status-despachado border-status-despachado' :
                        'bg-status-entregado-bg text-status-entregado border-status-entregado'
                      }`}>
                        {orden.estado}
                      </span>
                    </div>
                    <div className="text-[12px] text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {formatTime(orden.created_at)} - {formatDate(orden.created_at)}
                      <span className="ml-auto font-data-mono text-data-mono">
                        #{orden.orden_id.slice(0, 4)}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-6 flex-grow">
                    <div className="space-y-2">
                      {orden.items.map(item => (
                        <div key={item.id} className="text-body-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-on-surface font-medium">
                              {item.cantidad}x {item.producto_nombre || 'Producto'}
                            </span>
                            <span className="text-on-surface-variant">
                              {formatCurrency(Number(item.producto_precio) * item.cantidad)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer with Total */}
                  <div className="p-4 bg-surface-low mt-auto border-t border-outline-variant">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-on-surface">Total</span>
                      <span className="text-lg font-bold text-primary">{formatCurrency(orden.total)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function MisPedidosPage() {
  return (
    <AuthGuard requiredPermiso="ver_pedidos_propios" loadingMessage="Cargando...">
      <MisPedidosContent />
    </AuthGuard>
  );
}