'use client';

import { useState, useEffect } from 'react';
import { supabase, Cliente, Producto } from '@/lib/supabase/client';

/**
 * ClientePage: One-click ordering
 * Styled with Slate Precision design system
 * Uses unified palette - dark mode via CSS variables
 */

export default function ClientePage({ params }: { params: { slug: string } }) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordering, setOrdering] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Sync dark mode class on mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    async function fetchData() {
      const { data: clienteData, error: clienteError } = await supabase
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

      const { data: productosData } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (productosData) {
        setProductos(productosData);
      }
      setLoading(false);
    }

    fetchData();
  }, [params.slug]);

  async function handleMakeOrder(producto: Producto) {
    if (!cliente) return;

    setOrdering(producto.id);

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
      setOrdering(null);
    }
  }

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

  if (error || !cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface grid-dot">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-outline mb-4">search_off</span>
          <h1 className="text-xl font-semibold mb-2 text-on-surface">No encontrado</h1>
          <p className="text-on-surface-variant">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface grid-dot">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 z-50 flex justify-between items-center w-full px-6 h-16 bg-surface-bright border-b border-outline-variant">
        <div className="flex items-center gap-4">
          <h1 className="font-manrope text-sm font-semibold tracking-tight uppercase text-primary">
            {cliente.nombre}
          </h1>
        </div>
        <button 
          onClick={toggleDarkMode} 
          aria-label="Cambiar tema"
          className="p-2 rounded transition-colors text-primary hover:bg-surface-high"
        >
          <span className="material-symbols-outlined">
            {darkMode ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 pt-24">
        <div className="w-full max-w-md">
          {/* Success Overlay */}
          {success && (
            <div className="fixed inset-0 bg-surface/80 flex items-center justify-center z-50 animate-in fade-in duration-200">
              <div className="bg-surface-container border border-outline-variant rounded-3xl p-8 text-center animate-in zoom-in-95 duration-300">
                <span className="material-symbols-outlined text-6xl text-green-400 mb-4">check_circle</span>
                <h2 className="text-xl font-semibold mb-2 text-on-surface">¡Pedido enviado!</h2>
                <p className="text-on-surface-variant">Te avisamos cuando esté listo</p>
              </div>
            </div>
          )}

          {/* Products Grid */}
          {productos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {productos.map(producto => (
                <div 
                  key={producto.id}
                  className="bg-surface-container border border-outline-variant rounded-lg overflow-hidden hover:border-outline transition-all"
                >
                  {/* Product Image / Icon */}
                  <div className="h-24 flex items-center justify-center bg-surface-high/50">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant select-none">
                      inventory_2
                    </span>
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <div className="text-center mb-3">
                      <h2 className="text-base font-bold mb-1 text-on-surface">
                        {producto.nombre}
                      </h2>
                      <p className="text-lg font-bold text-primary">
                        ${producto.precio}
                        <span className="text-xs font-normal ml-1 text-on-surface-variant">
                          / {producto.unidad_medida}
                        </span>
                      </p>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleMakeOrder(producto)}
                      disabled={ordering === producto.id}
                      className={`
                        w-full py-2 rounded text-sm font-semibold
                        transition-all duration-200 active:scale-95
                        ${ordering === producto.id
                          ? 'bg-surface-high text-on-surface-variant cursor-not-allowed'
                          : 'bg-surface-high hover:bg-surface-highest text-primary border border-outline-variant'
                        }
                      `}
                    >
                      {ordering === producto.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                          Enviando...
                        </span>
                      ) : (
                        'Hacer Pedido'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-5xl text-outline mb-2">inventory_2</span>
              <p className="text-on-surface-variant">
                Sin productos disponibles
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}