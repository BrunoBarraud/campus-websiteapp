import React from 'react';

interface User {
  // Campos comunes
  name: string;
  email: string;
  phone?: string;
  birthdate?: string;
  location?: string;
  bio?: string;
  profile_image?: string;
  role: 'admin' | 'teacher' | 'student';
  
  // Campos específicos de admin
  admin_level?: string;
  department?: string;
  permissions?: string[];
  
  // Campos específicos de teacher
  subjects_taught?: string[];
  specialization?: string;
  experience_years?: number;
  office_hours?: string;
  
  // Campos específicos de student
  course?: string;
  year?: string;
  student_id?: string;
  interests?: string[];
  title?: string;
}

interface RoleBasedProfileProps {
  user: User;
  isEditing: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onInterestChange?: (interest: string) => void;
}

const RoleBasedProfile: React.FC<RoleBasedProfileProps> = ({
  user,
  isEditing,
  onInputChange,
  onInterestChange
}) => {
  const availableInterests = [
    'Matemáticas', 'Ciencias', 'Literatura', 'Historia', 'Arte', 'Música',
    'Deportes', 'Tecnología', 'Idiomas', 'Filosofía', 'Química', 'Física'
  ];

  const renderAdminFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nivel de Administrador
          </label>
          {isEditing ? (
            <select
              name="admin_level"
              value={user.admin_level || ''}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar nivel</option>
              <option value="super_admin">Super Administrador</option>
              <option value="admin">Administrador</option>
              <option value="moderator">Moderador</option>
            </select>
          ) : (
            <p className="text-gray-900">{user.admin_level || 'No especificado'}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Departamento
          </label>
          {isEditing ? (
            <input
              type="text"
              name="department"
              value={user.department || ''}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Administración Académica"
            />
          ) : (
            <p className="text-gray-900">{user.department || 'No especificado'}</p>
          )}
        </div>
      </div>
    </>
  );

  const renderTeacherFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Especialización
          </label>
          {isEditing ? (
            <input
              type="text"
              name="specialization"
              value={user.specialization || ''}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Matemáticas, Ciencias, Literatura"
            />
          ) : (
            <p className="text-gray-900">{user.specialization || 'No especificado'}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Años de Experiencia
          </label>
          {isEditing ? (
            <input
              type="number"
              name="experience_years"
              value={user.experience_years || ''}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 5"
              min="0"
            />
          ) : (
            <p className="text-gray-900">{user.experience_years ? `${user.experience_years} años` : 'No especificado'}</p>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Horarios de Consulta
        </label>
        {isEditing ? (
          <textarea
            name="office_hours"
            value={user.office_hours || ''}
            onChange={onInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Lunes a Viernes de 14:00 a 16:00"
          />
        ) : (
          <p className="text-gray-900">{user.office_hours || 'No especificado'}</p>
        )}
      </div>
    </>
  );

  const renderStudentFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Curso Actual
          </label>
          {isEditing ? (
            <select
              name="course"
              value={user.course || ''}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar curso</option>
              <option value="1er Año">1er Año</option>
              <option value="2do Año">2do Año</option>
              <option value="3er Año">3er Año</option>
              <option value="4to Año">4to Año</option>
              <option value="5to Año">5to Año</option>
              <option value="6to Año">6to Año</option>
            </select>
          ) : (
            <p className="text-gray-900">{user.course || 'No especificado'}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Año Lectivo
          </label>
          {isEditing ? (
            <input
              type="text"
              name="year"
              value={user.year || ''}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 2025"
            />
          ) : (
            <p className="text-gray-900">{user.year || 'No especificado'}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID de Estudiante
          </label>
          {isEditing ? (
            <input
              type="text"
              name="student_id"
              value={user.student_id || ''}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: EST2025001"
            />
          ) : (
            <p className="text-gray-900">{user.student_id || 'No especificado'}</p>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Título/Descripción
        </label>
        {isEditing ? (
          <input
            type="text"
            name="title"
            value={user.title || ''}
            onChange={onInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Estudiante de Secundaria"
          />
        ) : (
          <p className="text-gray-900">{user.title || 'Estudiante'}</p>
        )}
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      {/* Información Personal Común */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo
            </label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={user.name}
                onChange={onInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{user.name}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <p className="text-gray-900">{user.email}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={user.phone || ''}
                onChange={onInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: +54 9 11 1234-5678"
              />
            ) : (
              <p className="text-gray-900">{user.phone || 'No especificado'}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Nacimiento
            </label>
            {isEditing ? (
              <input
                type="date"
                name="birthdate"
                value={user.birthdate || ''}
                onChange={onInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{user.birthdate || 'No especificado'}</p>
            )}
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ubicación
            </label>
            {isEditing ? (
              <input
                type="text"
                name="location"
                value={user.location || ''}
                onChange={onInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Buenos Aires, Argentina"
              />
            ) : (
              <p className="text-gray-900">{user.location || 'No especificado'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Campos específicos por rol */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información {user.role === 'admin' ? 'Administrativa' : user.role === 'teacher' ? 'Docente' : 'Académica'}
        </h3>
        {user.role === 'admin' && renderAdminFields()}
        {user.role === 'teacher' && renderTeacherFields()}
        {user.role === 'student' && renderStudentFields()}
      </div>

      {/* Biografía */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Biografía</h3>
        {isEditing ? (
          <textarea
            name="bio"
            value={user.bio || ''}
            onChange={onInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Cuéntanos sobre ti..."
          />
        ) : (
          <p className="text-gray-900">{user.bio || 'No hay biografía disponible.'}</p>
        )}
      </div>

      {/* Intereses (solo para estudiantes) */}
      {user.role === 'student' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Intereses Académicos</h3>
          {isEditing ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableInterests.map((interest) => (
                <label key={interest} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={user.interests?.includes(interest) || false}
                    onChange={() => onInterestChange?.(interest)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{interest}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {user.interests && user.interests.length > 0 ? (
                user.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No hay intereses especificados.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoleBasedProfile;