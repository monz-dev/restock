// lib/supabase/client.ts - Supabase browser client for client-side usage
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for the MVP Sistema de Pedidos
export interface Cliente {
  id: string;
  nombre: string;
  slug: string;
  codigo_qr?: string;
  direccion?: string;
  url_maps?: string;
  activo: boolean;
  created_at: string;
}

export interface Proveedor {
  id: string;
  nombre: string;
  slug: string;
  activo: boolean;
  created_at: string;
}

export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  unidad_medida: string;
  activo: boolean;
  proveedor_id: string;
  created_at: string;
}

export interface Pedido {
  id: string;
  cliente_id: string;
  producto_id: string;
  cantidad: number;
  // Extended estados para workflow completo: pendiente -> despachado -> entregado
  estado: 'pendiente' | 'despachado' | 'entregado' | 'atendido';
  created_at: string;
  // Joined fields
  cliente_nombre?: string;
  cliente_direccion?: string;
  producto_nombre?: string;
}