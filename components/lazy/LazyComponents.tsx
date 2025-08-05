// 🚀 Lazy loading para componentes del dashboard
import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Lazy loading de componentes pesados que existen
export const LazyCourseCard = dynamic(
  () => import('@/components/dashboard/CourseCard'),
  {
    loading: () => (
      <div className="animate-pulse">
        <div className="bg-gray-200 rounded-lg h-48 w-full"></div>
      </div>
    )
  }
);

export const LazyDashboardLayout = dynamic(
  () => import('@/components/dashboard/DashboardLayout'),
  {
    loading: () => <LoadingSpinner text="Cargando panel..." />,
    ssr: false
  }
);

// Skeleton para estadísticas
export const StatsCardSkeleton = () => (
  <div className="animate-pulse bg-white rounded-lg shadow-md p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
    </div>
  </div>
);

// Loading para grillas de cursos
export const CourseGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="bg-gray-200 rounded-lg h-64 w-full"></div>
      </div>
    ))}
  </div>
);
