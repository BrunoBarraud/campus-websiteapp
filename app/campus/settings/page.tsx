"use client";

// Forzar rendering dinámico para evitar errores de SSR
export const dynamic = 'force-dynamic';

import React from "react";
import Link from 'next/link';
import { FiUsers, FiBook, FiSettings, FiUserCheck, FiUser, FiArrowRight } from 'react-icons/fi';

export default function SettingsPage() {
  const settingsOptions = [
    {
      title: 'Gestión de Usuarios',
      description: 'Administra profesores, alumnos y administradores del campus',
      href: '/campus/settings/users',
      icon: FiUsers,
      color: 'from-amber-400 to-rose-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    {
      title: 'Gestión de Materias', 
      description: 'Administra las materias del campus, asigna profesores y configura años académicos',
      href: '/campus/settings/subjects',
      icon: FiBook,
      color: 'from-rose-500 to-amber-400',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200'
    },
    {
      title: 'Configuración General',
      description: 'Ajustes generales del sistema, notificaciones y preferencias',
      href: '/campus/settings/general',
      icon: FiSettings,
      color: 'from-rose-950 to-amber-400',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-amber-50 via-white to-rose-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              <span className="bg-amber-400 text-rose-950 px-3 py-1 rounded-lg mr-2">Panel</span>
              <span className="bg-rose-950 text-amber-400 px-3 py-1 rounded-lg">Administración</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Gestiona todos los aspectos del campus virtual desde un solo lugar
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-amber-400 to-rose-500 rounded-lg">
                  <FiUserCheck className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-800">Usuarios Activos</h3>
                  <p className="text-2xl font-bold text-gray-900">247</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-rose-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-rose-500 to-amber-400 rounded-lg">
                  <FiBook className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-800">Materias Totales</h3>
                  <p className="text-2xl font-bold text-gray-900">32</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-rose-950 to-amber-400 rounded-lg">
                  <FiUser className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-800">Años Académicos</h3>
                  <p className="text-2xl font-bold text-gray-900">6</p>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {settingsOptions.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <Link
                  key={index}
                  href={option.href}
                  className="group block"
                >
                  <div className={`${option.bgColor} ${option.borderColor} border-2 rounded-xl p-8 h-full transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:border-opacity-50 relative overflow-hidden`}>
                    {/* Background Animation */}
                    <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300" style={{
                      background: `linear-gradient(45deg, ${option.color.includes('amber') ? '#f59e0b, #ef4444' : option.color.includes('rose') ? '#ef4444, #f59e0b' : '#881337, #f59e0b'})`
                    }}></div>
                    
                    <div className="relative z-10">
                      {/* Icon */}
                      <div className={`inline-flex p-4 bg-gradient-to-r ${option.color} rounded-xl mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>

                      {/* Content */}
                      <h2 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-gray-900 transition-colors duration-300">
                        {option.title}
                      </h2>
                      <p className="text-gray-600 mb-6 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                        {option.description}
                      </p>

                      {/* Call to Action */}
                      <div className="flex items-center text-gray-700 group-hover:text-gray-900 transition-all duration-300">
                        <span className="font-medium mr-2">Gestionar</span>
                        <FiArrowRight className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>

                    {/* Hover Border Effect */}
                    <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-gradient transition-all duration-300"></div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-12 bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-gray-200 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Acciones Rápidas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/campus/settings/users" className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-amber-400 to-rose-500 text-white rounded-lg hover:from-amber-500 hover:to-rose-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105">
                <FiUsers className="w-5 h-5 mr-2" />
                Agregar Usuario
              </Link>
              <Link href="/campus/settings/subjects" className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-rose-500 to-amber-400 text-white rounded-lg hover:from-rose-600 hover:to-amber-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105">
                <FiBook className="w-5 h-5 mr-2" />
                Nueva Materia
              </Link>
              <Link href="/campus/settings/general" className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-rose-950 to-amber-400 text-white rounded-lg hover:from-rose-900 hover:to-amber-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105">
                <FiSettings className="w-5 h-5 mr-2" />
                Configurar Sistema
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
