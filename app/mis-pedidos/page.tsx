'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getSession, getUserRoles } from '@/lib/supabase/client';
import { AuthGuard } from '@/components/AuthGuard';
/**
 * MisPedidosPage - Vista de pedidos para clientes
 * Muestra los pedidos que los clientes asignados al usuario han hecho
 */
interface PedidoItem {
  id: string;
  cliente_id: string;
  producto_id: string;
  cantidad: number;
  estado: string;
  created_at: string;
  orden_id: string;
  created_by: string;
  // Joined fields
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
  useEffect(() => {
    async function fetchMisPedidos() {
      try {
        const session = await getSession();
        if (!session?.user) {
          router.push('/login');
          return;
        }
        const userId = (session as any).user?.id;
        // Get cliente asignado al usuario
        const { data: clienteData } = await supabase
          .from('usuario_clientes')
          .select('*, cliente:clientes(*)')
          .eq('usuario_id', userId)
          .single();
        if (!clienteData) {
          setError('No tienes clientes asignados. Contacta al administrador.');
          setLoading(false);
          return;
        }
        setClienteAsignado(clienteData.cliente);
        // Get all pedidos from this cliente
        const { data: pedidosData } = await supabase
          .from('pedidos')
          .select('*')
          .eq('cliente_id', clienteData.cliente.id)
          .order('created_at', { ascending: false });
        // Get producto details for each pedido
        const productoIds = Array.from(new Set((pedidosData || []).map(p => p.producto_ id)));
        const { data: productos } = await supabase
          .from('productos')
          .select('id, nombre, precio, unidad_medida')
          .in('id', productoIds);
        const productoMap = new Map((productos || []).map(p => [p.id, p]));
        // Combine pedido data with producto details
        const pedidosWithDetails = (pedidosData || []).map(p => {
          const producto = productoMap. get(p.producto_id);
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
  // Group pedidos by orden_id
  function groupPedidosByOrden(pedidos: PedidoItem[]): OrdenGroup[] {
    const groups = new Map< string, PedidoItem[]>();
    pedidos.forEach(p => {
      const key = p.orden_id || p.id;
      if (!groups. has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(p);
    });
    const result: OrdenGroup[] = [];
    groups.forEach((items, ordenId) => {
      const total = items.reduce((sum, item) => {
        const precio = Number(item.producto_precio) || 0;
        return sum + (precio * item.cantidad);
      }, 0);
      result.push({
        orden_id: ordenId,
        items,
        estado: items[0].estado,
        created_at: items[0].created_at,
        total
      });
    });
    // Sort by most recent
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return result;
  }
  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  }
  const ordenes = groupPedidosByOrden(pedidos);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-surface-high border-t- primary- container rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant">Cargando pedidos...</p> </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">
        <div className="text-center max-w-md">
          <span className="material-icons text-6xl text-error mb-4">error</span>
          <h2 className="text-xl font-semibold text-on-surface mb-2">Sin clientes asignados</h2>
          <p className="text-on-surface-variant mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-primary-container text-on-primary-container rounded"
          >Volver al dashboard</button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-surface pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-bright border-b border-outline-variant">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => router.push('/dashboard')} className="p-2 -ml-2">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-semibold text-primary">Mis Pedidos</h1>
          <div className="w-10" />
        </div>
      </header>
      {/* Cliente Info */}
      {clienteAsignado && (
        <div className="pt-16 px-4 pb-4 bg-surface-container border-b border-outline-variant">
          <p className="text-xs text-on-surface-variant uppercase tracking-wide">Cliente</p>
          <h2 className="text-lg font-semibold text-on-surface">{clienteAsignado.nombre}</h2>
          {clienteAsignado.direccion && (
            <p className="text-sm text-on-surface-variant">{clienteAsignado.direccion}</p>
          )}
        </div>
      )}
      {/* Pedidos List */}
      <main className="pt-4 px-4 max-w-2xl mx-auto">
        {ordenes.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-icons text-6xl text-outline mb-4">inbox</span>
            <h3 className="text-lg font-semibold text-on-surface">Sin pedidos</h3>
            <p className="text-sm text-on-surface-variant">Aún no has hecho ningún pedido</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ordenes.map(orden => (
              <div key={orden.orden_id} className="border border-outline-variant rounded-lg overflow-hidden">
                {/* Header */}
                <div className="p-4 bg-surface-high bg-surface-high/50 border-b border-outline-variant">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${
                      orden.estado === 'pendiente' ? 'bg-amber-100 text-amber-800' :
                      orden.estado === 'despachado' ? 'bg-blue-100 text-blue-800' :
                      orden.estado === 'entregado' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{orden.estado}</span>
                    <span className="text-sm text-on-surface-variant">{formatDate(orden.created_at)}</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">Pedido #{orden.orden_id.slice(0, 8)}</p>
                </div>
                {/* Items */}
                <div className="p-4 space-y-3">
                  {orden.items.map(item => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-on-surface">
                          {item.cantidad}x {item.producto_nombre || 'Producto'}
                        </p>
                        <p className="text-sm text-on-surface-variant">{item.unidad_medida}</p>
                      </div>
                      <p className="font-medium text-on-surface">
                        {formatCurrency(Number(item.producto_precio) * item.cantidad)}
                      </p>
                    </div>
                  ))}
                </div>
                {/* Total */}
                <div className="p-4 bg-surface-low border-t border-outline-variant">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-on-surface">Total</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(orden.total)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
// Wrap con AuthGuard - clientes pueden ver esta página
export default function MisPedidosPage() {
  return (
    <AuthGuard
      requiredPermiso="ver_pedidos_propios"
      loadingMessage="Cargando..."
    >
      <MisPedidosContent />
    </AuthGuard>
  );
}
