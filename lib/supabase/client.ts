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
// ROLES Y PERMISOS
// ============================================

export interface Rol {
  id: string;
  nombre: string;
  descripcion: string;
  created_at: string;
}

export interface Permiso {
  id: string;
  nombre: string;
  descripcion: string;
  created_at: string;
}

/**
 * Obtiene los roles del usuario actual.
 */
export async function getUserRoles(): Promise<Rol[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];

  const { data } = await supabase
    .from('usuario_roles')
    .select('rol_id, roles(id, nombre, descripcion, created_at)')
    .eq('user_id', session.user.id);

  // Extraer la relación roles de cada row
  const roles = data?.map((d: unknown) => (d as { roles: Rol }).roles).filter(Boolean) || [];
  return roles;
}

/**
 * Obtiene los permisos del usuario actual según sus roles.
 */
export async function getUserPermisos(): Promise<string[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];

  const roles = await getUserRoles();
  if (roles.length === 0) return [];

  const { data } = await supabase
    .from('rol_permisos')
    .select('permisos(nombre)')
    .in('rol_id', roles.map(r => r.id));

  // Extraer nombre del permiso anidado
  const permisos = data?.map((d: unknown) => (d as { permisos: { nombre: string } }).permisos?.nombre).filter(Boolean) || [];
  return Array.from(new Set(permisos));
}

/**
 * Verifica si el usuario actual tiene un permiso específico.
 */
export async function hasPermiso(permiso: string): Promise<boolean> {
  const permisos = await getUserPermisos();
  return permisos.includes(permiso);
}

/**
 * Verifica si el usuario actual tiene un rol específico.
 */
export async function hasRol(rol: string): Promise<boolean> {
  const roles = await getUserRoles();
  return roles.some(r => r.nombre === rol);
}

/**
 * Obtiene el rol principal del usuario (el primero que tenga).
 */
export async function getUserRolPrincipal(): Promise<string | null> {
  const roles = await getUserRoles();
  return roles[0]?.nombre || null;
}

/**
 * Obtiene todos los roles disponibles en el sistema.
 */
export async function getAllRoles(): Promise<Rol[]> {
  const { data } = await supabase
    .from('roles')
    .select('*')
    .order('nombre');
  return data || [];
}

/**
 * Obtiene todos los permisos disponibles en el sistema.
 */
export async function getAllPermisos(): Promise<Permiso[]> {
  const { data } = await supabase
    .from('permisos')
    .select('*')
    .order('nombre');
  return data || [];
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