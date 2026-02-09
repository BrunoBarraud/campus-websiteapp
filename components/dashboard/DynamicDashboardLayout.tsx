'use client';
import dynamic from 'next/dynamic';
import React from 'react';

const DashboardLayout = dynamic(() => import('./DashboardLayout'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4">
      <div className="bg-surface border border-border shadow-elevated rounded-xl p-4 sm:p-6 flex items-center gap-3">
        <svg
          className="animate-spin h-5 w-5 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
        <span className="text-gray-700 font-medium">Cargando el Campus…</span>
      </div>
    </div>
  ),
});

export default function DynamicDashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
