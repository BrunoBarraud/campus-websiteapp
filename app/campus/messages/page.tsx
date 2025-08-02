import { Metadata } from 'next';
import MessagingSystem from '@/components/messaging/MessagingSystem';

export const metadata: Metadata = {
  title: 'Mensajes - Campus IPDVS',
  description: 'Sistema de mensajería para comunicación entre estudiantes, profesores y administradores',
};

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mensajes</h1>
        <p className="text-muted-foreground">
          Comunícate con profesores, estudiantes y administradores
        </p>
      </div>
      
      <MessagingSystem className="min-h-[600px]" />
    </div>
  );
}
