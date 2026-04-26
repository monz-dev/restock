'use client';

import { useState, useEffect } from 'react';
import { supabase, Pedido } from '@/lib/supabase/client';

/**
 * Dashboard: Provider realtime dashboard
 * Styled with Slate Precision design system
 * Uses unified palette - dark mode via CSS variables
 */

interface PedidoWithDetails extends Pedido {
  cliente_nombre?: string;
  cliente_direccion?: string;
  cliente_url_maps?: string;
  producto_nombre?: string;
}

export default function DashboardPage() {
  const [pedidos, setPedidos] = useState<PedidoWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [latestPedido, setLatestPedido] = useState<PedidoWithDetails | null>(null);
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
          .limit(50);

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

        const pedidoWithDetails: PedidoWithDetails = {
          ...newPedido,
          cliente_nombre: cliente?.nombre,
          cliente_url_maps: cliente?.url_maps,
          producto_nombre: producto?.nombre
        };

        setLatestPedido(pedidoWithDetails);
        setPedidos(prev => [pedidoWithDetails, ...prev.slice(0, 49)]);

        setTimeout(() => setLatestPedido(null), 4000);
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  async function toggleAtendido(pedido: PedidoWithDetails) {
    const estadoFlow: Record<string, Pedido['estado']> = {
      pendiente: 'despachado',
      despachado: 'entregado',
      entregado: 'pendiente',
      atendido: 'entregado'
    };
    const newEstado = estadoFlow[pedido.estado] || 'pendiente';

    setPedidos(prev =>
      prev.map(p => p.id === pedido.id ? { ...p, estado: newEstado } : p)
    );

    const { error } = await supabase
      .from('pedidos')
      .update({ estado: newEstado })
      .eq('id', pedido.id);

    if (error) {
      setPedidos(prev =>
        prev.map(p => p.id === pedido.id ? { ...p, estado: pedido.estado } : p)
      );
    }
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

  const filteredPedidos = pedidos.filter(p => {
    const matchesSearch = !searchQuery || 
      p.cliente_nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.producto_nombre?.toLowerCase().includes(searchQuery.toLowerCase());
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
        {/* New pedido toast */}
        {latestPedido && latestPedido.estado === 'pendiente' && (
          <div className="fixed top-20 left-4 right-4 z-20 animate-in slide-in-from-top-4 duration-300">
            <div className="max-w-md mx-auto border border-primary-container rounded-xl p-4 shadow-xl bg-surface-container">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary-container/20">
                  <span className="material-icons text-primary">notifications</span>
                </div>
                <div>
                  <p className="font-semibold text-on-surface">Nuevo pedido</p>
                  <p className="text-sm text-on-surface-variant">
                    {latestPedido.producto_nombre} — {latestPedido.cliente_nombre}
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
          {filteredPedidos.length === 0 ? (
            <div className="border border-outline-variant bg-surface-container rounded-lg p-12 text-center">
              <span className="material-icons text-6xl text-outline mb-4">inbox</span>
              <h3 className="font-h2 text-h2 mb-2 text-on-surface">Sin pedidos</h3>
              <p className="text-body-sm text-on-surface-variant">
                Los nuevos pedidos aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPedidos.map(pedido => (
                <div 
                  key={pedido.id} 
                  className="border border-outline-variant bg-surface-container rounded-lg overflow-hidden hover:border-outline transition-all flex flex-col h-full"
                >
                  <div className="p-6 border-b border-outline-variant bg-surface-high/50">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-base truncate text-primary">
                        {pedido.cliente_nombre || 'Cliente'}
                      </h3>
                      <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase border ${
pedido.estado === 'pendiente' ? 'bg-status-pendiente-bg text-status-pendiente border-status-pendiente' :
                          pedido.estado === 'despachado' ? 'bg-status-despachado-bg text-status-despachado border-status-despachado' :
                          'bg-status-entregado-bg text-status-entregado border-status-entregado'
                      }`}>
                        {pedido.estado}
                      </span>
                    </div>
                    <a 
                      href={pedido.cliente_url_maps || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`text-body-sm text-on-surface-variant flex items-center gap-1 hover:opacity-80 hover:scale-105 transition-all duration-200 ${!pedido.cliente_url_maps ? 'pointer-events-none' : ''}`}
                    >
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {pedido.cliente_direccion || 'Sin dirección'}
                    </a>
                  </div>
                  <div className="p-6 flex-grow">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-body-sm text-on-surface font-medium">
                          {pedido.cantidad}x {pedido.producto_nombre || 'Producto'}
                        </span>
                        <span className="font-data-mono text-data-mono text-on-surface-variant">
                          #{pedido.id.slice(0, 4)}
                        </span>
                      </div>
                      <div className="text-[12px] text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {formatTime(pedido.created_at)} - {formatDate(pedido.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-surface-low mt-auto">
                    <button 
                      onClick={() => toggleAtendido(pedido)}
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