'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, User, Shield, Database, Calendar, Bell, MessageSquare, Palette, Zap } from 'lucide-react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/campus/login');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) return null;

  const features = [
    {
      icon: User,
      title: 'Gestión de Usuarios',
      description: 'Administrar perfiles, roles y permisos de usuarios',
      status: 'active',
      path: '/campus/settings/users'
    },
    {
      icon: Database,
      title: 'Gestión de Materias',
      description: 'Administrar materias, profesores y configuraciones académicas',
      status: 'active',
      path: '/campus/settings/subjects'
    },
    {
      icon: Calendar,
      title: 'Sistema de Calendario',
      description: 'Gestión de eventos académicos y cronogramas',
      status: 'planned',
      path: '/campus/calendar'
    },
    {
      icon: Bell,
      title: 'Centro de Notificaciones',
      description: 'Sistema avanzado de notificaciones en tiempo real',
      status: 'planned',
      path: '/campus/notifications'
    },
    {
      icon: MessageSquare,
      title: 'Sistema de Mensajes',
      description: 'Comunicación interna entre usuarios',
      status: 'planned',
      path: '/campus/messages'
    },
    {
      icon: Palette,
      title: 'Mejorar UI/UX',
      description: 'Optimización de la interfaz de usuario',
      status: 'in-progress',
      path: null
    },
    {
      icon: Zap,
      title: 'Optimización de Rendimiento',
      description: 'Mejoras en velocidad y eficiencia del sistema',
      status: 'completed',
      path: null
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completado</Badge>;
      case 'in-progress':
        return <Badge className="bg-yellow-100 text-yellow-800">En Progreso</Badge>;
      case 'planned':
        return <Badge className="bg-gray-100 text-gray-800">Planificado</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
              <p className="text-gray-600">Gestiona las funcionalidades y configuraciones del campus</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Usuario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="font-medium">{session.user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{session.user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rol</p>
                <Badge variant={session.user?.role === 'admin' ? 'default' : 'secondary'}>
                  {session.user?.role === 'admin' ? 'Administrador' : 
                   session.user?.role === 'teacher' ? 'Profesor' : 'Estudiante'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                    {getStatusBadge(feature.status)}
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {feature.path && feature.status === 'active' && (
                    <Button 
                      onClick={() => router.push(feature.path)}
                      className="w-full"
                    >
                      Acceder
                    </Button>
                  )}
                  {feature.status === 'planned' && (
                    <Button variant="outline" disabled className="w-full">
                      Próximamente
                    </Button>
                  )}
                  {feature.status === 'in-progress' && (
                    <Button variant="outline" disabled className="w-full">
                      En Desarrollo
                    </Button>
                  )}
                  {feature.status === 'completed' && !feature.path && (
                    <Button variant="outline" disabled className="w-full">
                      ✓ Implementado
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Admin Panel Access */}
        {session.user?.role === 'admin' && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Panel de Administración Avanzado
              </CardTitle>
              <CardDescription>
                Acceso al panel administrativo completo con estadísticas y configuraciones avanzadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push('/campus/admin')}
                className="w-full"
              >
                Ir al Panel Administrativo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

