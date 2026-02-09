'use client';

import { useState } from 'react';
import { SubjectUnit } from '@/app/lib/types';

export interface UnitTemplate {
  id: string;
  name: string;
  description: string;
  units: Partial<SubjectUnit>[];
}

const DEFAULT_TEMPLATES: UnitTemplate[] = [
  {
    id: 'basic',
    name: 'Estructura Básica',
    description: 'Plantilla básica con 4 unidades fundamentales',
    units: [
      {
        unit_number: 1,
        title: 'Introducción a la Materia',
        description: 'Conceptos fundamentales y objetivos del curso'
      },
      {
        unit_number: 2,
        title: 'Desarrollo Teórico',
        description: 'Fundamentos teóricos principales'
      },
      {
        unit_number: 3,
        title: 'Aplicaciones Prácticas',
        description: 'Ejercicios y casos prácticos'
      },
      {
        unit_number: 4,
        title: 'Evaluación y Cierre',
        description: 'Integración de conceptos y evaluación final'
      }
    ]
  },
  {
    id: 'project',
    name: 'Basado en Proyectos',
    description: 'Estructura orientada al desarrollo de proyectos',
    units: [
      {
        unit_number: 1,
        title: 'Planificación del Proyecto',
        description: 'Definición de objetivos y alcance'
      },
      {
        unit_number: 2,
        title: 'Investigación y Análisis',
        description: 'Recopilación y análisis de información'
      },
      {
        unit_number: 3,
        title: 'Desarrollo del Proyecto',
        description: 'Implementación y desarrollo'
      },
      {
        unit_number: 4,
        title: 'Presentación y Evaluación',
        description: 'Presentación de resultados y evaluación'
      }
    ]
  }
];

interface UnitTemplatesProps {
  onSelectTemplate: (template: UnitTemplate) => void;
  onClose: () => void;
}

export function UnitTemplates({ onSelectTemplate, onClose }: UnitTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEFAULT_TEMPLATES.map((template) => (
          <div
            key={template.id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedTemplate === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <h3 className="text-lg font-medium">{template.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            <div className="mt-3 space-y-2">
              {template.units.map((unit, index) => (
                <div key={index} className="text-sm text-gray-500">
                  • Unidad {unit.unit_number}: {unit.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!selectedTemplate}
          onClick={() => {
            const template = DEFAULT_TEMPLATES.find(t => t.id === selectedTemplate);
            if (template) {
              onSelectTemplate(template);
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Usar Plantilla
        </button>
      </div>
    </div>
  );
}
