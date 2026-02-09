'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SubjectUnit } from '@/app/lib/types';
import { FiMenu, FiEdit2, FiTrash2, FiPlus, FiFile } from 'react-icons/fi';

interface SortableUnitProps {
  unit: SubjectUnit;
  onEdit: (unit: SubjectUnit) => void;
  onDelete: (unitId: string) => void;
  onAddContent: (unitId: string) => void;
  onUploadDocument: (unitId: string) => void;
  isDragging: boolean;
}

export function SortableUnit({ unit, onEdit, onDelete, onAddContent, onUploadDocument, isDragging }: SortableUnitProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isDraggingThis
  } = useSortable({ id: unit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDraggingThis ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDraggingThis ? 1 : 0
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${
        isDragging ? 'shadow-lg border-blue-500' : ''
      }`}
    >
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <div {...attributes} {...listeners} className="text-gray-400 hover:text-gray-600 cursor-grab">
            <FiMenu className="w-5 h-5" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              Unidad {unit.unit_number}: {unit.title}
            </h3>
            {unit.description && (
              <p className="mt-1 text-sm text-gray-500">
                {unit.description}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onAddContent(unit.id)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
              title="Agregar contenido"
            >
              <FiPlus className="w-5 h-5" />
            </button>
            <button
              onClick={() => onUploadDocument(unit.id)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-full"
              title="Subir documento"
            >
              <FiFile className="w-5 h-5" />
            </button>
            <button
              onClick={() => onEdit(unit)}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-full"
              title="Editar unidad"
            >
              <FiEdit2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(unit.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-full"
              title="Eliminar unidad"
            >
              <FiTrash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
