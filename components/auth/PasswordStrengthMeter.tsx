/**
 * Componente para mostrar la fortaleza de una contraseña
 */

'use client';

import { useState, useEffect } from 'react';
import { calculatePasswordStrength } from '@/app/lib/security/password-policy';

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ 
  password, 
  className = '' 
}) => {
  const [strength, setStrength] = useState(0);
  const [label, setLabel] = useState('');
  
  useEffect(() => {
    // Calcular la fortaleza de la contraseña
    const score = calculatePasswordStrength(password);
    setStrength(score);
    
    // Determinar la etiqueta según la puntuación
    if (score === 0) {
      setLabel('');
    } else if (score < 30) {
      setLabel('Débil');
    } else if (score < 60) {
      setLabel('Moderada');
    } else if (score < 80) {
      setLabel('Fuerte');
    } else {
      setLabel('Muy fuerte');
    }
  }, [password]);
  
  // No mostrar nada si no hay contraseña
  if (!password) return null;
  
  // Determinar el color según la fortaleza
  const getColorClass = () => {
    if (strength < 30) return 'bg-red-500';
    if (strength < 60) return 'bg-yellow-500';
    if (strength < 80) return 'bg-green-500';
    return 'bg-green-600';
  };
  
  return (
    <div className={`mt-2 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getColorClass()} transition-all duration-300 ease-in-out`}
            style={{ width: `${strength}%` }}
          />
        </div>
        {label && (
          <span className="ml-2 text-xs text-gray-600">{label}</span>
        )}
      </div>
      
      {strength > 0 && strength < 60 && (
        <p className="text-xs text-gray-600 mt-1">
          Para una contraseña más segura, incluye mayúsculas, minúsculas, números y símbolos.
        </p>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;