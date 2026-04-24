'use client';

import { useState, useEffect } from 'react';
import { supabase, Cliente, Producto } from '@/lib/supabase/client';

/**
 * ClientePage: One-click ordering page
 * Route: /[slug] - each client has their own page
 * Shows a single producto card with image and order button
 */

export default function ClientePage({ params }: { params: { slug: string } }) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Fetch cliente and first active producto
  useEffect(() => {
    async function fetchData() {
      const supabaseClient = supabase;

      // Get cliente by slug
      const { data: clienteData, error: clienteError } = await supabaseClient
        .from('clientes')
        .select('*')
        .eq('slug', params.slug)
        .eq('activo', true)
        .single();

      if (clienteError || !clienteData) {
        setError('Cliente no encontrado');
        setLoading(false);
        return;
      }

      setCliente(clienteData);

      // Get first active producto
      const { data: productosData, error: productosError } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('nombre')
        .limit(1)
        .single();

      if (!productosError && productosData) {
        setProducto(productosData);
      }

      setLoading(false);
    }

    fetchData();
  }, [params.slug]);

  // Handle order button click
  async function handleMakeOrder() {
    if (!cliente || !producto) return;

    setOrdering(true);

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

      setToast('¡Pedido enviado!');
      setTimeout(() => setToast(null), 2000);

    } catch {
      setToast('No se pudo enviar. Intenta de nuevo');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setOrdering(false);
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  // Error / 404
  if (error || !cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Página no encontrada</h1>
          <p className="text-gray-500">{error || 'Cliente no encontrado'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{cliente.nombre}</h1>
        </div>
      </header>

      {/* Producto Card */}
      <main className="max-w-md mx-auto px-4 py-8">
        {producto ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Product Image */}
            <div className="aspect-square bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
              <div className="text-center">
                {/* Placeholder icon - replace with actual image */}
                <div className="text-8xl mb-2">🥩</div>
                <div className="text-lg font-semibold text-gray-700">Chorizo Premium</div>
              </div>
            </div>

            {/* Product Info & Button */}
            <div className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{producto.nombre}</h2>
                <p className="text-3xl font-bold text-orange-600">${producto.precio}</p>
                <p className="text-sm text-gray-500">por {producto.unidad_medida}</p>
              </div>

              <button
                onClick={handleMakeOrder}
                disabled={ordering}
                className={`
                  w-full py-4 rounded-xl text-lg font-bold text-white
                  transition-all duration-200
                  ${ordering
                    ? 'bg-gray-400 cursor-wait'
                    : 'bg-orange-500 hover:bg-orange-600 active:scale-95 shadow-lg shadow-orange-500/30'
                  }
                `}
              >
                {ordering ? 'Enviando...' : '¡Pedir!'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No hay productos disponibles
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-4 right-4 z-20">
          <div className="max-w-md mx-auto">
            <div className={`
              px-4 py-3 rounded-xl text-center text-white font-medium
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