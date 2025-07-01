import AuthForm from '@/components/common/AuthForm';
import ResponsiveNav from '@/components/Home/Navbar/ResponsiveNav';
import Footer from '@/components/Home/Footer/Footer';

const HomePage = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-100 min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center">
        <AuthForm />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
