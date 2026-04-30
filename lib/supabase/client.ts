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
// ROLES Y PERMISOS (usando tablas roles + usuario_roles)
// ============================================

export interface Rol {
  id: string;
  nombre: string;
  descripcion?: string;
}

// Mapeo de roles a permisos
const ROL_PERMISOS: Record<string, string[]> = {
  admin: [
    'gestionar_usuarios',
    'crear_productos',
    'editar_productos',
    'eliminar_productos',
    'ver_todos_pedidos',
    'editar_pedidos',
    'gestionar_roles',
    'ver_pedidos',
    'crear_pedidos',
    'ver_pedidos_propios',
    'editar_pedidos_propios',
    'ver_pedidos_despachados',
    'actualizar_estado_entrega'
  ],
  proveedor: [
    'crear_productos',
    'editar_productos',
    'eliminar_productos',
    'ver_pedidos',
    'crear_pedidos'
  ],
  cliente: [
    'crear_pedidos',
    'ver_pedidos_propios',
    'editar_pedidos_propios'
  ],
  repartidor: [
    'ver_pedidos_despachados',
    'actualizar_estado_entrega'
  ]
};

/**
 * Obtiene los roles del usuario actual (de usuario_roles + roles).
 */
export async function getUserRoles(): Promise<Rol[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];

  // Primero obtener los rol_id del usuario
  const { data: usuarioRoles } = await supabase
    .from('usuario_roles')
    .select('rol_id')
    .eq('user_id', session.user.id);

  if (!usuarioRoles || usuarioRoles.length === 0) return [];

  const rolIds = usuarioRoles.map(ur => ur.rol_id);

  // Luego traer los nombres de los roles
  const { data: roles } = await supabase
    .from('roles')
    .select('*')
    .in('id', rolIds);

  return roles || [];
}

/**
 * Obtiene los permisos del usuario actual según sus roles.
 */
export async function getUserPermisos(): Promise<string[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];

  const roles = await getUserRoles();
  if (roles.length === 0) return [];

  // Collect permisos from all roles
  const permisosSet = new Set<string>();
  roles.forEach(rol => {
    const permisosDelRol = ROL_PERMISOS[rol.nombre] || [];
    permisosDelRol.forEach(p => permisosSet.add(p));
  });

  return Array.from(permisosSet);
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
export async function getAllPermisos(): Promise<{ nombre: string }[]> {
  // Permisos únicos de todos los roles
  const permisosSet = new Set<string>();
  Object.values(ROL_PERMISOS).forEach(permisos => {
    permisos.forEach(p => permisosSet.add(p));
  });
  return Array.from(permisosSet).map(p => ({ nombre: p }));
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