import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface CurrentAdmin {
  fullName: string;
  role: string;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<CurrentAdmin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const currentAdmin = apiService.getCurrentAdmin();
    if (currentAdmin) {
      setAdmin({
        fullName: currentAdmin.fullName,
        role: currentAdmin.role
      });
    } else {
      localStorage.removeItem('authToken');
      navigate('/admin/login');
    }

    setLoading(false);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await apiService.logout();
      toast.success('Logged out successfully');
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/admin/login');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo width={40} height={40} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Future Kids Journey</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {admin && (
              <div className="text-right mr-4">
                <p className="font-medium text-gray-900">{admin.fullName}</p>
                <p className="text-sm text-gray-500">{admin.role}</p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">{children}</main>
    </div>
  );
};
