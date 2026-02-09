"use client";

// Forzar rendering dinámico para evitar errores de SSR
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { yearHasDivisions } from '@/app/lib/utils/divisions';

const ProfilePage = () => {
  const { data: session, update } = useSession();
  const router = useRouter();
  const academicLocked = session?.user?.role === 'student' && !!session.user.year;
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('informacion');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    year: null as number | null,
    division: ''
  });

  useEffect(() => {
    if (session?.user) {
      // Cargar datos del usuario
      fetchUserProfile();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const userData = await response.json();
        setFormData({
          name: userData.name || session?.user?.name || '',
          email: userData.email || session?.user?.email || '',
          phone: userData.phone || '',
          bio: userData.bio || 'Estudiante del Instituto Privado Dalmacio Vélez Sarsfield',
          year: typeof userData.year === 'number' ? userData.year : (userData.year ? Number(userData.year) : null),
          division: userData.division || ''
        });
        setProfileImage(userData.profile_image);
      } else {
        // Si hay error, usar datos de la sesión como fallback
        if (session?.user) {
          setFormData(prev => ({
            ...prev,
            name: session.user?.name || '',
            email: session.user?.email || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      // Usar datos de la sesión como fallback
      if (session?.user) {
        setFormData(prev => ({
          ...prev,
          name: session.user?.name || '',
          email: session.user?.email || ''
        }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'year') {
      const nextYear = value === '' ? null : Number(value);
      setFormData(prev => ({
        ...prev,
        year: nextYear,
        division: nextYear && !yearHasDivisions(nextYear) ? '' : prev.division
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const wasYearEmpty = session?.user?.role === 'student' && !session.user.year;

      const nextDivision = formData.year && yearHasDivisions(formData.year) ? formData.division : null;

      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          division: nextDivision,
          profile_image: profileImage
        }),
      });

      if (response.ok) {
        toast.success('Perfil actualizado exitosamente');
        setIsEditing(false);

        // Refrescar sesión para que el dashboard deje de ver year/division como null
        await update();

        fetchUserProfile(); // Recargar datos

        // Si venía bloqueado por falta de año, volver al dashboard
        if (wasYearEmpty && formData.year) {
          router.push('/campus/dashboard');
        }
      } else {
        let msg = 'Error al actualizar el perfil';
        try {
          const data = await response.json();
          msg = data?.error || msg;
        } catch {
          // ignore
        }
        toast.error(msg);
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      toast.error('Error al actualizar el perfil');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchUserProfile(); // Restaurar datos originales
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!isEditing) {
    return (
      <div className="bg-slate-50 min-h-screen">
        {/* Profile Header */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="bg-yellow-50 border-b border-yellow-100 h-24 w-full"></div>
          <div className="px-6 py-6">
            <div className="flex items-start gap-6 flex-wrap">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                <div className="h-24 w-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden -mt-12">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-r from-yellow-400 to-amber-400 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {getInitials(formData.name || session?.user?.name || 'U')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{formData.name || session?.user?.name}</h2>
                    <p className="text-slate-600 mt-1">{session?.user?.role === 'teacher' ? 'Profesor' : session?.user?.role === 'admin' ? 'Administrador' : 'Estudiante'}</p>
                  </div>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition flex items-center gap-2"
                  >
                    <i className="fas fa-edit"></i>
                    Editar perfil
                  </button>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-slate-600">
                    <i className="fas fa-school mr-2 text-yellow-700"></i>
                    <span>Instituto Privado Dalmacio Vélez Sarsfield</span>
                  </div>
                  {session?.user?.role === 'student' && formData.year && (
                    <div className="flex items-center text-slate-600">
                      <i className="fas fa-graduation-cap mr-2 text-yellow-700"></i>
                      <span>
                        {formData.year}° Año{formData.division ? ` ${formData.division}` : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center text-slate-600">
                    <i className="fas fa-calendar-alt mr-2 text-yellow-700"></i>
                    <span>Última conexión: Hoy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="mt-6 bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="border-b border-slate-200 overflow-x-auto">
            <nav className="flex -mb-px whitespace-nowrap">
              <button 
                onClick={() => setActiveTab('informacion')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'informacion' 
                    ? 'border-yellow-500 text-yellow-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <i className="fas fa-user"></i>
                Información
              </button>
              <button 
                onClick={() => setActiveTab('materias')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'materias' 
                    ? 'border-yellow-500 text-yellow-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <i className="fas fa-book"></i>
                Materias
              </button>
              <button 
                onClick={() => setActiveTab('logros')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'logros' 
                    ? 'border-yellow-500 text-yellow-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <i className="fas fa-trophy"></i>
                Logros
              </button>
              <button 
                onClick={() => setActiveTab('estadisticas')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'estadisticas' 
                    ? 'border-yellow-500 text-yellow-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <i className="fas fa-chart-line"></i>
                Estadísticas
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'informacion' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Información personal</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Nombre completo</p>
                      <p className="text-gray-800">{formData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Correo electrónico</p>
                      <p className="text-gray-800">{formData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="text-gray-800">{formData.phone || 'No especificado'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Información académica</h3>
                  <div className="space-y-4">
                    {session?.user?.role === 'student' && (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">Año</p>
                          <p className="text-gray-800">{formData.year ? `${formData.year}°` : 'Sin asignar'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">División</p>
                          <p className="text-gray-800">{formData.division || 'Sin asignar'}</p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Estado académico</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Activo
                      </span>
                    </div>
                  </div>
                </div>
                {formData.bio && (
                  <div className="md:col-span-2 mt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Biografía</h3>
                    <p className="text-gray-700">{formData.bio}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'materias' && (
              <div className="text-center py-8">
                <i className="fas fa-book text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-500">Información de materias próximamente</p>
              </div>
            )}

            {activeTab === 'logros' && (
              <div className="text-center py-8">
                <i className="fas fa-trophy text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-500">Sistema de logros próximamente</p>
              </div>
            )}

            {activeTab === 'estadisticas' && (
              <div className="text-center py-8">
                <i className="fas fa-chart-line text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-500">Estadísticas académicas próximamente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Edit Profile View
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Editar perfil</h2>
        </div>
        <form onSubmit={handleSave} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Información básica</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Foto de perfil</label>
                <div className="flex items-center">
                  <div className="mr-4">
                    <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-slate-200 bg-white">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-r from-yellow-400 to-amber-400 flex items-center justify-center">
                          <span className="text-xl font-bold text-white">
                            {getInitials(formData.name || session?.user?.name || 'U')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <button 
                      type="button" 
                      className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
                      onClick={() => document.getElementById('profilePic')?.click()}
                    >
                      Cambiar foto
                    </button>
                    <input 
                      type="file" 
                      id="profilePic" 
                      accept="image/*" 
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name"
                  value={formData.name} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-yellow-300 focus:border-yellow-300"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  value={formData.email} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-yellow-300 focus:border-yellow-300"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone"
                  value={formData.phone} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-yellow-300 focus:border-yellow-300"
                />
              </div>
              
              <div className="mb-4">
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Información académica</h3>
              {session?.user?.role === 'student' && (
                <>
                  <div className="mb-4">
                    <label htmlFor="year" className="block text-sm font-medium text-slate-700 mb-1">Año</label>
                    <select
                      id="year"
                      name="year"
                      value={formData.year ?? ''}
                      onChange={handleInputChange}
                      disabled={academicLocked}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-yellow-300 focus:border-yellow-300"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="1">1° Año</option>
                      <option value="2">2° Año</option>
                      <option value="3">3° Año</option>
                      <option value="4">4° Año</option>
                      <option value="5">5° Año</option>
                      <option value="6">6° Año</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="division" className="block text-sm font-medium text-slate-700 mb-1">División</label>
                    <select
                      id="division"
                      name="division"
                      value={formData.division}
                      onChange={handleInputChange}
                      disabled={academicLocked || (formData.year ? !yearHasDivisions(formData.year) : true)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-yellow-300 focus:border-yellow-300 disabled:bg-slate-50"
                    >
                      <option value="">{formData.year && yearHasDivisions(formData.year) ? 'Seleccionar...' : 'No corresponde'}</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                    </select>
                  </div>

                  {academicLocked && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <p className="text-slate-700 text-sm">
                        Tu año/división ya están asignados. Si necesitás cambiarlos, contactá a un administrador.
                      </p>
                    </div>
                  )}
                </>
              )}
              
              <div className="mb-4">
                <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-1">Biografía</label>
                <textarea 
                  id="bio" 
                  name="bio"
                  rows={5} 
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-yellow-300 focus:border-yellow-300"
                  placeholder="Cuéntanos un poco sobre ti..."
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={handleCancel}
              className="px-4 py-2 border border-slate-200 rounded-xl shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-300"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-300"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
