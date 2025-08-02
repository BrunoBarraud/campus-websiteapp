import { Metadata } from "next";
import CampusLayout from '@/components/layouts/CampusLayout';
import NotificationCenter from "@/components/dashboard/NotificationCenter";

export const metadata: Metadata = {
  title: "Centro de Notificaciones - Campus",
  description: "Mantente al día con las últimas actualizaciones del campus",
};

export default function NotificationsPage() {
  return (
    <CampusLayout>
      <div className="p-6 bg-gray-50 min-h-full">
      {/* Header Section */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-2xl text-white">🔔</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
            <p className="text-gray-600 mt-1">
              Mantente al día con las últimas actualizaciones del campus
            </p>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <NotificationCenter />
      </div>
    </div>
    </CampusLayout>
  );
}
