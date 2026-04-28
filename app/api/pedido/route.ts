import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/pedido
 * Creates one or multiple pedidos (orders) from a client page
 * 
 * Body (new - multiple items):
 * { 
 *   pedidos: [
 *     { producto_id: string, cantidad: number },
 *     ...
 *   ]
 * }
 * 
 * Body (legacy - single item):
 * { producto_id: string }
 * 
 * Path parameter extracted from URL: /api/pedido?cliente_slug=xxx
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Get cliente_slug from query params
    const { searchParams } = new URL(request.url);
    const clienteSlug = searchParams.get('cliente_slug');
    
    if (!clienteSlug) {
      return NextResponse.json(
        { success: false, error: 'Falta cliente_slug' },
        { status: 400 }
      );
    }

    // Parse body
    const body = await request.json();
    
    // Support both single producto_id and multiple pedidos array
    let pedidosInput: { producto_id: string; cantidad: number }[] = [];
    
    if (body.pedidos && Array.isArray(body.pedidos)) {
      // New format: multiple pedidos
      pedidosInput = body.pedidos;
    } else if (body.producto_id) {
      // Legacy format: single producto_id
      pedidosInput = [{ producto_id: body.producto_id, cantidad: 1 }];
    } else {
      return NextResponse.json(
        { success: false, error: 'Falta producto_id o pedidos' },
        { status: 400 }
      );
    }

    if (pedidosInput.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay productos para pedir' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const p of pedidosInput) {
      if (!uuidRegex.test(p.producto_id)) {
        return NextResponse.json(
          { success: false, error: `producto_id formato inválido: ${p.producto_id}` },
          { status: 400 }
        );
      }
      if (!Number.isInteger(p.cantidad) || p.cantidad < 1) {
        return NextResponse.json(
          { success: false, error: `cantidad inválida para producto ${p.producto_id}` },
          { status: 400 }
        );
      }
    }

    // Create Supabase client (server-side)
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get client by slug
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id, nombre')
      .eq('slug', clienteSlug)
      .eq('activo', true)
      .single();

    if (clienteError || !cliente) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Get all valid producto IDs in one query
    const productoIds = pedidosInput.map(p => p.producto_id);
    const { data: productos, error: productosError } = await supabase
      .from('productos')
      .select('id, nombre')
      .in('id', productoIds)
      .eq('activo', true);

    if (productosError || !productos || productos.length !== productoIds.length) {
      return NextResponse.json(
        { success: false, error: 'Uno o más productos no encontrados' },
        { status: 404 }
      );
    }

    // Prepare pedidos for insertion
    const pedidosToInsert = pedidosInput.map(p => ({
      cliente_id: cliente.id,
      producto_id: p.producto_id,
      cantidad: p.cantidad,
      estado: 'pendiente'
    }));

    // Insert all pedidos
    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos')
      .insert(pedidosToInsert)
      .select();

    if (pedidosError) {
      console.error('Error inserting pedidos:', pedidosError);
      return NextResponse.json(
        { success: false, error: 'Error al crear pedidos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pedidos_ids: pedidos.map(p => p.id),
      message: `${pedidos.length} pedido(s) enviado(s)`
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
