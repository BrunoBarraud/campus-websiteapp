// Ejemplo de formulario para crear/editar materias
// Este archivo muestra cómo usar las nuevas utilidades de división
import React, { useState } from 'react';
import { DivisionSelector, YearDivisionDisplay } from '@/components/ui/DivisionSelector';
import { isValidDivisionForYear } from '@/app/lib/utils/divisions';

interface SubjectFormData {
  name: string;
  code: string;
  description: string;
  year: number;
  division?: string;
  teacher_id?: string;
  image_url?: string;
}

interface SubjectFormProps {
  initialData?: Partial<SubjectFormData>;
  onSubmit: (data: SubjectFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export const SubjectForm: React.FC<SubjectFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<SubjectFormData>({
    name: initialData.name || '',
    code: initialData.code || '',
    description: initialData.description || '',
    year: initialData.year || 1,
    division: initialData.division || '',
    teacher_id: initialData.teacher_id || '',
    image_url: initialData.image_url || ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'El código es requerido';
    }

    if (formData.year < 1 || formData.year > 6) {
      newErrors.year = 'El año debe estar entre 1 y 6';
    }

    // Validar división según el año
    if (!isValidDivisionForYear(formData.year, formData.division)) {
      if (formData.year >= 1 && formData.year <= 4) {
        newErrors.division = 'Debe seleccionar una división (A o B) para años 1° a 4°';
      } else if (formData.division) {
        newErrors.division = '5° y 6° año no deben tener división';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Limpiar división para 5° y 6° año
    const submitData = {
      ...formData,
      division: (formData.year >= 5) ? undefined : formData.division
    };

    onSubmit(submitData);
  };

  const handleYearChange = (year: number) => {
    setFormData(prev => ({
      ...prev,
      year,
      // Limpiar división si el año no la requiere
      division: (year >= 5) ? '' : prev.division
    }));
    // Limpiar errores relacionados
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.year;
      delete newErrors.division;
      return newErrors;
    });
  };

  const handleDivisionChange = (division: string) => {
    setFormData(prev => ({ ...prev, division }));
    // Limpiar error de división
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.division;
      return newErrors;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la Materia <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ej: Matemática"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Código */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Código <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
              errors.code ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ej: MAT-1A"
          />
          {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          placeholder="Descripción de la materia (opcional)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Año */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Año <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.year}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
              errors.year ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {[1, 2, 3, 4, 5, 6].map(year => (
              <option key={year} value={year}>
                {year}° Año
              </option>
            ))}
          </select>
          {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
        </div>

        {/* División */}
        <DivisionSelector
          year={formData.year}
          division={formData.division}
          onDivisionChange={handleDivisionChange}
          required={formData.year >= 1 && formData.year <= 4}
        />
      </div>

      {errors.division && <p className="text-red-500 text-xs">{errors.division}</p>}

      {/* Preview */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Vista previa:</h4>
        <p className="text-lg font-semibold">
          {formData.name || 'Nombre de la materia'}
        </p>
        <p className="text-sm text-gray-600">
          <YearDivisionDisplay year={formData.year} division={formData.division} />
          {formData.code && ` • ${formData.code}`}
        </p>
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-rose-500 text-white rounded-lg hover:from-yellow-600 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl"
        >
          {isEditing ? 'Actualizar' : 'Crear'} Materia
        </button>
      </div>
    </form>
  );
};
