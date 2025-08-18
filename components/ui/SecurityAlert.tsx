/**
 * Componente para mostrar alertas de seguridad
 */

'use client';

import { useState, useEffect } from 'react';
import { XCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

type AlertType = 'error' | 'warning' | 'info' | 'success';

interface SecurityAlertProps {
  type?: AlertType;
  title: string;
  message: string;
  autoClose?: boolean;
  autoCloseTime?: number; // en milisegundos
  onClose?: () => void;
  actionLink?: string;
  actionText?: string;
  autoCloseDelay?: number; // en milisegundos
}

const getAlertStyles = (type: AlertType) => {
  switch (type) {
    case 'error':
      return {
        containerClass: 'bg-red-50 border-red-400 text-red-800',
        iconClass: 'text-red-500',
        Icon: XCircle
      };
    case 'warning':
      return {
        containerClass: 'bg-yellow-50 border-yellow-400 text-yellow-800',
        iconClass: 'text-yellow-500',
        Icon: AlertTriangle
      };
    case 'info':
      return {
        containerClass: 'bg-blue-50 border-blue-400 text-blue-800',
        iconClass: 'text-blue-500',
        Icon: Info
      };
    case 'success':
      return {
        containerClass: 'bg-green-50 border-green-400 text-green-800',
        iconClass: 'text-green-500',
        Icon: CheckCircle
      };
    default:
      return {
        containerClass: 'bg-blue-50 border-blue-400 text-blue-800',
        iconClass: 'text-blue-500',
        Icon: Info
      };
  }
};

const SecurityAlert: React.FC<SecurityAlertProps> = ({
  type = 'info',
  title,
  message,
  autoClose = false,
  autoCloseTime = 5000,
  onClose,
  actionLink,
  actionText = 'Ver detalles'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const { containerClass, iconClass, Icon } = getAlertStyles(type);

  useEffect(() => {
    if (autoClose && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, autoCloseTime);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseTime, isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`border-l-4 p-4 mb-4 rounded shadow-sm ${containerClass}`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconClass}`} aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium">{title}</h3>
          <div className="mt-1 text-sm">
            {message}
          </div>
          {actionLink && (
            <div className="mt-2">
              <a 
                href={actionLink} 
                className={`text-sm font-medium underline ${iconClass}`}
              >
                {actionText}
              </a>
            </div>
          )}
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${iconClass}`}
              onClick={() => {
                setIsVisible(false);
                if (onClose) onClose();
              }}
            >
              <span className="sr-only">Cerrar</span>
              <XCircle className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityAlert;