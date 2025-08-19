"use client";

// Forzar rendering dinámico para evitar errores de SSR
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('informacion');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthdate: '',
    location: '',
    course: '',
    year: '',
    student_id: '',
    bio: '',
    interests: [] as string[],
    title: ''
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
          birthdate: userData.birthdate || '',
          location: userData.location || '',
          course: userData.course || '6to Año',
          year: userData.year || '2025',
          student_id: userData.student_id || '',
          bio: userData.bio || 'Estudiante del Instituto Privado Dalmacio Vélez Sarsfield',
          interests: userData.interests || [],
          title: userData.title || 'Estudiante de Secundaria'
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInterestChange = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest) 
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
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
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          profile_image: profileImage
        }),
      });

      if (response.ok) {
        toast.success('Perfil actualizado exitosamente');
        setIsEditing(false);
        fetchUserProfile(); // Recargar datos
      } else {
        toast.error('Error al actualizar el perfil');
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
      <div className="bg-gray-50 min-h-screen">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-pink-500 h-32 w-full"></div>
          <div className="px-6 py-6">
            <div className="flex items-start gap-6">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                <div className="h-24 w-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden -mt-12">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-r from-yellow-400 to-pink-400 flex items-center justify-center">
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
                    <h2 className="text-2xl font-bold text-gray-800">{formData.name || session?.user?.name}</h2>
                    <p className="text-gray-600 mt-1">{formData.title}</p>
                  </div>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition flex items-center gap-2"
                  >
                    <i className="fas fa-edit"></i>
                    Editar perfil
                  </button>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-gray-600">
                    <i className="fas fa-school mr-2 text-yellow-600"></i>
                    <span>Instituto Privado Dalmacio Vélez Sarsfield</span>
                  </div>
                  {formData.location && (
                    <div className="flex items-center text-gray-600">
                      <i className="fas fa-map-marker-alt mr-2 text-yellow-600"></i>
                      <span>{formData.location}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <i className="fas fa-calendar-alt mr-2 text-yellow-600"></i>
                    <span>Última conexión: Hoy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button 
                onClick={() => setActiveTab('informacion')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'informacion' 
                    ? 'border-yellow-500 text-yellow-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                    <div>
                      <p className="text-sm text-gray-500">Fecha de nacimiento</p>
                      <p className="text-gray-800">{formData.birthdate || 'No especificado'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Información académica</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Curso actual</p>
                      <p className="text-gray-800">{formData.course}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Año lectivo</p>
                      <p className="text-gray-800">{formData.year}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ID de estudiante</p>
                      <p className="text-gray-800">{formData.student_id || 'No asignado'}</p>
                    </div>
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
                {formData.interests.length > 0 && (
                  <div className="md:col-span-2 mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Intereses académicos</h3>
                    <div className="flex flex-wrap gap-2">
                      {formData.interests.map((interest, index) => (
                        <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                          {interest}
                        </span>
                      ))}
                    </div>
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
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Editar perfil</h2>
        </div>
        <form onSubmit={handleSave} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información básica</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto de perfil</label>
                <div className="flex items-center">
                  <div className="mr-4">
                    <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-gray-300">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-r from-yellow-400 to-pink-400 flex items-center justify-center">
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
                      className="px-3 py-1 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200"
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
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name"
                  value={formData.name} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  value={formData.email} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone"
                  value={formData.phone} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
                <input 
                  type="date" 
                  id="birthdate" 
                  name="birthdate"
                  value={formData.birthdate} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <input 
                  type="text" 
                  id="location" 
                  name="location"
                  value={formData.location} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información académica</h3>
              
              <div className="mb-4">
                <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">Curso actual</label>
                <select 
                  id="course" 
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="1er Año">1er Año</option>
                  <option value="2do Año">2do Año</option>
                  <option value="3er Año">3er Año</option>
                  <option value="4to Año">4to Año</option>
                  <option value="5to Año">5to Año</option>
                  <option value="6to Año">6to Año</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Año lectivo</label>
                <select 
                  id="year" 
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="student_id" className="block text-sm font-medium text-gray-700 mb-1">ID de estudiante</label>
                <input 
                  type="text" 
                  id="student_id" 
                  name="student_id"
                  value={formData.student_id} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Título/Descripción</label>
                <input 
                  type="text" 
                  id="title" 
                  name="title"
                  placeholder="Ej: Estudiante de 6to Año" 
                  value={formData.title} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Biografía</label>
                <textarea 
                  id="bio" 
                  name="bio"
                  rows={5} 
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Cuéntanos un poco sobre ti..."
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
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
