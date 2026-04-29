'use client';

import { useState, useEffect } from 'react';
import { supabase, Cliente, Proveedor, Producto } from '@/lib/supabase/client';

/**
 * ClientePage: Supplier-first ordering flow
 * Styled with Slate Precision design system
 * Flow: Cliente → Proveedores → Expand → Productos → Select → Order
 */

interface ProductoConCantidad extends Producto {
  cantidadSeleccionada: number;
}

interface ProveedorConProductos extends Proveedor {
  productos: ProductoConCantidad[];
  expanded: boolean;
}

export default function ClientePage({ params }: { params: { slug: string } }) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [proveedores, setProveedores] = useState<ProveedorConProductos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [success, setSuccess] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Sync dark mode class on mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    async function fetchData() {
      // Fetch cliente
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

      // Fetch active proveedores
      const { data: proveedoresData, error: proveedoresError } = await supabase
        .from('proveedores')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (proveedoresError) {
        console.error('Error fetching proveedores:', proveedoresError);
      }

      // Fetch active products
      const { data: productosData, error: productosError } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true);

      if (productosError) {
        console.error('Error fetching productos:', productosError);
      }

      if (proveedoresData) {
        // Group products by proveedor
        const proveedoresConProductos: ProveedorConProductos[] = proveedoresData.map(prov => ({
          ...prov,
          productos: productosData
            ? productosData
                .filter(p => p.proveedor_id === prov.id)
                .map(p => ({ ...p, cantidadSeleccionada: 0 }))
            : [],
          expanded: false
        }));
        setProveedores(proveedoresConProductos);
      }

      setLoading(false);
    }

    fetchData();
  }, [params.slug]);

  function toggleExpand(proveedorId: string) {
    setProveedores(prev =>
      prev.map(p =>
        p.id === proveedorId ? { ...p, expanded: !p.expanded } : p
      )
    );
  }

  function updateCantidad(proveedorId: string, productoId: string, cantidad: number) {
    setProveedores(prev =>
      prev.map(p =>
        p.id === proveedorId
          ? {
              ...p,
              productos: p.productos.map(prod =>
                prod.id === productoId
                  ? { ...prod, cantidadSeleccionada: Math.max(0, cantidad) }
                  : prod
              )
            }
          : p
      )
    );
  }

  function getSelectedItems() {
    const items: { producto: Producto; cantidad: number }[] = [];
    proveedores.forEach(p => {
      p.productos.forEach(prod => {
        if (prod.cantidadSeleccionada > 0) {
          items.push({ producto: prod, cantidad: prod.cantidadSeleccionada });
        }
      });
    });
    return items;
  }

  async function handleMakeOrder(proveedorId: string) {
    if (!cliente) return;

    const proveedor = proveedores.find(p => p.id === proveedorId);
    if (!proveedor) return;

    const selectedItems = proveedor.productos.filter(p => p.cantidadSeleccionada > 0);
    if (selectedItems.length === 0) {
      alert('Seleccioná al menos un producto con cantidad mayor a 0');
      return;
    }

    setOrdering(true);

    try {
      // Create one pedido per selected product
      const pedidos = selectedItems.map(item => ({
        cliente_id: cliente.id,
        producto_id: item.id,
        cantidad: item.cantidadSeleccionada,
        estado: 'pendiente'
      }));

      const response = await fetch(`/api/pedido?cliente_slug=${params.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pedidos: pedidos 
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error');
      }

      setSuccess(true);
      
      // Reset quantities
      setProveedores(prev =>
        prev.map(p =>
          p.id === proveedorId
            ? {
                ...p,
                productos: p.productos.map(prod => ({ ...prod, cantidadSeleccionada: 0 })),
                expanded: false
              }
            : p
        )
      );

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

  const selectedCount = getSelectedItems().length;

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
      <main className="flex-1 flex items-start justify-center p-6 pt-24">
        <div className="w-full max-w-md space-y-4">
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

          {/* Proveedores List */}
          <h2 className="text-lg font-semibold text-on-surface mb-2">Proveedores</h2>
          
          {proveedores.length > 0 ? (
            proveedores.map(proveedor => (
              <div 
                key={proveedor.id}
                className="bg-surface-container border border-outline-variant rounded-lg overflow-hidden"
              >
                {/* Proveedor Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-primary">store</span>
                    <div>
                      <h3 className="font-bold text-on-surface">{proveedor.nombre}</h3>
                      <p className="text-xs text-on-surface-variant">
                        {proveedor.productos.length} productos disponibles
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleExpand(proveedor.id)}
                    className="p-2 rounded text-primary hover:bg-surface-high transition-colors"
                  >
                    <span className="material-symbols-outlined">
                      {proveedor.expanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>

                {/* Expanded Product List */}
                {proveedor.expanded && (
                  <div className="border-t border-outline-variant">
                    {proveedor.productos.length > 0 ? (
                      <div className="divide-y divide-outline-variant">
                        {proveedor.productos.map(producto => (
                          <div key={producto.id} className="p-3 flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-medium text-on-surface text-sm">{producto.nombre}</p>
                              <p className="text-xs text-on-surface-variant">
                                ${producto.precio} / {producto.unidad_medida}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateCantidad(proveedor.id, producto.id, producto.cantidadSeleccionada - 1)}
                                className="w-8 h-8 rounded bg-surface-high text-on-surface flex items-center justify-center hover:bg-surface-highest transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">remove</span>
                              </button>
                              <span className="w-8 text-center font-semibold text-on-surface">
                                {producto.cantidadSeleccionada}
                              </span>
                              <button
                                onClick={() => updateCantidad(proveedor.id, producto.id, producto.cantidadSeleccionada + 1)}
                                className="w-8 h-8 rounded bg-surface-high text-on-surface flex items-center justify-center hover:bg-surface-highest transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">add</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-on-surface-variant text-sm">
                        Este proveedor no tiene productos disponibles
                      </div>
                    )}

                    {/* Order Button for this Proveedor */}
                    {proveedor.productos.some(p => p.cantidadSeleccionada > 0) && (
                      <div className="p-3 border-t border-outline-variant">
                        <button
                          onClick={() => handleMakeOrder(proveedor.id)}
                          disabled={ordering}
                          className={`
                            w-full py-2.5 rounded text-sm font-semibold
                            transition-all duration-200 active:scale-95
                            ${ordering
                              ? 'bg-surface-high text-on-surface-variant cursor-not-allowed'
                              : 'bg-primary text-on-primary hover:bg-primary/90'
                            }
                          `}
                        >
                          {ordering ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                              Enviando...
                            </span>
                          ) : (
                            `Hacer Pedido (${proveedor.productos.filter(p => p.cantidadSeleccionada > 0).length} items)`
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-5xl text-outline mb-2">store</span>
              <p className="text-on-surface-variant">
                Sin proveedores disponibles
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
