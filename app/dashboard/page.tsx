'use client';

import { useState, useEffect } from 'react';
import { supabase, Pedido } from '@/lib/supabase/client';

/**
 * Dashboard: Provider realtime dashboard
 * Styled with Slate Precision design system
 * Groups pedido items by orden_id — one card per order
 */

interface PedidoItem extends Pedido {
  cliente_nombre?: string;
  cliente_direccion?: string;
  cliente_url_maps?: string;
  producto_nombre?: string;
}

interface OrdenGroup {
  orden_id: string;
  cliente_nombre: string;
  cliente_direccion: string;
  cliente_url_maps: string;
  items: PedidoItem[];
  estado: string; // derived from items (most advanced or first non-pendiente)
  created_at: string; // earliest item timestamp
}

export default function DashboardPage() {
  const [pedidos, setPedidos] = useState<PedidoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [latestOrden, setLatestOrden] = useState<OrdenGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  // Sync dark mode class on mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    async function fetchPedidos() {
      try {
        const { data: pedidos, error } = await supabase
          .from('pedidos')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) throw error;

        const { data: clientes } = await supabase.from('clientes').select('id, nombre, direccion, url_maps');
        const { data: productos } = await supabase.from('productos').select('id, nombre');

        const clienteMap = new Map((clientes || []).map(c => [c.id, { nombre: c.nombre, direccion: c.direccion || '', url_maps: c.url_maps || '' }]));
        const productoMap = new Map((productos || []).map(p => [p.id, p.nombre]));

        const pedidosWithDetails = (pedidos || []).map(p => {
          const cliente = clienteMap.get(p.cliente_id);
          return {
            ...p,
            cliente_nombre: cliente?.nombre,
            cliente_direccion: cliente?.direccion,
            cliente_url_maps: cliente?.url_maps,
            producto_nombre: productoMap.get(p.producto_id)
          };
        });

        setPedidos(pedidosWithDetails);
      } catch (err) {
        console.error('Error fetching pedidos:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPedidos();
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('pedidos-dashboard')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pedidos'
      }, async (payload) => {
        const newPedido = payload.new as Pedido;

        const { data: cliente } = await supabase
          .from('clientes').select('nombre, url_maps').eq('id', newPedido.cliente_id).single();
        const { data: producto } = await supabase
          .from('productos').select('nombre').eq('id', newPedido.producto_id).single();

        const pedidoWithDetails: PedidoItem = {
          ...newPedido,
          cliente_nombre: cliente?.nombre,
          cliente_url_maps: cliente?.url_maps,
          producto_nombre: producto?.nombre
        };

        setPedidos(prev => [pedidoWithDetails, ...prev.slice(0, 199)]);

        // Show toast for new order group
        const ordenId = newPedido.orden_id || newPedido.id;
        const group: OrdenGroup = {
          orden_id: ordenId,
          cliente_nombre: cliente?.nombre || 'Cliente',
          cliente_direccion: '',
          cliente_url_maps: cliente?.url_maps || '',
          items: [pedidoWithDetails],
          estado: newPedido.estado,
          created_at: newPedido.created_at
        };
        setLatestOrden(group);

        setTimeout(() => setLatestOrden(null), 4000);
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  async function toggleAtendido(orden: OrdenGroup) {
    const estadoFlow: Record<string, Pedido['estado']> = {
      pendiente: 'despachado',
      despachado: 'entregado',
      entregado: 'pendiente',
      atendido: 'entregado'
    };
    const newEstado = estadoFlow[orden.estado] || 'pendiente';

    // Update all items in the same orden_id
    const itemIds = orden.items.map(item => item.id);
    setPedidos(prev =>
      prev.map(p => itemIds.includes(p.id) ? { ...p, estado: newEstado } : p)
    );

    const { error } = await supabase
      .from('pedidos')
      .update({ estado: newEstado })
      .in('id', itemIds);

    if (error) {
      setPedidos(prev =>
        prev.map(p => itemIds.includes(p.id) ? { ...p, estado: p.estado } : p)
      );
    }
  }

  function groupPedidosByOrden(pedidos: PedidoItem[]): OrdenGroup[] {
    const groups = new Map<string, PedidoItem[]>();

    for (const p of pedidos) {
      const key = p.orden_id || p.id; // fallback for legacy items without orden_id
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(p);
    }

    const result: OrdenGroup[] = [];
    for (const [ordenId, items] of groups.entries()) {
      const first = items[0];
      result.push({
        orden_id: ordenId,
        cliente_nombre: first.cliente_nombre || 'Cliente',
        cliente_direccion: first.cliente_direccion || '',
        cliente_url_maps: first.cliente_url_maps || '',
        items,
        estado: first.estado,
        created_at: items.reduce((earliest, item) =>
          new Date(item.created_at) < new Date(earliest) ? item.created_at : earliest
        , items[0].created_at)
      });
    }

    // Sort by most recent first
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

  const ordenes = groupPedidosByOrden(pedidos);

  const filteredOrdenes = ordenes.filter(o => {
    const matchesSearch = !searchQuery || 
      o.cliente_nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some(item => item.producto_nombre?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  function toggleDarkMode() {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface grid-dot">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-surface-high border-t-primary-container rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface grid-dot">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 z-50 flex justify-between items-center w-full px-6 h-16 bg-surface-bright border-b border-outline-variant">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded transition-colors text-primary hover:bg-surface-high" aria-label="Menú">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="font-manrope text-sm font-semibold tracking-tight uppercase text-primary">
            Pedidos de Clientes
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
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto w-full">
        {/* New orden toast */}
        {latestOrden && (
          <div className="fixed top-20 left-4 right-4 z-20 animate-in slide-in-from-top-4 duration-300">
            <div className="max-w-md mx-auto border border-primary-container rounded-xl p-4 shadow-xl bg-surface-container">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary-container/20">
                  <span className="material-icons text-primary">notifications</span>
                </div>
                <div>
                  <p className="font-semibold text-on-surface">Nuevo pedido</p>
                  <p className="text-sm text-on-surface-variant">
                    {latestOrden.cliente_nombre} — {latestOrden.items.length} item(s)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-section-gap">
          <div className="lg:col-span-12">
            <div className="relative border border-outline-variant bg-surface-container p-1 group focus-within:border-primary-container transition-colors rounded">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <span className="material-icons text-outline group-focus-within:text-primary-container">search</span>
              </div>
              <input 
                className="w-full bg-transparent border-none focus:ring-0 pl-12 pr-4 py-3 text-on-surface placeholder:text-outline-variant rounded"
                placeholder="Buscar por cliente o producto..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Order List Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-h2 text-h2 text-on-surface">Pedidos Recientes</h2>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-amber-500'}`} />
            <span className="text-xs text-on-surface-variant">
              {isConnected ? 'Conectado en tiempo real' : 'Conectando...'}
            </span>
          </div>

          {/* Order Cards */}
          {filteredOrdenes.length === 0 ? (
            <div className="border border-outline-variant bg-surface-container rounded-lg p-12 text-center">
              <span className="material-icons text-6xl text-outline mb-4">inbox</span>
              <h3 className="font-h2 text-h2 mb-2 text-on-surface">Sin pedidos</h3>
              <p className="text-body-sm text-on-surface-variant">
                Los nuevos pedidos aparecerán aquí
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
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-base truncate text-primary">
                        {orden.cliente_nombre}
                      </h3>
                      <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase border ${
                        orden.estado === 'pendiente' ? 'bg-status-pendiente-bg text-status-pendiente border-status-pendiente' :
                        orden.estado === 'despachado' ? 'bg-status-despachado-bg text-status-despachado border-status-despachado' :
                        'bg-status-entregado-bg text-status-entregado border-status-entregado'
                      }`}>
                        {orden.estado}
                      </span>
                    </div>
                    <a 
                      href={orden.cliente_url_maps || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`text-body-sm text-on-surface-variant flex items-center gap-1 hover:opacity-80 hover:scale-105 transition-all duration-200 ${!orden.cliente_url_maps ? 'pointer-events-none' : ''}`}
                    >
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {orden.cliente_direccion || 'Sin dirección'}
                    </a>
                  </div>

                  {/* Items List */}
                  <div className="p-6 flex-grow">
                    <div className="space-y-2">
                      {orden.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-body-sm">
                          <span className="text-on-surface font-medium">
                            {item.cantidad}x {item.producto_nombre || 'Producto'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[12px] text-on-surface-variant flex items-center gap-2 mt-4">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {formatTime(orden.created_at)} - {formatDate(orden.created_at)}
                      <span className="ml-auto font-data-mono text-data-mono">
                        #{orden.orden_id.slice(0, 4)}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 bg-surface-low mt-auto">
                    <button 
                      onClick={() => toggleAtendido(orden)}
                      className="w-full bg-surface-high hover:bg-surface-highest text-primary border border-outline-variant py-3 rounded text-label-caps uppercase transition-all active:scale-95"
                    >
                      Cambiar Estado
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-surface-bright/95 backdrop-blur-sm border-t border-outline-variant">
        <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-all active:scale-90 duration-150" href="/">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-manrope text-[10px] font-medium tracking-wide uppercase">Dashboard</span>
        </a>
        <a className="flex flex-col items-center justify-center text-primary font-bold active:scale-90 duration-150" href="/dashboard">
          <span className="material-symbols-outlined">shopping_cart</span>
          <span className="font-manrope text-[10px] font-medium tracking-wide uppercase">Órdenes</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-all active:scale-90 duration-150" href="/clientes">
          <span className="material-symbols-outlined">groups</span>
          <span className="font-manrope text-[10px] font-medium tracking-wide uppercase">Clientes</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-all active:scale-90 duration-150" href="#">
          <span className="material-symbols-outlined">settings</span>
          <span className="font-manrope text-[10px] font-medium tracking-wide uppercase">Ajustes</span>
        </a>
      </nav>
    </div>
  );
}
