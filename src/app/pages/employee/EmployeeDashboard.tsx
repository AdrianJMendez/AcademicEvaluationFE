import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Briefcase, LogOut, Search, Eye, Clock, CheckCircle2, FileText } from 'lucide-react';
import type { RequestStatus } from '@/types/academic';

export function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { requests } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = requests.filter(req =>
    req.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.careerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusBadge = (status: RequestStatus) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'in-review': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      reviewed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    const labels = {
      pending: 'Pendiente',
      'in-review': 'En Revisión',
      reviewed: 'Revisado',
    };
    const icons = {
      pending: <Clock className="size-3" />,
      'in-review': <Eye className="size-3" />,
      reviewed: <CheckCircle2 className="size-3" />,
    };

    return (
      <Badge className={`${styles[status]} flex items-center gap-1`} variant="outline">
        {icons[status]}
        {labels[status]}
      </Badge>
    );
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const inReviewCount = requests.filter(r => r.status === 'in-review').length;
  const reviewedCount = requests.filter(r => r.status === 'reviewed').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase className="size-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Panel de Administración</h1>
                <p className="text-sm text-muted-foreground">{user.name} - {user.employeeId}</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="size-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pendientes</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{pendingCount}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>En Revisión</CardDescription>
              <CardTitle className="text-3xl text-blue-600">{inReviewCount}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Revisadas</CardDescription>
              <CardTitle className="text-3xl text-green-600">{reviewedCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Solicitudes por Revisar</CardTitle>
            <CardDescription>Todas las solicitudes de evaluación académica</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por estudiante, código o carrera..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="size-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No se encontraron solicitudes' : 'No hay solicitudes aún'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/employee/review/${request.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{request.studentName}</h3>
                          <span className="text-sm text-muted-foreground">({request.studentCode})</span>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{request.careerName}</p>
                        <p className="text-sm text-muted-foreground">
                          Enviada el {new Date(request.submittedAt).toLocaleDateString('es-ES')}
                        </p>
                        {request.discrepancies.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {request.discrepancies.length} discrepancia(s) • {request.justifications.length} justificación(es)
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        {request.status === 'reviewed' ? 'Ver Detalle' : 'Revisar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}