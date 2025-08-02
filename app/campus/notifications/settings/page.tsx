import { Metadata } from "next";
import NotificationSettings from "@/components/dashboard/NotificationSettings";

export const metadata: Metadata = {
  title: "Configuración de Notificaciones - Campus",
  description: "Personaliza cómo y cuándo recibir notificaciones",
};

export default function NotificationSettingsPage() {
  return <NotificationSettings />;
}
