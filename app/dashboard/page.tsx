'use client';

import { useState, useEffect } from 'react';
import { supabase, Pedido, Cliente, Producto } from '@/lib/supabase/client';

/**
 * Dashboard: Provider realtime dashboard
 * Styled with Slate Precision design system
 */

interface PedidoWithDetails extends Pedido {
  cliente_nombre?: string;
  cliente_direccion?: string;
  producto_nombre?: string;
}

// Hardcoded stats - will be calculated from DB after adding address field
const STATS = {
  totalHoy: 124,
  pendientes: 18,
  eficiencia: 94.2,
  tiempoPromedio: '22 min'
};

const ESTADOS = ['pendiente', 'despachado', 'entregado', 'atendido'];

export default function DashboardPage() {
  const [pedidos, setPedidos] = useState<PedidoWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [latestPedido, setLatestPedido] = useState<PedidoWithDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    async function fetchPedidos() {
      try {
        const { data: pedidos, error } = await supabase
          .from('pedidos')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        const { data: clientes } = await supabase.from('clientes').select('id, nombre, direccion');
        const { data: productos } = await supabase.from('productos').select('id, nombre');

        const clienteMap = new Map((clientes || []).map(c => [c.id, { nombre: c.nombre, direccion: c.direccion || '' }]));
        const productoMap = new Map((productos || []).map(p => [p.id, p.nombre]));

        const pedidosWithDetails = (pedidos || []).map(p => {
          const cliente = clienteMap.get(p.cliente_id);
          return {
            ...p,
            cliente_nombre: cliente?.nombre,
            cliente_direccion: cliente?.direccion,
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
          .from('clientes').select('nombre').eq('id', newPedido.cliente_id).single();
        const { data: producto } = await supabase
          .from('productos').select('nombre').eq('id', newPedido.producto_id).single();

        const pedidoWithDetails: PedidoWithDetails = {
          ...newPedido,
          cliente_nombre: cliente?.nombre,
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
    // Cycle through estados: pendiente -> despachado -> entregado
    const estadoFlow: Record<string, string> = {
      pendiente: 'despachado',
      despachado: 'entregado',
      entregado: 'pendiente',
      atendido: 'entregado'
    };
    const newEstado = estadoFlow[pedido.estado] || 'pendiente';

    // Optimistic update
    setPedidos(prev =>
      prev.map(p => p.id === pedido.id ? { ...p, estado: newEstado } : p)
    );

    const { error } = await supabase
      .from('pedidos')
      .update({ estado: newEstado })
      .eq('id', pedido.id);

    if (error) {
      // Revert on error
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

  // Filter pedidos
  const filteredPedidos = pedidos.filter(p => {
    const matchesSearch = !searchQuery || 
      p.cliente_nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.producto_nombre?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterEstado || p.estado === filterEstado;
    return matchesSearch && matchesFilter;
  });

  function toggleDarkMode() {
    setDarkMode(!darkMode);
  }

  const pendientesCount = pedidos.filter(p => p.estado === 'pendiente').length;

  function getEstadoChip(estado: string, isDark: boolean) {
    const styles: Record<string, string> = {
      pendiente: isDark ? 'chip-pendiente' : 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      despachado: isDark ? 'chip-despachado' : 'bg-indigo-100 text-indigo-700 border border-indigo-200',
      entregado: isDark ? 'chip-entregado' : 'bg-green-100 text-green-700 border border-green-200',
      atendido: isDark ? 'chip-entregado' : 'bg-green-100 text-green-700 border border-green-200'
    };
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      despachado: 'Despachado',
      entregado: 'Entregado',
      atendido: 'Entregado'
    };
    return { className: styles[estado] || styles.pendiente, label: labels[estado] || 'Pendiente' };
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-surface grid-dot' : 'bg-gray-50'
      }`}>
        <div className="flex flex-col items-center gap-3">
          <div className={`w-8 h-8 border-4 rounded-full animate-spin ${
            darkMode 
              ? 'border-surface-container-high border-t-primary-container' 
              : 'border-gray-300 border-t-gray-600'
          }`} />
          <p className={`text-sm ${darkMode ? 'text-on-surface-variant' : 'text-gray-500'}`}>
            Cargando...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-surface grid-dot' : 'bg-gray-50'}`}>
      {/* TopAppBar */}
      <header className={`fixed top-0 left-0 z-50 flex justify-between items-center w-full px-6 h-16 ${
        darkMode 
          ? 'bg-surface-bright border-b border-outline-variant' 
          : 'bg-white border-b border-gray-200'
      }`}>
        <div className="flex items-center gap-4">
          <button className={`p-2 rounded transition-colors ${
            darkMode ? 'text-primary hover:bg-surface-container-high' : 'text-gray-700 hover:bg-gray-100'
          }`} aria-label="Menú">
            <span className="material-icons">menu</span>
          </button>
          <h1 className={`font-manrope text-sm font-semibold tracking-tight uppercase ${
            darkMode ? 'text-primary' : 'text-gray-900'
          }`}>
            Pedidos de Clientes
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleDarkMode}
            aria-label="Cambiar tema" 
            className={`p-2 rounded transition-colors ${
              darkMode 
                ? 'text-primary hover:bg-surface-container-high' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="material-icons">
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
            <div className={`max-w-md mx-auto border rounded-xl p-4 shadow-xl ${
              darkMode 
                ? 'bg-surface-container border-primary-container' 
                : 'bg-white border-gray-300'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  darkMode ? 'bg-primary-container/20' : 'bg-blue-100'
                }`}>
                  <span className={`material-icons ${
                    darkMode ? 'text-primary' : 'text-blue-600'
                  }`}>
                    notifications
                  </span>
                </div>
                <div>
                  <p className={`font-semibold ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>Nuevo pedido</p>
                  <p className={`text-sm ${darkMode ? 'text-on-surface-variant' : 'text-gray-500'}`}>
                    {latestPedido.producto_nombre} — {latestPedido.cliente_nombre}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Overview Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-section-gap">
          {/* Search Bar */}
          <div className="lg:col-span-12">
            <div className={`relative border p-1 group focus-within:border-primary-container transition-colors rounded ${
              darkMode 
                ? 'bg-surface-container border-outline-variant' 
                : 'bg-white border-gray-300'
            }`}>
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <span className={`material-icons ${
                  darkMode ? 'text-outline group-focus-within:text-primary-container' : 'text-gray-400 group-focus-within:text-blue-600'
                }`}>
                  search
                </span>
              </div>
              <input 
                className={`w-full bg-transparent border-none focus:ring-0 pl-12 pr-4 py-3 font-body-md rounded ${
                  darkMode 
                    ? 'text-on-surface placeholder:text-outline-variant' 
                    : 'text-gray-900 placeholder:text-gray-400'
                }`}
                placeholder="Buscar por cliente o producto..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* 
          // TODO: Uncomment after adding DB fields for stats calculation
          // Stats require: direccion field in clientes, tiempo_promedio/eficiencia metrics
          
          <div className="lg:col-span-4 bg-surface-container border border-outline-variant p-6 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Total Hoy</span>
              <span className="material-icons text-primary">calendar_today</span>
            </div>
            <div className="font-h1 text-h1 text-on-surface">{STATS.totalHoy}</div>
            <div className="mt-2 text-body-sm text-primary flex items-center gap-1">
              <span className="material-icons text-sm">trending_up</span>
              <span>+12% vs ayer</span>
            </div>
          </div>

          <div className="lg:col-span-4 bg-surface-container border border-outline-variant p-6 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Pendientes</span>
              <span className="material-icons text-error">pending_actions</span>
            </div>
            <div className="font-h1 text-h1 text-on-surface">{pendientesCount}</div>
            <div className="mt-2 text-body-sm text-on-surface-variant">Requieren atención</div>
          </div>

          <div className="lg:col-span-4 bg-surface-container border border-outline-variant p-6 rounded-lg border-l-4 border-l-primary-container">
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Eficiencia</span>
              <span className="material-icons text-primary-container">speed</span>
            </div>
            <div className="font-h1 text-h1 text-on-surface">{STATS.eficiencia}%</div>
            <div className="mt-2 text-body-sm text-on-surface-variant">Tiempo promedio: {STATS.tiempoPromedio}</div>
          </div>
          */}
        </section>

        {/* Order List Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`font-h2 text-h2 ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>Pedidos Recientes</h2>
            <div className="flex gap-2">
              {/* 
              // TODO: Uncomment after implementing filter functionality
              <button 
                onClick={() => setFilterEstado(filterEstado ? null : 'pendiente')}
                className={`px-4 py-2 rounded text-label-caps uppercase transition-colors ${
                  filterEstado === 'pendiente' 
                    ? 'bg-primary-container text-on-primary-container' 
                    : darkMode
                      ? 'bg-secondary-container text-on-secondary-container hover:bg-surface-high'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Filtrar
              </button>
              
              // TODO: Uncomment after implementing export functionality
              <button className={`px-4 py-2 rounded text-label-caps uppercase transition-colors ${
                darkMode
                  ? 'bg-primary-container hover:bg-primary text-on-primary-container'
                  : 'bg-gray-900 hover:bg-gray-800 text-white'
              }`}>
                Exportar
              </button>
              */}
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-amber-500'}`} />
            <span className={`text-xs ${darkMode ? 'text-on-surface-variant' : 'text-gray-500'}`}>
              {isConnected ? ' Conectado en tiempo real' : ' Conectando...'}
            </span>
          </div>

          {/* Order Cards */}
          {filteredPedidos.length === 0 ? (
            <div className={`border rounded-lg p-12 text-center ${
              darkMode 
                ? 'bg-surface-container border-outline-variant' 
                : 'bg-white border-gray-200'
            }`}>
              <span className={`material-icons text-6xl mb-4 ${
                darkMode ? 'text-outline' : 'text-gray-300'
              }`}>
                inbox
              </span>
              <h3 className={`font-h2 text-h2 mb-2 ${
                darkMode ? 'text-on-surface' : 'text-gray-900'
              }`}>
                Sin pedidos
              </h3>
              <p className={`text-body-sm ${
                darkMode ? 'text-on-surface-variant' : 'text-gray-500'
              }`}>
                Los nuevos pedidos aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPedidos.map(pedido => {
                const chip = getEstadoChip(pedido.estado, darkMode);
                return (
                  <div 
                    key={pedido.id} 
                    className={`border rounded-lg overflow-hidden hover:border transition-all flex flex-col h-full ${
                      darkMode 
                        ? 'bg-surface-container border-outline-variant' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className={`p-6 border-b ${
                      darkMode 
                        ? 'border-outline-variant bg-surface-high/30' 
                        : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-h2 text-body-md font-bold truncate ${
                          darkMode ? 'text-primary' : 'text-blue-600'
                        }`}>
                          {pedido.cliente_nombre || 'Cliente'}
                        </h3>
                        <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${chip.className}`}>
                          {chip.label}
                        </span>
                      </div>
                      <p className={`text-body-sm flex items-center gap-1 ${
                        darkMode ? 'text-on-surface-variant' : 'text-gray-500'
                      }`}>
                        <span className="material-icons text-sm">location_on</span>
                        {pedido.cliente_direccion || 'Sin dirección'}
                      </p>
                    </div>
                    <div className="p-6 flex-grow">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className={`text-body-sm font-medium truncate ${
                            darkMode ? 'text-on-surface' : 'text-gray-900'
                          }`}>
                            {pedido.cantidad}x {pedido.producto_nombre || 'Producto'}
                          </span>
                          <span className={`font-data-mono text-data-mono ${
                            darkMode ? 'text-on-surface-variant' : 'text-gray-500'
                          }`}>
                            #{pedido.id.slice(0, 4)}
                          </span>
                        </div>
                        <div className={`text-[12px] flex items-center gap-2 ${
                          darkMode ? 'text-on-surface-variant' : 'text-gray-400'
                        }`}>
                          <span className="material-icons text-sm">schedule</span>
                          {formatTime(pedido.created_at)} - {formatDate(pedido.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className={`p-4 mt-auto ${
                      darkMode ? 'bg-surface-low' : 'bg-gray-50'
                    }`}>
                      <button 
                        onClick={() => toggleAtendido(pedido)}
                        className={`w-full py-3 rounded font-label-caps uppercase transition-all active:scale-95 ${
                          darkMode 
                            ? 'bg-surface-high hover:bg-surface-highest text-primary border border-outline-variant'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300'
                        }`}
                      >
                        Cambiar Estado
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* BottomNavBar */}
      <nav className={`fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 border-t ${
        darkMode 
          ? 'bg-surface-bright/95 backdrop-blur-sm border-outline-variant'
          : 'bg-white/95 backdrop-blur-sm border-gray-200'
      }`}>
        <a className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-150 ${
          darkMode ? 'text-surface-highest hover:text-primary' : 'text-gray-500 hover:text-gray-700'
        }`} href="/">
          <span className="material-icons">dashboard</span>
          <span className={`font-manrope text-[10px] font-medium tracking-wide uppercase ${
            darkMode ? '' : 'text-gray-600'
          }`}>
            Dashboard
          </span>
        </a>
        <a className={`flex flex-col items-center justify-center active:scale-90 duration-150 ${
          darkMode ? 'text-primary font-bold' : 'text-gray-900 font-semibold'
        }`} href="/dashboard">
          <span className="material-icons">shopping_cart</span>
          <span className={`font-manrope text-[10px] font-medium tracking-wide uppercase ${
            darkMode ? '' : 'text-gray-600'
          }`}>
            Pedidos
          </span>
        </a>
        <a className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-150 ${
          darkMode ? 'text-surface-highest hover:text-primary' : 'text-gray-500 hover:text-gray-700'
        }`} href="/clientes">
          <span className="material-icons">groups</span>
          <span className={`font-manrope text-[10px] font-medium tracking-wide uppercase ${
            darkMode ? '' : 'text-gray-600'
          }`}>
            Clientes
          </span>
        </a>
        <a className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-150 ${
          darkMode ? 'text-surface-highest hover:text-primary' : 'text-gray-500 hover:text-gray-700'
        }`} href="#">
          <span className="material-icons">settings</span>
          <span className={`font-manrope text-[10px] font-medium tracking-wide uppercase ${
            darkMode ? '' : 'text-gray-600'
          }`}>
            Ajustes
          </span>
        </a>
      </nav>
    </div>
  );
}