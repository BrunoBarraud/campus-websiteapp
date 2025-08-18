'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, QrCode, Smartphone, Copy, Check, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TwoFactorAuthProps {
  userId: string;
}

export default function TwoFactorAuth({ userId }: TwoFactorAuthProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Verificar si el usuario ya tiene 2FA habilitado
  useEffect(() => {
    const check2FAStatus = async () => {
      try {
        const response = await fetch(`/api/auth/2fa/status?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setIsEnabled(data.enabled);
        }
      } catch (error) {
        console.error('Error al verificar estado de 2FA:', error);
      }
    };

    if (userId) {
      check2FAStatus();
    }
  }, [userId]);

  const handleToggle = async () => {
    if (isEnabled) {
      // Desactivar 2FA
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/2fa/disable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        if (response.ok) {
          setIsEnabled(false);
          setSuccess('Autenticación de dos factores desactivada correctamente');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          const data = await response.json();
          setError(data.message || 'Error al desactivar 2FA');
        }
      } catch (error) {
        setError('Error al comunicarse con el servidor');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Iniciar configuración de 2FA
      setIsSetupMode(true);
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/2fa/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        if (response.ok) {
          const data = await response.json();
          setQrCodeUrl(data.qrCodeUrl);
          setSetupKey(data.setupKey);
        } else {
          const data = await response.json();
          setError(data.message || 'Error al configurar 2FA');
        }
      } catch (error) {
        setError('Error al comunicarse con el servidor');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Por favor, introduce un código de verificación válido de 6 dígitos');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          verificationCode,
          setupKey // Necesario para completar la configuración
        }),
      });

      if (response.ok) {
        setIsEnabled(true);
        setIsSetupMode(false);
        setSuccess('Autenticación de dos factores activada correctamente');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Código de verificación incorrecto');
      }
    } catch (error) {
      setError('Error al comunicarse con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySetupKey = () => {
    navigator.clipboard.writeText(setupKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCancel = () => {
    setIsSetupMode(false);
    setVerificationCode('');
    setError('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Autenticación de dos factores
        </CardTitle>
        <CardDescription>
          Añade una capa adicional de seguridad a tu cuenta requiriendo un código de verificación además de tu contraseña.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="mb-4">
            <Check className="h-4 w-4" />
            <AlertTitle>Éxito</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        {isSetupMode ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-muted/50">
              {qrCodeUrl && (
                <div className="mb-4 text-center">
                  <h3 className="text-sm font-medium mb-2">Escanea este código QR con tu aplicación de autenticación</h3>
                  <div className="inline-block p-2 bg-white rounded-md">
                    <img src={qrCodeUrl} alt="Código QR para 2FA" className="w-48 h-48" />
                  </div>
                </div>
              )}
              
              <div className="w-full max-w-md">
                <h3 className="text-sm font-medium mb-2">O ingresa esta clave en tu aplicación de autenticación:</h3>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <code className="text-sm font-mono flex-1 break-all">{setupKey}</code>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={handleCopySetupKey}
                          className="h-8 w-8"
                        >
                          {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isCopied ? 'Copiado!' : 'Copiar clave'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="verification-code">Código de verificación</Label>
              <div className="flex gap-2">
                <Input
                  id="verification-code"
                  placeholder="Ingresa el código de 6 dígitos"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  maxLength={6}
                  className="font-mono text-center tracking-widest"
                />
                <Button onClick={handleVerify} disabled={isLoading || verificationCode.length !== 6}>
                  {isLoading ? 'Verificando...' : 'Verificar'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Ingresa el código de 6 dígitos generado por tu aplicación de autenticación
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Estado: {isEnabled ? 'Activado' : 'Desactivado'}</h3>
              <p className="text-sm text-muted-foreground">
                {isEnabled 
                  ? 'Tu cuenta está protegida con autenticación de dos factores.' 
                  : 'Activa la autenticación de dos factores para mayor seguridad.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={isEnabled} 
                onCheckedChange={handleToggle}
                disabled={isLoading}
              />
              <span className="text-sm font-medium">
                {isEnabled ? 'Activado' : 'Desactivado'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
      
      {!isSetupMode && (
        <CardFooter className="flex justify-between border-t px-6 py-4 bg-muted/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Smartphone className="h-4 w-4" />
            <span>Recomendamos usar Google Authenticator o Microsoft Authenticator</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}