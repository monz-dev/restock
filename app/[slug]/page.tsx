'use client';

import { useState, useEffect } from 'react';
import { supabase, Cliente, Producto } from '@/lib/supabase/client';

/**
 * ClientePage: One-click ordering
 * Styled with Slate Precision design system
 */

export default function ClientePage({ params }: { params: { slug: string } }) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [success, setSuccess] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);

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
        .order('nombre');

      if (productosData) {
        setProductos(productosData);
        setSelectedProducto(productosData[0] || null);
      }
      setLoading(false);
    }

    fetchData();
  }, [params.slug]);

  async function handleMakeOrder() {
    if (!cliente || !selectedProducto) return;

    setOrdering(true);

    try {
      const response = await fetch(`/api/pedido?cliente_slug=${params.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto_id: selectedProducto.id })
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

  function toggleDarkMode() {
    setDarkMode(!darkMode);
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-surface grid-dot' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className={`w-8 h-8 border-4 ${darkMode ? 'border-surface-container-high border-t-primary-container' : 'border-gray-300 border-t-gray-600'} rounded-full animate-spin`} />
          <p className={`text-sm ${darkMode ? 'text-on-surface-variant' : 'text-gray-500'}`}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${darkMode ? 'bg-surface grid-dot' : 'bg-gray-50'}`}>
        <div className="text-center">
          <span className="material-icons text-6xl text-outline mb-4">search_off</span>
          <h1 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>No encontrado</h1>
          <p className={darkMode ? 'text-on-surface-variant' : 'text-gray-500'}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-surface grid-dot' : 'bg-gray-50'}`}>
      {/* TopAppBar */}
      <header className={`fixed top-0 left-0 z-50 flex justify-between items-center w-full px-6 h-16 ${
        darkMode 
          ? 'bg-surface-bright border-b border-outline-variant' 
          : 'bg-white border-b border-gray-200'
      }`}>
        <div className="flex items-center gap-4">
          <h1 className={`font-h2 text-h2 tracking-tight ${darkMode ? 'text-primary' : 'text-gray-900'}`}>
            {cliente.nombre}
          </h1>
        </div>
        <button 
          onClick={toggleDarkMode} 
          aria-label="Cambiar tema"
          className={`p-2 rounded transition-colors ${
            darkMode 
              ? 'text-primary hover:bg-surface-container-high' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="material-icons">
            {darkMode ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 pt-24">
        <div className="w-full max-w-md">
          {/* Success Overlay */}
          {success && (
            <div className="fixed inset-0 bg-surface-bright/80 flex items-center justify-center z-50 animate-in fade-in duration-200">
              <div className={`${
                darkMode 
                  ? 'bg-surface-container border border-outline-variant' 
                  : 'bg-white border border-gray-200'
              } rounded-3xl p-8 text-center animate-in zoom-in-95 duration-300`}>
                <span className="material-icons text-6xl text-green-500 mb-4">check_circle</span>
                <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-on-surface' : 'text-gray-900'}`}>¡Pedido enviado!</h2>
                <p className={darkMode ? 'text-on-surface-variant' : 'text-gray-500'}>Te avisamos cuando esté listo</p>
              </div>
            </div>
          )}

          {/* Product Display Card */}
          {selectedProducto ? (
            <div className={`${
              darkMode 
                ? 'bg-surface-container border border-outline-variant' 
                : 'bg-white border border-gray-200'
            } rounded-xl overflow-hidden`}>
              {/* Product Image / Icon */}
              <div className={`h-40 flex items-center justify-center ${
                darkMode 
                  ? 'bg-surface-high/30' 
                  : 'bg-gray-100'
              }`}>
                <span className="material-icons text-6xl text-on-surface-variant select-none">
                  inventory_2
                </span>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="text-center mb-4">
                  <h2 className={`text-xl font-bold mb-1 ${
                    darkMode ? 'text-on-surface' : 'text-gray-900'
                  }`}>
                    {selectedProducto.nombre}
                  </h2>
                  <p className={`text-2xl font-bold ${
                    darkMode ? 'text-primary' : 'text-blue-600'
                  }`}>
                    ${selectedProducto.precio}
                    <span className={`text-sm font-normal ml-1 ${
                      darkMode ? 'text-on-surface-variant' : 'text-gray-400'
                    }`}>
                      / {selectedProducto.unidad_medida}
                    </span>
                  </p>
                </div>

                {/* CTA Button */}
                <button
                  onClick={handleMakeOrder}
                  disabled={ordering}
                  className={`
                    w-full py-3 rounded-lg text-base font-semibold
                    transition-all duration-200 active:scale-95
                    ${darkMode
                      ? ordering
                        ? 'bg-surface-high text-on-surface-variant cursor-not-allowed'
                        : 'bg-primary-container hover:bg-primary text-on-primary-container shadow-lg'
                      : ordering
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg'
                    }
                  `}
                >
                  {ordering ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </span>
                  ) : (
                    'Hacer Pedido'
                  )}
                </button>

                <p className={`text-center text-xs mt-3 ${
                  darkMode ? 'text-on-surface-variant' : 'text-gray-400'
                }`}>
                  El pedido llega directo al comercio
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="material-icons text-5xl text-outline mb-2">inventory_2</span>
              <p className={darkMode ? 'text-on-surface-variant' : 'text-gray-500'}>
                Sin productos disponibles
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}