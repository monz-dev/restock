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
  url_logo: string | null;
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
  // Grouping: same orden_id = same order submission
  orden_id?: string;
  // Joined fields
  cliente_nombre?: string;
  cliente_direccion?: string;
  producto_nombre?: string;
}

// ============================================
// AUTH HELPERS
// ============================================

/**
 * Inicia sesión con email y password.
 */
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * Registra un nuevo usuario con email y password.
 */
export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

/**
 * Solicita recuperación de contraseña.
 */
export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/login?reset=true`,
  });
}

/**
 * Obtiene la sesión actual.
 */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Cierra la sesión actual.
 */
export async function signOut() {
  return supabase.auth.signOut();
}

/**
 * Escucha cambios en el estado de autenticación.
 */
export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  return supabase.auth.onAuthStateChange(callback);
}