'use client';

import { useState, useEffect } from 'react';
import { supabase, Cliente, Producto } from '@/lib/supabase/client';

/**
 * ClientePage: One-click ordering
 * Mobile-first: big tap targets, single column, thumb-zone CTA
 */

export default function ClientePage({ params }: { params: { slug: string } }) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabaseClient = supabase;

      const { data: clienteData, error: clienteError } = await supabaseClient
        .from('clientes')
        .select('*')
        .eq('slug', params.slug)
        .eq('activo', true)
        .single();

      if (clienteError || !clienteData) {
        setError('Establecimiento no encontrado');
        setLoading(false);
        return;
      }

      setCliente(clienteData);

      const { data: productosData } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('nombre')
        .limit(1)
        .single();

      if (productosData) setProducto(productosData);
      setLoading(false);
    }

    fetchData();
  }, [params.slug]);

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
        throw new Error(result.error || 'Error');
      }

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 2500);

    } catch {
      alert('No se pudo enviar. Intentá de nuevo.');
    } finally {
      setOrdering(false);
    }
  }

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

  if (error || !cliente) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-xl font-semibold text-zinc-900 mb-2">No encontrado</h1>
          <p className="text-zinc-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-5">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white text-lg">
              {cliente.nombre.charAt(0)}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900">{cliente.nombre}</h1>
              <p className="text-sm text-zinc-500">Pedí lo que necesites</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        {producto ? (
          <div className="w-full max-w-md">
            {/* Success Overlay */}
            {success && (
              <div className="fixed inset-0 bg-zinc-900/80 flex items-center justify-center z-50 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl p-8 text-center animate-in zoom-in-95 duration-300">
                  <div className="text-6xl mb-4">✅</div>
                  <h2 className="text-xl font-semibold text-zinc-900 mb-2">¡Pedido enviado!</h2>
                  <p className="text-zinc-500">Te avisamos cuando esté listo</p>
                </div>
              </div>
            )}

            {/* Product Image */}
            <div className="bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 rounded-3xl aspect-square flex items-center justify-center mb-6 overflow-hidden">
              <div className="text-center">
                <div className="text-[120px] leading-none mb-2 select-none">🥩</div>
              </div>
            </div>

            {/* Product Info */}
            <div className="bg-white rounded-3xl p-6 shadow-sm shadow-zinc-200/50">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 mb-1">{producto.nombre}</h2>
                <p className="text-4xl font-bold text-orange-600">
                  ${producto.precio}
                  <span className="text-base font-normal text-zinc-400 ml-1">/ {producto.unidad_medida}</span>
                </p>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleMakeOrder}
                disabled={ordering}
                className={`
                  w-full py-4 rounded-2xl text-lg font-semibold text-white
                  transition-all duration-200 active:scale-95
                  ${ordering
                    ? 'bg-zinc-300 cursor-not-allowed'
                    : 'bg-zinc-900 hover:bg-zinc-800 shadow-lg shadow-zinc-900/20'
                  }
                `}
              >
                {ordering ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  'Hacer Pedido'
                )}
              </button>

              <p className="text-center text-xs text-zinc-400 mt-3">
                El pedido llega directo al comercio
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-zinc-500">Sin productos disponibles</p>
          </div>
        )}
      </main>
    </div>
  );
}