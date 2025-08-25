"use client";

// Forzar rendering dinámico para evitar errores de SSR
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import RoleBasedProfile from '../../../components/common/RoleBasedProfile';

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
    title: '',
    role: 'student' as 'admin' | 'teacher' | 'student',
    // Campos específicos de admin
    admin_level: '',
    department: '',
    permissions: [] as string[],
    // Campos específicos de teacher
    subjects_taught: [] as string[],
    specialization: '',
    experience_years: undefined as number | undefined,
    office_hours: '',
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
          title: userData.title || 'Estudiante de Secundaria',
          role: userData.role || session?.user?.role || 'student',
          // Campos específicos de admin
          admin_level: userData.admin_level || '',
          department: userData.department || '',
          permissions: userData.permissions || [],
          // Campos específicos de teacher
          subjects_taught: userData.subjects_taught || [],
          specialization: userData.specialization || '',
          experience_years: userData.experience_years,
          office_hours: userData.office_hours || '',
        });
        setProfileImage(userData.profile_image);
      } else {
        // Si hay error, usar datos de la sesión como fallback
        if (session?.user) {
          setFormData(prev => ({
            ...prev,
            name: session.user?.name || '',
            email: session.user?.email || '',
            role: (session.user?.role as 'admin' | 'teacher' | 'student') || 'student'
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
          email: session.user?.email || '',
          role: (session.user?.role as 'admin' | 'teacher' | 'student') || 'student'
        }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'experience_years' ? (value ? parseInt(value) : undefined) : value
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten archivos JPG, PNG o GIF');
      return;
    }
  
    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no puede ser mayor a 5MB');
      return;
    }
  
    try {
      // Mostrar previsualización inmediata
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
  
      // Subir archivo al servidor
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', 'profile_image');
      formDataUpload.append('subjectId', 'user_profiles');
  
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });
  
      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        // Actualizar formData con la URL del archivo subido
        setFormData(prev => ({
          ...prev,
          profile_image: uploadResult.url
        }));
        toast.success('Imagen subida exitosamente');
      } else {
        toast.error('Error al subir la imagen');
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
      toast.error('Error al subir la imagen');
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
          // Usar la URL del archivo subido en lugar de base64
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
              <div className="relative">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold border-4 border-white shadow-lg">
                    {getInitials(formData.name || 'Usuario')}
                  </div>
                )}
              </div>
              
              {/* Profile Info */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{formData.name || 'Usuario'}</h1>
                <p className="text-gray-600">{formData.title || (formData.role === 'admin' ? 'Administrador' : formData.role === 'teacher' ? 'Profesor' : 'Estudiante')}</p>
                <p className="text-gray-500">{formData.email}</p>
                {formData.location && (
                  <p className="text-gray-500 flex items-center gap-1 mt-1">
                    <span>📍</span> {formData.location}
                  </p>
                )}
              </div>
              
              {/* Edit Button */}
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Editar Perfil
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'informacion', label: 'Información' },
                  { id: 'materias', label: 'Materias' },
                  { id: 'logros', label: 'Logros' },
                  { id: 'estadisticas', label: 'Estadísticas' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'informacion' && (
              <div className="p-6">
                <RoleBasedProfile
                  user={formData}
                  isEditing={false}
                  onInputChange={handleInputChange}
                  onInterestChange={handleInterestChange}
                />
              </div>
            )}

            {activeTab === 'materias' && (
              <div className="p-6">
                <p className="text-gray-500">Próximamente...</p>
              </div>
            )}

            {activeTab === 'logros' && (
              <div className="p-6">
                <p className="text-gray-500">Próximamente...</p>
              </div>
            )}

            {activeTab === 'estadisticas' && (
              <div className="p-6">
                <p className="text-gray-500">Próximamente...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">Editar Perfil</h1>
          </div>
          
          <form onSubmit={handleSave} className="p-6">
            {/* Profile Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto de Perfil
              </label>
              <div className="flex items-center gap-4">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile Preview"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                    {getInitials(formData.name || 'Usuario')}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            {/* Role-based Profile Component */}
            <RoleBasedProfile
              user={formData}
              isEditing={true}
              onInputChange={handleInputChange}
              onInterestChange={handleInterestChange}
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
