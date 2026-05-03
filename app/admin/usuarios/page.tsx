'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getSession, onAuthStateChange, signOut, getUserRoles } from '@/lib/supabase/client';
import { AuthGuard } from '@/components/AuthGuard';

/**
 * Admin Usuarios Page
 * Styled with Slate Precision design system
 * Dedicated page for user administration
 * Protegido: requiere permiso 'gestionar_usuarios'
 */

function AdminUsuariosContent() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);
  
  // Admin panel state
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [clientesList, setClientesList] = useState<any[]>([]);
  const [proveedoresList, setProveedoresList] = useState<any[]>([]);
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);
  const [assigningProviderUserId, setAssigningProviderUserId] = useState<string | null>(null);
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [assigningRoleUserId, setAssigningRoleUserId] = useState<string | null>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Show toast notification
  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  // Check auth on mount
  useEffect(() => {
    async function checkAuth() {
      const session = await getSession();
      if (!session) {
        router.push('/login');
        return true;
      }
      return false;
    }
    checkAuth();
  }, [router]);

  // Listen for auth changes and redirect if signed out
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      const roles = await getUserRoles();
      setIsAdmin(roles.some(r => r.nombre === 'admin'));
    }
    checkAdmin();
  }, []);

  // Load admin data on mount
  useEffect(() => {
    if (isAdmin && adminUsers.length === 0) {
      loadAdminData();
    }
  }, [isAdmin]);

  async function loadAdminData() {
    if (!isAdmin) return;
    setLoadingAdmin(true);
    try {
      // Get user emails from API
      let userEmails: Record<string, string> = {};
      try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        if (data.users) {
          data.users.forEach((u: any) => {
            userEmails[u.id] = u.email;
          });
        }
      } catch (e) {
        console.log('Error fetching user emails:', e);
      }

      // Get all roles
      const { data: roles } = await supabase.from('roles').select('*');
      
      // Get all usuario_roles with roles info
      const { data: usuarioRoles } = await supabase
        .from('usuario_roles')
        .select('*, rol:roles(*)');
      
      // Get unique user_ids
      const userIds = Array.from(new Set((usuarioRoles || []).map((ur: any) => String(ur.user_id))));
      
      // Get all clientes
      const { data: clientes } = await supabase.from('clientes').select('*');
      
      // Get all usuario_clientes to show assigned clients
      const { data: usuarioClientes } = await supabase
        .from('usuario_clientes')
        .select('*, cliente:clientes(nombre)');
      
      // Get all proveedores
      const { data: proveedores } = await supabase.from('proveedores').select('*');
      
      // Get all usuario_proveedores to show assigned providers
      const { data: usuarioProveedores } = await supabase
        .from('usuario_proveedores')
        .select('*, proveedor:proveedores(nombre)');
      
      // Build user list with their roles, assigned clients and providers
      const users = userIds.map((id) => {
        const ur = usuarioRoles?.find((u: any) => String(u.user_id) === id);
        
        // Client assignments
        const userClientAssignments = (usuarioClientes || []).filter((uc: any) => String(uc.usuario_id) === id);
        const assignedClients = userClientAssignments
          .map((uc: any) => ({ id: uc.cliente_id, nombre: uc.cliente?.nombre }))
          .filter((c: any) => c.nombre);
        
        // Provider assignments
        const userProviderAssignments = (usuarioProveedores || []).filter((up: any) => String(up.usuario_id) === id);
        const assignedProviders = userProviderAssignments
          .map((up: any) => ({ id: up.proveedor_id, nombre: up.proveedor?.nombre }))
          .filter((p: any) => p.nombre);
        
        return {
          id,
          email: userEmails[id] || `Usuario ${String(id).slice(0, 8)}`,
          roles: ur?.rol ? [ur.rol] : [],
          assignedClients,
          assignmentIds: userClientAssignments.map((a: any) => a.id),
          assignedProviders,
          providerAssignmentIds: userProviderAssignments.map((a: any) => a.id)
        };
      });
      
      setAdminUsers(users);
      setClientesList(clientes || []);
      setProveedoresList(proveedores || []);
      // Get all roles and filter out 'owner' role
      const filteredRoles = (roles || []).filter(r => r.nombre !== 'owner');
      setRolesList(filteredRoles);
    } catch (err) {
      console.log('Error loading admin data:', err);
    } finally {
      setLoadingAdmin(false);
    }
  }

  async function assignClientToUser(userId: string, clienteId: string) {
    if (!userId || !clienteId) {
      alert('Selecciona un usuario y un cliente');
      return;
    }
    try {
      const { error } = await supabase.from('usuario_clientes').insert({
        usuario_id: userId,
        cliente_id: clienteId
      });
      if (error) {
        if (error.message.includes('duplicate')) {
          showToast('Este cliente ya está asignado a este usuario', 'error');
        } else {
          showToast('Error: ' + error.message, 'error');
        }
      } else {
        showToast('Cliente asignado correctamente', 'success');
        setAssigningUserId(null);
        loadAdminData();
      }
    } catch (err: any) {
      showToast('Error al asignar cliente', 'error');
    }
  }

  async function unassignClient(assignmentId: string) {
    if (!assignmentId) return;
    try {
      const { error } = await supabase
        .from('usuario_clientes')
        .delete()
        .eq('id', assignmentId);
      if (error) {
        showToast('Error: ' + error.message, 'error');
      } else {
        showToast('Cliente desasignado correctamente', 'success');
        loadAdminData();
      }
    } catch (err: any) {
      showToast('Error al desasignar cliente', 'error');
    }
  }

  async function assignProviderToUser(userId: string, proveedorId: string) {
    if (!userId || !proveedorId) {
      alert('Selecciona un usuario y un proveedor');
      return;
    }
    try {
      const { error } = await supabase.from('usuario_proveedores').insert({
        usuario_id: userId,
        proveedor_id: proveedorId
      });
      if (error) {
        if (error.message.includes('duplicate')) {
          showToast('Este proveedor ya está asignado a este usuario', 'error');
        } else {
          showToast('Error: ' + error.message, 'error');
        }
      } else {
        showToast('Proveedor asignado correctamente', 'success');
        setAssigningProviderUserId(null);
        loadAdminData();
      }
    } catch (err: any) {
      showToast('Error al asignar proveedor', 'error');
    }
  }

  async function unassignProvider(assignmentId: string) {
    if (!assignmentId) return;
    try {
      const { error } = await supabase
        .from('usuario_proveedores')
        .delete()
        .eq('id', assignmentId);
      if (error) {
        showToast('Error: ' + error.message, 'error');
      } else {
        showToast('Proveedor desasignado correctamente', 'success');
        loadAdminData();
      }
    } catch (err: any) {
      showToast('Error al desasignar proveedor', 'error');
    }
  }

  async function assignRoleToUser(userId: string, roleId: string) {
    if (!userId || !roleId) {
      alert('Selecciona un usuario y un rol');
      return;
    }

    // Safety check: prevent assigning owner role
    const targetRole = rolesList.find(r => r.id === roleId);
    if (targetRole?.nombre === 'owner') {
      showToast('El rol de owner no se puede asignar desde la aplicación', 'error');
      return;
    }

    try {
      // ONLY INSERT - no delete of previous roles
      const { error } = await supabase.from('usuario_roles').insert({
        user_id: userId,
        rol_id: roleId
      });

      if (error) {
        if (error.message.includes('duplicate')) {
          showToast('Este rol ya está asignado a este usuario', 'error');
        } else {
          showToast(`Error al asignar rol: ${error.message}`, 'error');
        }
      } else {
        showToast('Rol asignado correctamente (sin eliminar anteriores)', 'success');
        setAssigningRoleUserId(null);
        loadAdminData();
      }
    } catch (err: any) {
      showToast(`Error al asignar rol: ${err.message}`, 'error');
    }
  }

  function toggleDarkMode() {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  async function handleLogout() {
    await signOut();
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-surface grid-dot">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-top-2 ${
          toast.type === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-error text-on-error'
        }`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {toast.message}
          </div>
        </div>
      )}

      {/* TopAppBar */}
      <header className="fixed top-0 left-0 z-50 flex justify-between items-center w-full px-6 h-16 bg-surface-bright border-b border-outline-variant">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded transition-colors text-primary hover:bg-surface-high" aria-label="Menú">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="font-manrope text-sm font-semibold tracking-tight uppercase text-primary">
            ADMINISTRACIÓN
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleDarkMode}
            aria-label="Cambiar tema" 
            className="p-2 rounded transition-colors text-primary hover:bg-surface-high"
          >
            <span className="material-symbols-outlined">
              {darkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button 
            onClick={handleLogout}
            aria-label="Cerrar sesión" 
            className="p-2 rounded transition-colors text-primary hover:bg-surface-high"
          >
            <span className="material-symbols-outlined">
              logout
            </span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-h1 text-h1 text-on-surface">Usuarios</h1>
          {isAdmin && (
            <button
              onClick={loadAdminData}
              className="px-4 py-2 bg-primary-container text-on-primary-container rounded text-sm"
            >
              Recargar
            </button>
          )}
        </div>

        {loadingAdmin ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-surface-high border-t-primary-container rounded-full animate-spin" />
              <p className="text-sm text-on-surface-variant">Cargando usuarios...</p>
            </div>
          </div>
        ) : (
          <section className="mb-8 p-4 border-2 border-outline-variant bg-surface-container rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-primary">Gestión de Usuarios</h2>
            </div>
            
            <p className="text-sm text-on-surface-variant mb-4">
              Asignación de roles, comercios y proveedores.
            </p>
            
            {/* User list */}
            <div className="space-y-4">
              {adminUsers.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No hay usuarios</p>
              ) : (
                adminUsers.map(user => (
                  <div 
                    key={user.id} 
                    className="p-3 bg-surface-low rounded border border-outline-variant"
                  >
                    {/* Desktop: all in one row | Mobile: stacked */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 w-full">
                       
                       {/* Left Side: Email, Roles */}
                       <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                         {/* Email and Roles */}
                         <div className="flex-shrink-0">
                           <p className="text-on-surface font-medium truncate">{user.email}</p>
                           <p className="text-xs text-on-surface-variant">
                             Roles: {user.roles?.map((r: any) => r.nombre).join(', ') || 'Sin rol'}
                           </p>
                         </div>                       
                       </div>

                       {/* Mid Side: Assigned Items */}
                       <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">     
                         {/* Assigned Clients and Providers - Inline Tags */}
                         <div className="flex flex-wrap gap-2 items-center">
                           {/* Assigned Clients */}
                           {user.assignedClients && user.assignedClients.length > 0 && (
                             <div className="flex flex-wrap gap-1 items-center">
                               
                               {user.assignedClients.map((client: any, idx: number) => (
                                 <span 
                                   key={`client-${idx}`}
                                   className="inline-flex items-center gap-1 px-2 py-1 bg-surface-high rounded text-xs text-on-surface"
                                 >
                                   {client.nombre}
                                   <button
                                     onClick={() => unassignClient(user.assignmentIds[idx])}
                                     className="text-error hover:text-error/80 ml-1 w-5 h-5 flex items-center justify-center rounded hover:bg-error/20 text-base leading-none"
                                     title="Desasignar comercio"
                                   >
                                     ×
                                   </button>
                                 </span>
                               ))}
                             </div>
                           )}
       
                           {/* Assigned Providers */}
                           {user.assignedProviders && user.assignedProviders.length > 0 && (
                             <div className="flex flex-wrap gap-1 items-center">
                               
                               {user.assignedProviders.map((provider: any, idx: number) => (
                                 <span 
                                   key={`provider-${idx}`}
                                   className="inline-flex items-center gap-1 px-2 py-1 bg-primary-container/30 rounded text-xs text-on-surface"
                                 >
                                   {provider.nombre}
                                   <button
                                     onClick={() => unassignProvider(user.providerAssignmentIds[idx])}
                                     className="text-error hover:text-error/80 ml-1 w-5 h-5 flex items-center justify-center rounded hover:bg-error/20 text-base leading-none"
                                     title="Desasignar proveedor"
                                   >
                                     ×
                                   </button>
                                 </span>
                               ))}
                             </div>
                           )}
                         </div>
                       </div>
                       
                        {/* Right Side: Action Buttons */}
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => setAssigningUserId(user.id)}
                            className="px-3 py-1 bg-primary-container text-on-primary-container rounded text-sm whitespace-nowrap"
                          >
                            Comercios
                          </button>
                          <button
                            onClick={() => setAssigningProviderUserId(user.id)}
                            className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded text-sm whitespace-nowrap"
                          >
                            Proveedores
                          </button>
                          <button
                            onClick={() => setAssigningRoleUserId(user.id)}
                            className="px-3 py-1 bg-tertiary-container text-on-tertiary-container rounded text-sm whitespace-nowrap"
                          >
                            Cambiar Rol
                          </button>
                        </div>
                     </div>
                   </div>
                ))
              )}
            </div>

            {/* Assign client modal/form */}
            {assigningUserId && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-surface-container p-4 rounded-lg border border-outline-variant max-w-md w-full">
                  <h3 className="font-semibold text-on-surface mb-4">Asignar Comercio</h3>
                  
                  {clientesList.length === 0 ? (
                    <p className="text-on-surface-variant">No hay comercios</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {clientesList.map(cliente => (
                        <button
                          key={cliente.id}
                          onClick={() => assignClientToUser(assigningUserId, cliente.id)}
                          className="w-full p-3 text-left bg-surface-low hover:bg-surface-high rounded border border-outline-variant"
                        >
                          <p className="text-on-surface font-medium">{cliente.nombre}</p>
                          <p className="text-xs text-on-surface-variant">{cliente.direccion}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <button
                     onClick={() => setAssigningUserId(null)}
                     className="mt-4 w-full p-2 border border-outline-variant rounded text-on-surface"
                   >
                     Cancelar
                   </button>
                 </div>
               </div>
             )}

             {/* Assign provider modal/form */}
             {assigningProviderUserId && (
               <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                 <div className="bg-surface-container p-4 rounded-lg border border-outline-variant max-w-md w-full">
                   <h3 className="font-semibold text-on-surface mb-4">Asignar Proveedor</h3>
                   
                   {proveedoresList.length === 0 ? (
                     <p className="text-on-surface-variant">No hay proveedores</p>
                   ) : (
                     <div className="space-y-2 max-h-60 overflow-y-auto">
                       {proveedoresList.map(proveedor => (
                         <button
                           key={proveedor.id}
                           onClick={() => assignProviderToUser(assigningProviderUserId, proveedor.id)}
                           className="w-full p-3 text-left bg-surface-low hover:bg-surface-high rounded border border-outline-variant"
                         >
                           <p className="text-on-surface font-medium">{proveedor.nombre}</p>
                           {proveedor.slug && (
                             <p className="text-xs text-on-surface-variant">{proveedor.slug}</p>
                           )}
                         </button>
                       ))}
                     </div>
                   )}
                   
                   <button
                     onClick={() => setAssigningProviderUserId(null)}
                     className="mt-4 w-full p-2 border border-outline-variant rounded text-on-surface"
                   >
                     Cancelar
                   </button>
                 </div>
               </div>
              )}

              {/* Assign role modal */}
              {assigningRoleUserId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-surface-container p-4 rounded-lg border border-outline-variant max-w-md w-full">
                    <h3 className="font-semibold text-on-surface mb-4">Asignar Rol</h3>
                    
                    {rolesList.length === 0 ? (
                      <p className="text-on-surface-variant">No hay roles</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {rolesList.map(rol => (
                          <button
                            key={rol.id}
                            onClick={() => assignRoleToUser(assigningRoleUserId, rol.id)}
                            className="w-full p-3 text-left bg-surface-low hover:bg-surface-high rounded border border-outline-variant"
                          >
                            <p className="text-on-surface font-medium">{rol.nombre}</p>
                            {rol.descripcion && (
                              <p className="text-xs text-on-surface-variant">{rol.descripcion}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <button
                      onClick={() => setAssigningRoleUserId(null)}
                      className="mt-4 w-full p-2 border border-outline-variant rounded text-on-surface"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </section>
        )}
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-surface-bright/95 backdrop-blur-sm border-t border-outline-variant">
        <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-all active:scale-90 duration-150" href="/">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-manrope text-[10px] font-medium tracking-wide uppercase">Dashboard</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-all active:scale-90 duration-150" href="/admin/pedidos">
          <span className="material-symbols-outlined">shopping_cart</span>
          <span className="font-manrope text-[10px] font-medium tracking-wide uppercase">Pedidos</span>
        </a>
        <a className="flex flex-col items-center justify-center text-primary font-bold active:scale-90 duration-150" href="/admin/usuarios">
          <span className="material-symbols-outlined">groups</span>
          <span className="font-manrope text-[10px] font-medium tracking-wide uppercase">Usuarios</span>
        </a>
      </nav>
    </div>
  );
}

// Wrap con AuthGuard - requiere permiso 'gestionar_usuarios'
export default function AdminUsuariosPage() {
  return (
    <AuthGuard 
      requiredPermiso="gestionar_usuarios"
      loadingMessage="Cargando administración..."
    >
      <AdminUsuariosContent />
    </AuthGuard>
  );
}
