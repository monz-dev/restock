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
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(true);

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
        console.log('User ID from session:', userId);

        // Get assigned client ID for this user
        const { data: usuarioCliente, error: ucError } = await supabase
          .from('usuario_clientes')
          .select('cliente_id')
          .eq('usuario_id', userId)
          .maybeSingle();

        console.log('usuario_clientes result for user:', { usuarioCliente, ucError });

        if (ucError) {
          console.error('Error fetching usuario_clientes:', ucError);
          setError('Error al cargar datos');
          setLoading(false);
          return;
        }

        if (!usuarioCliente) {
          setError('No tienes clientes asignados. Contacta al administrador.');
          setLoading(false);
          return;
        }

        // Fetch cliente details separately
        const { data: clienteData, error: clienteError } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', usuarioCliente.cliente_id)
          .maybeSingle();

        if (clienteError) {
          console.error('Error fetching cliente:', clienteError);
          setError('Error al cargar datos del cliente');
          setLoading(false);
          return;
        }

        if (!clienteData) {
          setError('Cliente no encontrado');
          setLoading(false);
          return;
        }

        setClienteAsignado(clienteData);

        // Fetch pedidos for this cliente
        const { data: pedidosData } = await supabase
          .from('pedidos')
          .select('*')
          .eq('cliente_id', clienteData.id)
          .order('created_at', { ascending: false });

        const allProductoIds = (pedidosData || []).map((p: any) => p.producto_id);
        const uniqueProductoIds = Array.from(new Set(allProductoIds));

        let productos: any[] = [];
        if (uniqueProductoIds.length > 0) {
          const { data: productosData } = await supabase
            .from('productos')
            .select('id, nombre, precio, unidad_medida')
            .in('id', uniqueProductoIds);
          productos = productosData || [];
        }

        const productoMap = new Map((productos || []).map((p: any) => [p.id, p]));

        const pedidosWithDetails = (pedidosData || []).map((p: any) => {
          const producto = productoMap.get(p.producto_id);
          return {
            ...p,
            producto_nombre: producto?.nombre,
            producto_precio: producto?.precio,
            unidad_medida: producto?.unidad_medida
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
        {/* Client Info Card */}
        {clienteAsignado && (
          <div className="mb-6 p-4 border border-outline-variant bg-surface-container rounded-lg">
            <p className="text-xs text-on-surface-variant uppercase tracking-wide mb-1">Cliente</p>
            <h2 className="text-lg font-semibold text-on-surface">{clienteAsignado.nombre}</h2>
            {clienteAsignado.direccion && (
              <a 
                href={clienteAsignado.url_maps || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-on-surface-variant flex items-center gap-1 hover:text-primary mt-1"
              >
                <span className="material-symbols-outlined text-sm">location_on</span>
                {clienteAsignado.direccion}
              </a>
            )}
          </div>
        )}

        {/* Orders Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-h2 text-h2 text-on-surface">Historial de Pedidos</h2>
            <span className="text-sm text-on-surface-variant">{ordenes.length} orders</span>
          </div>

          {ordenes.length === 0 ? (
            <div className="border border-outline-variant bg-surface-container rounded-lg p-12 text-center">
              <span className="material-icons text-6xl text-outline mb-4">inbox</span>
              <h3 className="font-h2 text-h2 mb-2 text-on-surface">Sin pedidos</h3>
              <p className="text-body-sm text-on-surface-variant">
                Aún no has hecho ningún pedido
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {ordenes.map(orden => (
                <div 
                  key={orden.orden_id} 
                  className="border border-outline-variant bg-surface-container rounded-lg overflow-hidden hover:border-outline transition-all flex flex-col h-full"
                >
                  {/* Header */}
                  <div className="p-6 border-b border-outline-variant bg-surface-high/50">
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
                        <div key={item.id} className="flex justify-between items-center text-body-sm">
                          <span className="text-on-surface font-medium">
                            {item.cantidad}x {item.producto_nombre || 'Producto'}
                          </span>
                          <span className="text-on-surface-variant">
                            {formatCurrency(Number(item.producto_precio) * item.cantidad)}
                          </span>
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