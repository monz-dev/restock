'use client';

import { useState, useEffect } from 'react';
import { supabase, Pedido, Cliente, Producto } from '@/lib/supabase/client';

/**
 * Dashboard: Provider realtime dashboard
 * Mobile-first: clean list, clear states, thumb-friendly actions
 */

interface PedidoWithDetails extends Pedido {
  cliente_nombre?: string;
  producto_nombre?: string;
}

export default function DashboardPage() {
  const [pedidos, setPedidos] = useState<PedidoWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [latestPedido, setLatestPedido] = useState<PedidoWithDetails | null>(null);

  useEffect(() => {
    async function fetchPedidos() {
      try {
        const { data: pedidos, error } = await supabase
          .from('pedidos')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        const { data: clientes } = await supabase.from('clientes').select('id, nombre');
        const { data: productos } = await supabase.from('productos').select('id, nombre');

        const clienteMap = new Map((clientes || []).map(c => [c.id, c.nombre]));
        const productoMap = new Map((productos || []).map(p => [p.id, p.nombre]));

        const pedidosWithDetails = (pedidos || []).map(p => ({
          ...p,
          cliente_nombre: clienteMap.get(p.cliente_id),
          producto_nombre: productoMap.get(p.producto_id)
        }));

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
    const newEstado = pedido.estado === 'pendiente' ? 'atendido' : 'pendiente';

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

  const pendientes = pedidos.filter(p => p.estado === 'pendiente');
  const atendidos = pedidos.filter(p => p.estado === 'atendido');

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-zinc-900">Pedidos</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-xs text-zinc-500">
                  {isConnected ? 'En vivo' : 'Conectando...'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${pendientes.length > 0 ? 'text-orange-600' : 'text-zinc-400'}`}>
                {pendientes.length}
              </div>
              <div className="text-xs text-zinc-400">pendientes</div>
            </div>
          </div>
        </div>
      </header>

      {/* New pedido toast */}
      {latestPedido && latestPedido.estado === 'pendiente' && (
        <div className="fixed top-20 left-4 right-4 z-20 animate-in slide-in-from-top-4 duration-300">
          <div className="max-w-md mx-auto bg-zinc-900 text-white rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-xl">
                🔔
              </div>
              <div>
                <p className="font-semibold">Nuevo pedido</p>
                <p className="text-sm text-zinc-400">
                  {latestPedido.producto_nombre} — {latestPedido.cliente_nombre}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pedidos List */}
      <main className="max-w-md mx-auto px-4 py-6">
        {pedidos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-lg font-medium text-zinc-900 mb-1">Sin pedidos</h2>
            <p className="text-sm text-zinc-500">Los nuevos pedidos aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pendientes */}
            {pendientes.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  Pendientes
                </h2>
                <div className="space-y-3">
                  {pendientes.map(pedido => (
                    <PedidoCard
                      key={pedido.id}
                      pedido={pedido}
                      onToggle={toggleAtendido}
                      formatTime={formatTime}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Atendidos */}
            {atendidos.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  Atendidos
                </h2>
                <div className="space-y-3">
                  {atendidos.map(pedido => (
                    <PedidoCard
                      key={pedido.id}
                      pedido={pedido}
                      onToggle={toggleAtendido}
                      formatTime={formatTime}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function PedidoCard({
  pedido,
  onToggle,
  formatTime,
  formatDate
}: {
  pedido: PedidoWithDetails;
  onToggle: (p: PedidoWithDetails) => void;
  formatTime: (s: string) => string;
  formatDate: (s: string) => string;
}) {
  const isPendiente = pedido.estado === 'pendiente';

  return (
    <div
      className={`
        bg-white rounded-2xl p-4 shadow-sm
        border-l-4 transition-all
        ${isPendiente ? 'border-orange-500' : 'border-emerald-500 opacity-70'}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">
              {isPendiente ? '🆕' : '✅'}
            </span>
            <h3 className="font-semibold text-zinc-900 truncate">
              {pedido.producto_nombre || 'Producto'}
            </h3>
          </div>
          <p className="text-sm text-zinc-500 truncate">
            {pedido.cliente_nombre || 'Cliente'}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
            <span>{formatDate(pedido.created_at)}</span>
            <span>•</span>
            <span>{formatTime(pedido.created_at)}</span>
          </div>
        </div>
        <button
          onClick={() => onToggle(pedido)}
          className={`
            flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium
            transition-all active:scale-95
            ${isPendiente
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }
          `}
        >
          {isPendiente ? 'Atender' : 'Pendiente'}
        </button>
      </div>
    </div>
  );
}