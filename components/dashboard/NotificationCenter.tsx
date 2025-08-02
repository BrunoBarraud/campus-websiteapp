"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  Pin,
  Clock,
  AlertCircle,
  Info,
  BookOpen,
  MessageSquare,
  Trophy,
  User,
  Calendar,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useNotifications } from "@/hooks/useNotifications";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "low" | "normal" | "high" | "urgent";
  target_roles: string[] | null;
  expires_at?: string;
  is_pinned: boolean;
  is_active: boolean;
  created_at: string;
  author: {
    id: string;
    full_name: string;
  };
}

export default function NotificationCenter() {
  const {
    notifications: allNotifications,
    stats,
    loading,
    markAsRead,
    deleteNotification: deleteNotificationHook,
  } = useNotifications();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeTab, setActiveTab] = useState("notifications");
  const [filter, setFilter] = useState<"all" | "unread" | "high-priority">(
    "all"
  );

  // Filtrar notificaciones según el filtro activo
  const notifications = allNotifications.filter((notification) => {
    if (filter === "unread") return !notification.is_read;
    if (filter === "high-priority")
      return (
        notification.priority === "high" || notification.priority === "urgent"
      );
    return true;
  });

  // Iconos para tipos de notificación
  const getNotificationIcon = (type: string, priority: string) => {
    const iconProps = {
      size: 16,
      className: `${
        priority === "urgent"
          ? "text-red-500"
          : priority === "high"
          ? "text-orange-500"
          : priority === "low"
          ? "text-gray-500"
          : "text-blue-500"
      }`,
    };

    switch (type) {
      case "assignment_new":
      case "assignment_due_soon":
        return <BookOpen {...iconProps} />;
      case "assignment_graded":
        return <Trophy {...iconProps} />;
      case "assignment_comment":
        return <MessageSquare {...iconProps} />;
      case "announcement":
        return <Megaphone {...iconProps} />;
      case "subject_new_content":
        return <Calendar {...iconProps} />;
      case "user_action":
        return <User {...iconProps} />;
      case "system":
        return <AlertCircle {...iconProps} />;
      default:
        return <Info {...iconProps} />;
    }
  };

  // Obtener el color del badge según la prioridad
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "low":
        return "bg-gray-400 text-white";
      default:
        return "bg-blue-500 text-white";
    }
  };

  // Cargar anuncios
  const loadAnnouncements = useCallback(async () => {
    try {
      const response = await fetch("/api/announcements");
      if (!response.ok) throw new Error("Error al cargar anuncios");

      const data = await response.json();
      setAnnouncements(data);
    } catch (error) {
      console.error("Error loading announcements:", error);
      toast.error("Error al cargar anuncios");
    }
  }, []);

  // Cargar anuncios al montar el componente
  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // Marcar todas las notificaciones como leídas
  const markAllAsRead = async () => {
    try {
      const unreadIds = allNotifications
        .filter((n) => !n.is_read)
        .map((n) => n.id);

      if (unreadIds.length > 0) {
        await markAsRead(unreadIds);
        toast.success("Todas las notificaciones marcadas como leídas");
      }
    } catch {
      toast.error("Error al marcar todas como leídas");
    }
  };

  // Eliminar notificación
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotificationHook(notificationId);
      toast.success("Notificación eliminada");
    } catch {
      toast.error("Error al eliminar notificación");
    }
  };

  // Marcar notificación individual como leída
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead([notificationId]);
      toast.success("Notificación marcada como leída");
    } catch {
      toast.error("Error al marcar como leída");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">
            Cargando notificaciones...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Centro de Notificaciones
          </h1>
          <p className="text-gray-600">
            Mantente al día con las últimas actualizaciones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Bell size={14} />
            {stats.unread_notifications} sin leer
          </Badge>
          {stats.high_priority_unread > 0 && (
            <Badge className={getPriorityColor("high")}>
              <AlertCircle size={14} className="mr-1" />
              {stats.high_priority_unread} urgentes
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <BellRing size={16} />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger
            value="announcements"
            className="flex items-center gap-2"
          >
            <Megaphone size={16} />
            Anuncios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bell size={20} />
                  Notificaciones Recientes
                </CardTitle>
                <div className="flex items-center gap-2">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="all">Todas</option>
                    <option value="unread">Sin leer</option>
                    <option value="high-priority">Alta prioridad</option>
                  </select>
                  {stats.unread_notifications > 0 && (
                    <Button size="sm" variant="outline" onClick={markAllAsRead}>
                      <CheckCheck size={14} className="mr-1" />
                      Marcar todas como leídas
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No hay notificaciones para mostrar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                          !notification.is_read
                            ? "bg-blue-50 border-blue-200"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {getNotificationIcon(
                              notification.type,
                              notification.priority
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {notification.title}
                                </h4>
                                <Badge
                                  className={getPriorityColor(
                                    notification.priority
                                  )}
                                >
                                  {notification.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock size={12} />
                                {formatDistanceToNow(
                                  new Date(notification.created_at),
                                  {
                                    addSuffix: true,
                                    locale: es,
                                  }
                                )}
                                {notification.is_read && (
                                  <span className="flex items-center gap-1">
                                    •{" "}
                                    <Check
                                      size={12}
                                      className="text-green-500"
                                    />
                                    Leída
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-4">
                            {!notification.is_read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleMarkAsRead(notification.id)
                                }
                                className="h-8 w-8 p-0"
                              >
                                <Check size={14} />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleDeleteNotification(notification.id)
                              }
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone size={20} />
                Anuncios Oficiales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {announcements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Megaphone size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No hay anuncios para mostrar</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <div
                        key={announcement.id}
                        className={`p-4 border rounded-lg ${
                          announcement.is_pinned
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {announcement.is_pinned && (
                              <Pin size={16} className="text-yellow-600" />
                            )}
                            <h3 className="font-semibold text-gray-900">
                              {announcement.title}
                            </h3>
                            <Badge
                              className={getPriorityColor(
                                announcement.priority
                              )}
                            >
                              {announcement.priority}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDistanceToNow(
                              new Date(announcement.created_at),
                              {
                                addSuffix: true,
                                locale: es,
                              }
                            )}
                          </div>
                        </div>

                        <div className="prose prose-sm max-w-none mb-3">
                          <p className="text-gray-700 leading-relaxed">
                            {announcement.content}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Por: {announcement.author.full_name}</span>
                          {announcement.expires_at && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              Expira:{" "}
                              {new Date(
                                announcement.expires_at
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
