"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, BellRing } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";

interface NotificationDropdownProps {
  theme?: "light" | "dark";
}

export default function NotificationDropdown({
  theme = "light",
}: NotificationDropdownProps) {
  const {
    notifications,
    stats,
    loading,
    markAsRead,
    requestNotificationPermission,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  // Obtener solo las primeras 5 notificaciones sin leer
  const recentNotifications = notifications
    .filter((n) => !n.is_read)
    .slice(0, 5);

  // Manejar click en notificación
  const handleNotificationClick = async (notificationId: string) => {
    try {
      await markAsRead([notificationId]);
    } catch {
      toast.error("Error al marcar como leída");
    }
  };

  // Solicitar permisos al abrir por primera vez
  const handleOpen = async (open: boolean) => {
    setIsOpen(open);
    if (open) {
      await requestNotificationPermission();
    }
  };

  // Obtener el icono según el tipo de notificación
  const getNotificationIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      assignment_new: "📝",
      assignment_due_soon: "⏰",
      assignment_graded: "🏆",
      assignment_comment: "💬",
      announcement: "📢",
      subject_new_content: "📚",
      system: "⚙️",
      user_action: "👤",
    };
    return iconMap[type] || "🔔";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative ${
            theme === "dark" ? "text-white hover:bg-white/20" : ""
          }`}
        >
          {stats.unread_notifications > 0 ? (
            <BellRing
              className={`h-5 w-5 ${theme === "dark" ? "text-amber-400" : ""}`}
            />
          ) : (
            <Bell
              className={`h-5 w-5 ${theme === "dark" ? "text-white" : ""}`}
            />
          )}
          {stats.unread_notifications > 0 && (
            <Badge
              variant={
                stats.high_priority_unread > 0 ? "destructive" : "default"
              }
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {stats.unread_notifications > 99
                ? "99+"
                : stats.unread_notifications}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {stats.unread_notifications > 0 && (
            <Badge variant="outline">
              {stats.unread_notifications} sin leer
            </Badge>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Cargando notificaciones...
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No tienes notificaciones sin leer
          </div>
        ) : (
          <ScrollArea className="h-64">
            {recentNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="flex items-start w-full gap-2">
                  <span className="text-lg mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">
                        {notification.title}
                      </p>
                      {(notification.priority === "high" ||
                        notification.priority === "urgent") && (
                        <Badge
                          variant={getPriorityColor(notification.priority)}
                          className="text-xs"
                        >
                          {notification.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link
            href="/campus/notifications"
            className="w-full text-center text-sm font-medium"
          >
            Ver todas las notificaciones
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
