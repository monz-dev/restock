'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/supabase/client';

/**
 * Root page - verifica sesión y redirige a login o dashboard
 */
export default function RootPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const session = await getSession();
      if (session) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface grid-dot">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-surface-high border-t-primary-container rounded-full animate-spin" />
        <p className="text-sm text-on-surface-variant">Cargando...</p>
      </div>
    </div>
  );
}