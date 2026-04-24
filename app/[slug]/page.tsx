'use client';

import { useState, useEffect } from 'react';
import { supabase, Cliente, Producto } from '@/lib/supabase/client';

/**
 * ClientePage: One-click ordering page
 * Route: /[slug] - each client has their own page
 * Shows producto buttons, handles ordering
 */

interface ClienteWithProductos {
  cliente: Cliente | null;
  productos: Producto[];
  loading: boolean;
  error: string | null;
  confirming: string | null; // producto_id of order being confirmed
}

export default function ClientePage({ params }: { params: { slug: string } }) {
  const [data, setData] = useState<ClienteWithProductos>({
    cliente: null,
    productos: [],
    loading: true,
    error: null,
    confirming: null
  });
  const [toast, setToast] = useState<string | null>(null);

  // Fetch cliente and productos on mount
  useEffect(() => {
    async function fetchData() {
      const supabaseClient = supabase;

      // Get cliente by slug
      const { data: cliente, error: clienteError } = await supabaseClient
        .from('clientes')
        .select('*')
        .eq('slug', params.slug)
        .eq('activo', true)
        .single();

      if (clienteError || !cliente) {
        setData(prev => ({ ...prev, loading: false, error: 'Cliente no encontrado' }));
        return;
      }

      // Get active productos
      const { data: productos, error: productosError } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (productosError) {
        setData(prev => ({ ...prev, loading: false, error: 'Error al cargar productos' }));
        return;
      }

      setData(prev => ({
        ...prev,
        cliente,
        productos: productos || [],
        loading: false,
        error: null
      }));
    }

    fetchData();
  }, [params.slug]);

  // Handle producto button click - create pedido
  async function handleMakeOrder(producto: Producto) {
    if (!data.cliente) return;
    
    setData(prev => ({ ...prev, confirming: producto.id }));

    try {
      const response = await fetch(`/api/pedido?cliente_slug=${params.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto_id: producto.id })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error desconocido');
      }

      // Show confirmation toast for 2 seconds
      setToast(`Pedido enviado: ${producto.nombre}`);
      setTimeout(() => setToast(null), 2000);

    } catch (err) {
      // Show error toast
      setToast('No se pudo enviar. Intenta de nuevo');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setData(prev => ({ ...prev, confirming: null }));
    }
  }

  // Loading state
  if (data.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  // Error / 404 state
  if (data.error || !data.cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Página no encontrada</h1>
          <p className="text-gray-500">{data.error || 'Cliente no encontrado'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">{data.cliente.nombre}</h1>
          <p className="text-sm text-gray-500">Selecciona un producto</p>
        </div>
      </header>

      {/* Producto buttons */}
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="grid gap-3">
          {data.productos.map(producto => (
            <button
              key={producto.id}
              onClick={() => handleMakeOrder(producto)}
              disabled={data.confirming !== null}
              className={`
                flex items-center justify-between p-4 rounded-lg
                bg-white shadow-sm border border-gray-200
                transition-all duration-200
                ${data.confirming === producto.id
                  ? 'opacity-75 cursor-wait'
                  : 'hover:shadow-md hover:border-gray-300 active:scale-95'
                }
              `}
            >
              <div className="text-left">
                <div className="font-medium text-gray-900">{producto.nombre}</div>
                <div className="text-sm text-gray-500">${producto.precio} / {producto.unidad_medida}</div>
              </div>
              <div className="text-lg text-gray-400">→</div>
            </button>
          ))}
        </div>

        {/* Empty state */}
        {data.productos.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay productos disponibles
          </div>
        )}
      </main>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-4 left-4 right-4 z-20">
          <div className="max-w-md mx-auto">
            <div className={`
              px-4 py-3 rounded-lg text-center text-white
              ${toast.includes('No se pudo') ? 'bg-red-500' : 'bg-green-500'}
            `}>
              {toast}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}