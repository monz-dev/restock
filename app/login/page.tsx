'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, signIn, signUp, resetPassword, getSession, onAuthStateChange } from '@/lib/supabase/client';

/**
 * LoginPage - Pantalla de autenticación con login, registro y recuperación de contraseña
 * Todo en español con diseño minimalista
 */
type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

// Wrap useSearchParams in Suspense boundary
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Check for reset token in URL
  useEffect(() => {
    if (searchParams.get('reset') === 'true') {
      setMode('reset');
    }
  }, [searchParams]);

  // Check for existing session on mount
  useEffect(() => {
    async function checkSession() {
      const session = await getSession();
      if (session) {
        router.push('/dashboard');
      }
    }
    checkSession();
  }, [router]);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!email.trim()) {
      setError('Ingresa tu email');
      return;
    }
    if (!password) {
      setError('Ingresa tu contraseña');
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await signIn(email, password);

      if (authError) {
        if (authError.message.includes('Invalid login') || authError.message.includes('Invalid credentials')) {
          setError('Email o contraseña incorrectos');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Debes confirmar tu email antes de iniciar sesión');
        } else {
          setError(authError.message);
        }
        return;
      }

      if (data?.user) {
        setSuccess('¡Bienvenido de nuevo!');
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!email.trim()) {
      setError('Ingresa tu email');
      return;
    }
    if (!password) {
      setError('Ingresa una contraseña');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await signUp(email, password);

      if (authError) {
        if (authError.message.includes('User already registered') || authError.message.includes('already been registered')) {
          setError('Este email ya está registrado');
        } else {
          setError(authError.message);
        }
        return;
      }

      // Check if email confirmation is required
      if (data?.user && !data.session) {
        setSuccess('¡Revisa tu email para confirmar tu cuenta!');
      } else {
        setSuccess('¡Bienvenido! Ya puedes usar tu cuenta.');
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Error al registrarte');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Ingresa tu email');
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await resetPassword(email);

      if (authError) {
        setError(authError.message);
        return;
      }

      // Don't reveal if email exists
      setSuccess('Si el email existe, recibirás un enlace de recuperación');
    } catch (err) {
      setError('Error al solicitar recuperación');
    } finally {
      setLoading(false);
    }
  }

  function renderForm() {
    if (mode === 'reset') {
      return (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Nueva Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-outline-variant bg-surface-container rounded-lg focus:outline-none focus:border-primary-container"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-outline-variant bg-surface-container rounded-lg focus:outline-none focus:border-primary-container"
              placeholder="Repite tu contraseña"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container text-on-primary-container py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className="w-full text-center text-sm text-primary mt-4"
          >
            Volver a Iniciar Sesión
          </button>
        </form>
      );
    }

    if (mode === 'signup') {
      return (
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-outline-variant bg-surface-container rounded-lg focus:outline-none focus:border-primary-container"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-outline-variant bg-surface-container rounded-lg focus:outline-none focus:border-primary-container"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container text-on-primary-container py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'Registrándote...' : 'Registrarse'}
          </button>
          <div className="text-center text-sm text-on-surface-variant mt-4">
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className="text-primary font-medium"
            >
              Iniciar Sesión
            </button>
          </div>
        </form>
      );
    }

    if (mode === 'forgot') {
      return (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-outline-variant bg-surface-container rounded-lg focus:outline-none focus:border-primary-container"
              placeholder="tu@email.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container text-on-primary-container py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Recuperar Contraseña'}
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            className="w-full text-center text-sm text-primary mt-4"
          >
            Volver a Iniciar Sesión
          </button>
        </form>
      );
    }

    // Default: login mode
    return (
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-outline-variant bg-surface-container rounded-lg focus:outline-none focus:border-primary-container"
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-outline-variant bg-surface-container rounded-lg focus:outline-none focus:border-primary-container"
            placeholder="Tu contraseña"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-container text-on-primary-container py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? 'Iniciando...' : 'Iniciar Sesión'}
        </button>
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
            className="text-sm text-on-surface-variant hover:text-primary"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <div className="text-center text-sm text-on-surface-variant mt-6">
          ¿No tienes cuenta?{' '}
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
            className="text-primary font-medium"
          >
            Registrarse
          </button>
        </div>
      </form>
    );
  }

  function getTitle() {
    switch (mode) {
      case 'signup':
        return 'Crear Cuenta';
      case 'forgot':
        return 'Recuperar Contraseña';
      case 'reset':
        return 'Nueva Contraseña';
      default:
        return 'Iniciar Sesión';
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface grid-dot p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-manrope text-2xl font-bold text-primary mb-2">
            Sistema de Pedidos
          </h1>
          <p className="text-on-surface-variant">
            {getTitle()}
          </p>
        </div>

        <div className="border border-outline-variant bg-surface-container rounded-xl p-6">
          {error && (
            <div className="mb-4 p-3 bg-error-container/20 border border-error rounded-lg">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}
          {renderForm()}
        </div>
      </div>
    </div>
  );
}

// Wrap with Suspense for SSG/SSR compatibility
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface grid-dot">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-surface-high border-t-primary-container rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant">Cargando...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}