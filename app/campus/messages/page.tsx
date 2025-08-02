import { Metadata } from 'next';
import CampusLayout from '@/components/layouts/CampusLayout';
import MessagingSystem from '@/components/messaging/MessagingSystem';

export const metadata: Metadata = {
  title: 'Mensajes - Campus IPDVS',
  description: 'Sistema de mensajería para comunicación entre estudiantes, profesores y administradores',
};

export default function MessagesPage() {
  return (
    <CampusLayout>
      <div className="p-6 bg-gray-50 min-h-full">
        {/* Header Section */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl text-white">💬</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mensajes</h1>
              <p className="text-gray-600 mt-1">
                Comunícate con profesores, estudiantes y administradores
              </p>
            </div>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <MessagingSystem className="min-h-[600px]" />
        </div>
      </div>
    </CampusLayout>
  );
}
