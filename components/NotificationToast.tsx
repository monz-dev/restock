'use client';

import { useState, useEffect, useRef } from 'react';
import { Pedido } from '@/lib/supabase/client';

/**
 * NotificationToast - Visual + audio notification for new pedidos
 * Features: toast UI, sound, push notifications, settings UI
 */

interface NotificationSettings {
  soundEnabled: boolean;
  pushEnabled: boolean;
}

interface NotificationToastProps {
  pedido: Pedido | null;
  onDismiss: () => void;
}

export default function NotificationToast({ pedido, onDismiss }: NotificationToastProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    soundEnabled: true,
    pushEnabled: false
  });
  const [showSettings, setShowSettings] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastNotificationTime = useRef<number>(0);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notification-settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        // Invalid JSON, ignore
      }
    }

    // Request push permissions on first visit
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        setShowSettings(true);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('notification-settings', JSON.stringify(settings));
  }, [settings]);

  // Play sound
  function playSound() {
    if (!settings.soundEnabled) return;
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  }

  // Send push notification
  async function sendPushNotification(pedido: Pedido) {
    if (!settings.pushEnabled || Notification.permission !== 'granted') return;

    try {
      new Notification('Nuevo pedido', {
        body: `Pedido #${pedido.id.slice(0, 8)} - ${new Date(pedido.created_at).toLocaleTimeString('es-AR')}`,
        icon: '/icons/notification-icon.png',
        tag: 'new-pedido'
      });
    } catch (e) {
      console.error('Push notification error:', e);
    }
  }

  // Handle new pedido
  useEffect(() => {
    if (!pedido) return;

    // Rate limiting: max 1 per minute
    const now = Date.now();
    if (now - lastNotificationTime.current < 60000) {
      return;
    }
    lastNotificationTime.current = now;

    // Show toast notification
    setShowNotification(true);

    // Play sound
    playSound();

    // Send push
    sendPushNotification(pedido);

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setShowNotification(false);
      onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [pedido]);

  // Request push permission
  async function requestPushPermission() {
    if (!('Notification' in window)) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setSettings(prev => ({ ...prev, pushEnabled: true }));
      }
    } catch (e) {
      console.error('Push permission error:', e);
    }
  }

  // Don't render if no pedido
  if (!showNotification || !pedido) return null;

  return (
    <>
      {/* Audio element for notification sound */}
      <audio
        ref={audioRef}
        src="/sounds/notification.mp3"
        preload="auto"
      />

      {/* Toast */}
      <div className="fixed top-4 left-4 right-4 z-50">
        <div className="max-w-md mx-auto bg-blue-600 text-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <div>
                <div className="font-semibold">Nuevo pedido</div>
                <div className="text-sm text-blue-100">
                  #{pedido.id.slice(0, 8)} - {new Date(pedido.created_at).toLocaleTimeString('es-AR')}
                </div>
              </div>
            </div>
            <button
              onClick={() => { setShowNotification(false); onDismiss(); }}
              className="text-white hover:text-blue-200"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end">
          <div className="bg-white rounded-t-lg p-4 w-full">
            <h3 className="font-semibold text-gray-900 mb-4">Configuración</h3>
            
            <label className="flex items-center justify-between py-3">
              <span className="text-gray-700">Sonido de notificación</span>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                className="w-5 h-5"
              />
            </label>

            <button
              onClick={requestPushPermission}
              className="flex items-center justify-between w-full py-3"
            >
              <span className="text-gray-700">Notificaciones push</span>
              <span className={`text-sm ${settings.pushEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                {settings.pushEnabled ? 'Activado' : 'Activar'}
              </span>
            </button>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg mt-4"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}