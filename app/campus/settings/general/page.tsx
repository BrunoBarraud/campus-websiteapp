"use client";

export const dynamic = 'force-dynamic';

import React, { useState } from "react";
import { FiSave, FiRefreshCw, FiBell, FiMail, FiGlobe, FiClock, FiShield, FiSun } from 'react-icons/fi';

const GeneralSettingsPage = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    pushNotifications: false,
    language: 'es',
    timezone: 'America/Argentina/Buenos_Aires',
    autoSave: true,
    showPrivateProfile: false,
    twoFactorAuth: false,
    sessionTimeout: 30
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSettingChange = (key: string, value: boolean | string | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    alert('Configuraciones guardadas exitosamente');
  };

  const resetToDefaults = () => {
    setSettings({
      notifications: true,
      emailNotifications: true,
      pushNotifications: false,
      language: 'es',
      timezone: 'America/Argentina/Buenos_Aires',
      autoSave: true,
      showPrivateProfile: false,
      twoFactorAuth: false,
      sessionTimeout: 30
    });
  };

  return (
    <div className="bg-gradient-to-br from-yellow-50 via-white to-rose-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-600 to-rose-600 bg-clip-text text-transparent">
              Configuración General
            </h1>
            <p className="text-gray-600">Personaliza tu experiencia en Campus Virtual</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Configuraciones de apariencia */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-yellow-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-gradient-to-r from-yellow-500 to-rose-500 rounded-lg mr-3">
                    <FiSun className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Apariencia</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-700 flex items-center">
                        <FiGlobe className="w-4 h-4 mr-2" />
                        Idioma
                      </label>
                      <p className="text-sm text-gray-500">Selecciona tu idioma preferido</p>
                    </div>
                    <select
                      value={settings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                      <option value="pt">Português</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-700 flex items-center">
                        <FiClock className="w-4 h-4 mr-2" />
                        Zona horaria
                      </label>
                      <p className="text-sm text-gray-500">Configura tu zona horaria</p>
                    </div>
                    <select
                      value={settings.timezone}
                      onChange={(e) => handleSettingChange('timezone', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="America/Argentina/Buenos_Aires">Buenos Aires</option>
                      <option value="America/Santiago">Santiago</option>
                      <option value="America/Sao_Paulo">São Paulo</option>
                      <option value="America/Lima">Lima</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Configuraciones de notificaciones */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-blue-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mr-3">
                    <FiBell className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Notificaciones</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-700">Notificaciones generales</label>
                      <p className="text-sm text-gray-500">Recibe notificaciones del sistema</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.notifications}
                        onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-700 flex items-center">
                        <FiMail className="w-4 h-4 mr-2" />
                        Notificaciones por email
                      </label>
                      <p className="text-sm text-gray-500">Recibe alertas en tu correo</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-700">Notificaciones push</label>
                      <p className="text-sm text-gray-500">Alertas instantáneas en el navegador</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.pushNotifications}
                        onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Configuraciones de seguridad */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-green-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg mr-3">
                    <FiShield className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Seguridad</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-700">Autenticación de dos factores</label>
                      <p className="text-sm text-gray-500">Mayor seguridad para tu cuenta</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.twoFactorAuth}
                        onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-teal-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-700">Tiempo de sesión (minutos)</label>
                      <p className="text-sm text-gray-500">Cierre automático de sesión</p>
                    </div>
                    <input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                      className="border border-gray-300 rounded-lg px-3 py-2 w-20 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="5"
                      max="480"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-700">Perfil privado</label>
                      <p className="text-sm text-gray-500">Ocultar información personal</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.showPrivateProfile}
                        onChange={(e) => handleSettingChange('showPrivateProfile', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-teal-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Configuraciones del sistema */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-purple-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3">
                    <FiRefreshCw className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Sistema</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-700">Guardado automático</label>
                      <p className="text-sm text-gray-500">Guarda cambios automáticamente</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.autoSave}
                        onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500"></div>
                    </label>
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={resetToDefaults}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
                    >
                      Restablecer valores por defecto
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-rose-500 text-white rounded-lg hover:from-yellow-600 hover:to-rose-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
              >
                {isSaving ? (
                  <>
                    <FiRefreshCw className="animate-spin w-4 h-4 mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <FiSave className="w-4 h-4 mr-2" />
                    Guardar cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettingsPage;
