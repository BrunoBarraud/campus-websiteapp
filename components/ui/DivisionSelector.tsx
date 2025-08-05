// Componente para selección de división según el año académico
import React from "react";
import {
  yearHasDivisions,
  getAvailableDivisions,
  formatSubjectYearDivision,
} from "@/app/lib/utils/divisions";

interface DivisionSelectorProps {
  year: number;
  division?: string;
  onDivisionChange: (division: string) => void;
  className?: string;
  required?: boolean;
}

export const DivisionSelector: React.FC<DivisionSelectorProps> = ({
  year,
  division,
  onDivisionChange,
  className = "",
  required = false,
}) => {
  const hasDivisions = yearHasDivisions(year);
  const availableDivisions = getAvailableDivisions(year);

  if (!hasDivisions) {
    return (
      <div className={`p-3 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-sm text-gray-600">
          <i className="fas fa-info-circle mr-2"></i>
          {year}° Año no tiene divisiones
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        División {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={division || ""}
        onChange={(e) => onDivisionChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
        required={required}
      >
        <option value="">Seleccionar división</option>
        {availableDivisions.map((div) => (
          <option key={div} value={div}>
            División {div}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-1">
        {year}° Año se divide en: {availableDivisions.join(" y ")}
      </p>
    </div>
  );
};

interface YearDivisionDisplayProps {
  year: number;
  division?: string;
  className?: string;
}

export const YearDivisionDisplay: React.FC<YearDivisionDisplayProps> = ({
  year,
  division,
  className = "",
}) => {
  return (
    <span className={className}>
      {formatSubjectYearDivision(year, division)}
    </span>
  );
};
