import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/pedido
 * Creates a new pedido (order) from a client page
 * 
 * Body: { producto_id: string }
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
    const { producto_id } = body;

    if (!producto_id) {
      return NextResponse.json(
        { success: false, error: 'Falta producto_id' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(producto_id)) {
      return NextResponse.json(
        { success: false, error: 'producto_id formato inválido' },
        { status: 400 }
      );
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

    // Validate producto exists
    const { data: producto, error: productoError } = await supabase
      .from('productos')
      .select('id, nombre')
      .eq('id', producto_id)
      .eq('activo', true)
      .single();

    if (productoError || !producto) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Insert pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        cliente_id: cliente.id,
        producto_id: producto_id,
        cantidad: 1,
        estado: 'pendiente'
      })
      .select()
      .single();

    if (pedidoError) {
      console.error('Error inserting pedido:', pedidoError);
      return NextResponse.json(
        { success: false, error: 'Error al crear pedido' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pedido_id: pedido.id,
      message: 'Pedido enviado'
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}