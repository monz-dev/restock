'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, Pedido, Cliente, Producto } from '@/lib/supabase/client';
import NotificationToast from '@/components/NotificationToast';

/**
 * Dashboard: Provider realtime dashboard
 * Shows incoming orders, allows marking as attended
 * Features: realtime subscription, polling fallback
 */

interface PedidoWithDetails extends Pedido {
  cliente_nombre?: string;
  producto_nombre?: string;
}

interface DashboardState {
  pedidos: PedidoWithDetails[];
  loading: boolean;
  error: string | null;
}

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>({
    pedidos: [],
    loading: true,
    error: null
  });
  const [isConnected, setIsConnected] = useState(false);
  const [latestPedido, setLatestPedido] = useState<PedidoWithDetails | null>(null);

  // Fetch initial pedidos + cliente/producto details
  useEffect(() => {
    async function fetchPedidos() {
      try {
        // Fetch last 50 pedidos
        const { data: pedidos, error } = await supabase
          .from('pedidos')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        // Fetch clientes and productos for details
        const { data: clientes } = await supabase.from('clientes').select('id, nombre');
        const { data: productos } = await supabase.from('productos').select('id, nombre');

        const clienteMap = new Map((clientes || []).map(c => [c.id, c.nombre]));
        const productoMap = new Map((productos || []).map(p => [p.id, p.nombre]));

        // Map details to pedidos
        const pedidosWithDetails = (pedidos || []).map(p => ({
          ...p,
          cliente_nombre: clienteMap.get(p.cliente_id),
          producto_nombre: productoMap.get(p.producto_id)
        }));

        setState(prev => ({ ...prev, pedidos: pedidosWithDetails, loading: false }));
      } catch (err) {
        setState(prev => ({ ...prev, loading: false, error: 'Error al cargar pedidos' }));
      }
    }

    fetchPedidos();
  }, []);

  // Realtime subscription + polling fallback
  useEffect(() => {
    const supabaseClient = supabase;

    // Channel for realtime pedidos
    const channel = supabaseClient
      .channel('pedidos-dashboard')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pedidos'
      }, async (payload) => {
        // New pedido inserted - fetch details and add to list
        const newPedido = payload.new as Pedido;
        
        // Get cliente/producto names
        const { data: cliente } = await supabaseClient
          .from('clientes').select('nombre').eq('id', newPedido.cliente_id).single();
        const { data: producto } = await supabaseClient
          .from('productos').select('nombre').eq('id', newPedido.producto_id).single();

        const pedidoWithDetails: PedidoWithDetails = {
          ...newPedido,
          cliente_nombre: cliente?.nombre,
          producto_nombre: producto?.nombre
        };

        // Trigger notification
        setLatestPedido(pedidoWithDetails);

        // Update list
        setState(prev => ({
          ...prev,
          pedidos: [pedidoWithDetails, ...prev.pedidos.slice(0, 49)]
        }));
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Polling fallback every 30 seconds if not connected
    const pollingInterval = setInterval(() => {
      if (!isConnected) {
        // Re-fetch pedidos
        supabaseClient
          .from('pedidos')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
          .then(({ data }) => {
            if (data) {
              // Re-fetch details
              supabaseClient.from('clientes').select('id, nombre').then(({ data: clientes }) => {
                supabaseClient.from('productos').select('id, nombre').then(({ data: productos }) => {
                  const clienteMap = new Map((clientes || []).map(c => [c.id, c.nombre]));
                  const productoMap = new Map((productos || []).map(p => [p.id, p.nombre]));
                  
                  const pedidosWithDetails = (data as Pedido[]).map(p => ({
                    ...p,
                    cliente_nombre: clienteMap.get(p.cliente_id),
                    producto_nombre: productoMap.get(p.producto_id)
                  }));
                  
                  setState(prev => ({ ...prev, pedidos: pedidosWithDetails }));
                });
              });
            }
          });
      }
    }, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(pollingInterval);
    };
  }, [isConnected]);

  // Toggle attended state
  async function toggleAtendido(pedido: PedidoWithDetails) {
    const newEstado = pedido.estado === 'pendiente' ? 'atendido' : 'pendiente';
    
    // Optimistic update
    setState(prev => ({
      ...prev,
      pedidos: prev.pedidos.map(p => 
        p.id === pedido.id ? { ...p, estado: newEstado } : p
      )
    }));

    // Update in database
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: newEstado })
      .eq('id', pedido.id);

    if (error) {
      // Revert on error
      setState(prev => ({
        ...prev,
        pedidos: prev.pedidos.map(p => 
          p.id === pedido.id ? { ...p, estado: pedido.estado } : p
        )
      }));
    }
  }

  // Format time
  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }

  // Loading state
  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Pedidos</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-sm text-gray-500">
              {isConnected ? 'Tiempo real' : 'Sincronizando...'}
            </span>
          </div>
        </div>
      </header>

      {/* Pedidos list */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* Empty state */}
        {state.pedidos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay pedidos todavía</p>
            <p className="text-sm text-gray-400 mt-1">Los nuevos pedidos aparecerán aquí</p>
          </div>
        )}

        {/* Pedido cards */}
        <div className="space-y-3">
          {state.pedidos.map(pedido => (
            <div
              key={pedido.id}
              className={`
                p-4 rounded-lg bg-white shadow-sm border-l-4
                ${pedido.estado === 'pendiente' ? 'border-yellow-500' : 'border-green-500'}
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {pedido.producto_nombre || 'Producto'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {pedido.cliente_nombre || 'Cliente'} — {formatTime(pedido.created_at)}
                  </div>
                </div>
                <button
                  onClick={() => toggleAtendido(pedido)}
                  className={`
                    px-3 py-1 rounded text-sm font-medium
                    ${pedido.estado === 'pendiente'
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }
                  `}
                >
                  {pedido.estado === 'pendiente' ? 'Pendiente' : 'Atendido'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Notification toast for new pedidos */}
      <NotificationToast
        pedido={latestPedido}
        onDismiss={() => setLatestPedido(null)}
      />
    </div>
  );
}