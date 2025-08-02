"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Settings, Bell, Mail, Smartphone, Clock, Save } from "lucide-react";
import { toast } from "sonner";

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  assignment_notifications: boolean;
  grade_notifications: boolean;
  comment_notifications: boolean;
  announcement_notifications: boolean;
  system_notifications: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  quiet_hours_enabled: boolean;
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    assignment_notifications: true,
    grade_notifications: true,
    comment_notifications: true,
    announcement_notifications: true,
    system_notifications: true,
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
    quiet_hours_enabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cargar configuraciones
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/notifications/settings');
        if (!response.ok) throw new Error('Error al cargar configuraciones');
        
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Error al cargar configuraciones');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Guardar configuraciones
  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) throw new Error('Error al guardar configuraciones');
      
      toast.success('Configuraciones guardadas correctamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar configuraciones');
    } finally {
      setSaving(false);
    }
  };

  // Actualizar configuración
  const updateSetting = (key: keyof NotificationSettings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando configuraciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración de Notificaciones</h1>
          <p className="text-gray-600">Personaliza cómo y cuándo recibir notificaciones</p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="flex items-center gap-2">
          <Save size={16} />
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>

      {/* Configuraciones Generales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings size={20} />
            Configuraciones Generales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-gray-600" />
              <div>
                <Label htmlFor="email-notifications" className="text-base font-medium">
                  Notificaciones por Email
                </Label>
                <p className="text-sm text-gray-600">
                  Recibir notificaciones en tu correo electrónico
                </p>
              </div>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.email_notifications}
              onCheckedChange={(checked: boolean) => updateSetting('email_notifications', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone size={20} className="text-gray-600" />
              <div>
                <Label htmlFor="push-notifications" className="text-base font-medium">
                  Notificaciones Push
                </Label>
                <p className="text-sm text-gray-600">
                  Recibir notificaciones en tiempo real en el navegador
                </p>
              </div>
            </div>
            <Switch
              id="push-notifications"
              checked={settings.push_notifications}
              onCheckedChange={(checked: boolean) => updateSetting('push_notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tipos de Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={20} />
            Tipos de Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="assignment-notifications" className="text-base font-medium">
                  Asignaciones
                </Label>
                <p className="text-sm text-gray-600">
                  Nuevas asignaciones y fechas límite
                </p>
              </div>
              <Switch
                id="assignment-notifications"
                checked={settings.assignment_notifications}
                onCheckedChange={(checked: boolean) => updateSetting('assignment_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="grade-notifications" className="text-base font-medium">
                  Calificaciones
                </Label>
                <p className="text-sm text-gray-600">
                  Cuando tus trabajos sean calificados
                </p>
              </div>
              <Switch
                id="grade-notifications"
                checked={settings.grade_notifications}
                onCheckedChange={(checked: boolean) => updateSetting('grade_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="comment-notifications" className="text-base font-medium">
                  Comentarios
                </Label>
                <p className="text-sm text-gray-600">
                  Comentarios en tus envíos
                </p>
              </div>
              <Switch
                id="comment-notifications"
                checked={settings.comment_notifications}
                onCheckedChange={(checked: boolean) => updateSetting('comment_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="announcement-notifications" className="text-base font-medium">
                  Anuncios
                </Label>
                <p className="text-sm text-gray-600">
                  Anuncios oficiales del campus
                </p>
              </div>
              <Switch
                id="announcement-notifications"
                checked={settings.announcement_notifications}
                onCheckedChange={(checked: boolean) => updateSetting('announcement_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="system-notifications" className="text-base font-medium">
                  Sistema
                </Label>
                <p className="text-sm text-gray-600">
                  Notificaciones del sistema y mantenimiento
                </p>
              </div>
              <Switch
                id="system-notifications"
                checked={settings.system_notifications}
                onCheckedChange={(checked: boolean) => updateSetting('system_notifications', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horarios Silenciosos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={20} />
            Horarios Silenciosos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Label htmlFor="quiet-hours" className="text-base font-medium">
                Activar Horarios Silenciosos
              </Label>
              <p className="text-sm text-gray-600">
                No recibir notificaciones durante ciertas horas
              </p>
            </div>
            <Switch
              id="quiet-hours"
              checked={settings.quiet_hours_enabled}
              onCheckedChange={(checked: boolean) => updateSetting('quiet_hours_enabled', checked)}
            />
          </div>

          {settings.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor="quiet-start" className="text-sm font-medium">
                  Hora de Inicio
                </Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={settings.quiet_hours_start}
                  onChange={(e) => updateSetting('quiet_hours_start', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="quiet-end" className="text-sm font-medium">
                  Hora de Fin
                </Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={settings.quiet_hours_end}
                  onChange={(e) => updateSetting('quiet_hours_end', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
