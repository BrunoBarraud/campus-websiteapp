/**
 * Componente para mostrar notificación de bloqueo de cuenta
 */

'use client';

import { useState, useEffect } from 'react';
import SecurityAlert from '@/components/ui/SecurityAlert';

interface AccountLockoutNoticeProps {
  email: string;
}

const AccountLockoutNotice: React.FC<AccountLockoutNoticeProps> = ({ email }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  useEffect(() => {
    // Verificar si la cuenta está bloqueada
    const checkLockoutStatus = async () => {
      try {
        const response = await fetch(`/api/auth/account-status?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        
        if (data.isLocked && data.lockoutUntil) {
          setIsLocked(true);
          setLockoutEndTime(new Date(data.lockoutUntil));
        } else {
          setIsLocked(false);
          setLockoutEndTime(null);
        }
      } catch (error) {
        console.error('Error al verificar estado de bloqueo:', error);
      }
    };
    
    if (email) {
      checkLockoutStatus();
    }
  }, [email]);
  
  useEffect(() => {
    // Actualizar el tiempo restante cada segundo
    if (!isLocked || !lockoutEndTime) return;
    
    const updateTimeRemaining = () => {
      const now = new Date();
      const diffMs = lockoutEndTime.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setIsLocked(false);
        setLockoutEndTime(null);
        return;
      }
      
      // Calcular minutos y segundos restantes
      const diffMins = Math.floor(diffMs / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);
      
      setTimeRemaining(`${diffMins}:${diffSecs.toString().padStart(2, '0')}`);
    };
    
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [isLocked, lockoutEndTime]);
  
  if (!isLocked) return null;
  
  return (
    <SecurityAlert
      type="error"
      title="Cuenta bloqueada temporalmente"
      message={`Tu cuenta ha sido bloqueada temporalmente por demasiados intentos fallidos de inicio de sesión. Por favor, inténtalo de nuevo en ${timeRemaining} minutos.`}
    />
  );
};

export default AccountLockoutNotice;