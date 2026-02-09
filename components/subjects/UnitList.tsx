'use client';

import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableUnit } from './SortableUnit';
import { SubjectUnit } from '@/app/lib/types';

interface UnitListProps {
  units: SubjectUnit[];
  onReorder: (units: SubjectUnit[]) => void;
  onEdit: (unit: SubjectUnit) => void;
  onDelete: (unitId: string) => void;
  onAddContent: (unitId: string) => void;
  onUploadDocument: (unitId: string) => void;
}

export function UnitList({ units, onReorder, onEdit, onDelete, onAddContent, onUploadDocument }: UnitListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id) {
      const oldIndex = units.findIndex((unit) => unit.id === active.id);
      const newIndex = units.findIndex((unit) => unit.id === over.id);

      const newUnits = arrayMove(units, oldIndex, newIndex).map((unit, index) => ({
        ...unit,
        order_index: index + 1
      }));

      onReorder(newUnits);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-3">
        <SortableContext items={units.map(unit => unit.id)} strategy={verticalListSortingStrategy}>
          {units.map((unit) => (
            <SortableUnit
              key={unit.id}
              unit={unit}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddContent={onAddContent}
              onUploadDocument={onUploadDocument}
              isDragging={activeId === unit.id}
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
}
