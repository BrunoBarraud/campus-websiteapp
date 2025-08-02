import { Metadata } from "next";
import NotificationCenter from "@/components/dashboard/NotificationCenter";

export const metadata: Metadata = {
  title: "Centro de Notificaciones - Campus",
  description: "Mantente al día con las últimas actualizaciones del campus",
};

export default function NotificationsPage() {
  return <NotificationCenter />;
}
