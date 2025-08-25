// Modal.tsx
import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()} // Evitar cerrar al hacer clic dentro del modal
      >
        <button className="absolute top-2 right-2 text-gray-600 hover:text-gray-800" onClick={onClose}>
          &times;
        </button>
        <div className="text-gray-900">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
