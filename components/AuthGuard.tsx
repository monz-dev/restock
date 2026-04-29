'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, hasPermiso } from '@/lib/supabase/client';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermiso?: string;
  requiredRol?: string;
  loadingMessage?: string;
}

/**
 * AuthGuard - Protege rutas según permisos o roles
 * Uso: <AuthGuard requiredPermiso="ver_pedidos"> <Dashboard /> </AuthGuard>
 */
export function AuthGuard({ 
  children, 
  requiredPermiso, 
  requiredRol,
  loadingMessage = 'Verificando acceso...'
}: AuthGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        // 1. Verificar que esté logueado
        const session = await getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        // 2. Si requiere permiso específico
        if (requiredPermiso) {
          const tienePermiso = await hasPermiso(requiredPermiso);
          if (!tienePermiso) {
            router.push('/login?error=permiso');
            return;
          }
        }

        // 3. Si requiere rol específico
        if (requiredRol) {
          const { hasRol } = await import('@/lib/supabase/client');
          const tieneRol = await hasRol(requiredRol);
          if (!tieneRol) {
            router.push('/login?error=rol');
            return;
          }
        }

        setAuthorized(true);
      } catch (error) {
        console.error('Error verificando auth:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router, requiredPermiso, requiredRol]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface grid-dot">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-surface-high border-t-primary-container rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}

/**
 * useAuth - Hook para verificar permisos dentro de componentes
 */
export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userPermisos, setUserPermisos] = useState<string[]>([]);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await getSession();
        if (!session) {
          setHasAccess(false);
          setLoading(false);
          return;
        }

        const { getUserPermisos, getUserRoles } = await import('@/lib/supabase/client');
        
        const roles = await getUserPermisos();
        setUserPermisos(roles);

        const allRoles = await import('@/lib/supabase/client');
        const userRolesList = await allRoles.getUserRoles();
        setUserRoles(userRolesList.map(r => r.nombre));

        setHasAccess(true);
      } catch (error) {
        console.error('Error checking auth:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  return { loading, hasAccess, userPermisos, userRoles };
}