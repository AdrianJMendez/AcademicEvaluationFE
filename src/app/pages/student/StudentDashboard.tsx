//student/StudentDashboard.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { GraduationCap, Plus, FileText, LogOut, Filter, Clock, CheckCircle2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Career } from '../../../types/academic';
import { Request } from '../../../types/request';
import studentService from '../../../services/student.service';

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeStatus, setActiveStatus] = useState(0);  //TODOS
  const [requests, setRequests] = useState<Request[]>();
  const [requestCount, setRequestCount] = useState<{pending:number, inReview:number, reviewed:number}>();
  const [careers, setCareers] = useState<Career[]>();
  const [activeCareer, setActiveCareer] = useState(0);

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(3);
  const [sort, setSort] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    studentService.getCareersForStudent().then((response) => {
      if (!response.hasError) {
        setCareers(response.data);
        setActiveCareer(response.data[0].idCareer);
      }
    });

    studentService.getRequestCountForStudent().then((response) => {
      if (!response.hasError) {
        setRequestCount(response.data);
      }
    });
  }, []);

  useEffect(() => {
    studentService.getRequestByStatusAndCareerForStudent(activeStatus, activeCareer, page, size, sort).then((response) => {
      if (!response.hasError) {
        console.log(response);
        setRequests(response.data.data ?? []);
        setTotalItems(response.data.totalItems || 0);
        setTotalPages(Math.ceil((response.data.totalItems || 0) / size));
      } else {
        setRequests([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    });
  }, [activeCareer, activeStatus, page, size, sort]);

  const getStatusBadge = (status: number) => {
    let statusName: "pending" | "in-review" | "reviewed" = status == 4 ? "pending" :
      status == 5 ? "in-review" : "reviewed";

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
      <Badge className={`${styles[statusName]} flex items-center gap-1`} variant="outline">
        {icons[statusName]}
        {labels[statusName]}
      </Badge>
    );
  };

  // Funciones de paginación
  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const goToPreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const goToNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handleSizeChange = (newSize: string) => {
    setSize(parseInt(newSize));
    setPage(1); // Resetear a primera página cuando cambia el tamaño
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="size-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Portal del Estudiante</h1>
                <p className="text-sm text-muted-foreground">{user.name} - {user.accountNumber}</p>
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
        {requestCount && (
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total de Solicitudes</CardDescription>
                <CardTitle className="text-3xl">{requestCount.inReview + requestCount.pending + requestCount.reviewed}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Pendientes</CardDescription>
                <CardTitle className="text-3xl text-yellow-600">
                  {requestCount.inReview + requestCount.pending}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Revisadas</CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {requestCount.reviewed}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mis Solicitudes</CardTitle>
                <CardDescription>Historial de solicitudes de evaluación académica</CardDescription>
              </div>
              <Button onClick={() => navigate('/student/new-request')}>
                <Plus className="size-4 mr-2" />
                Nueva Solicitud
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Filter className="size-4 text-muted-foreground" />
              <Select value={activeStatus.toString()} onValueChange={(v) => setActiveStatus(parseInt(v))}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Todas</SelectItem>
                  <SelectItem value="4">Pendientes</SelectItem>
                  <SelectItem value="5">En Revisión</SelectItem>
                  <SelectItem value="6">Revisadas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={activeCareer.toString()} onValueChange={(v) => setActiveCareer(parseInt(v))}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {careers && (
                    careers.map((career) => (
                      <SelectItem key={career.idCareer} value={career.idCareer.toString()}>{career.careerName}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <div className="ml-auto">
                <Select value={sort.toString()} onValueChange={(v)=>{setSort(v)}}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Descendente</SelectItem>
                    <SelectItem value="1">Ascendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!requests || requests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="size-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {activeStatus == 0
                    ? 'No tienes solicitudes aún'
                    : 'No hay solicitudes con este estado'}
                </p>
                {activeStatus == 0 && (
                  <Button
                    onClick={() => navigate('/student/new-request')}
                    variant="outline"
                    className="mt-4"
                  >
                    Crear Primera Solicitud
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {requests.map((request) => (
                    <div
                      key={request.idRequest}
                      className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/student/request/${request.idRequest}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{request.StudentCareer?.Career?.careerName}</h3>
                            {getStatusBadge(request.idStatus)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Enviada el {new Date(request.submittedAt).toLocaleDateString('es-ES')}
                          </p>
                          {request.Discrepancies && request.Discrepancies.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {request.Discrepancies.length} discrepancia(s) detectada(s)
                            </p>
                          )}
                          {request.idStatus == 6 && request.finalScore !== undefined && request.finalScore !== null && (
                            <div className="mt-2">
                              <span className="text-sm font-semibold text-primary">
                                Nota Final: {request.finalScore} / 100
                              </span>
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          Ver Detalle
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginación */}
                {totalPages > 0 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {((page - 1) * size) + 1} - {Math.min(page * size, totalItems)} de {totalItems} solicitudes
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="size-4" />
                        Anterior
                      </Button>
                      
                      <div className="flex gap-1">
                        {getPageNumbers().map((pageNum) => (
                          <Button
                            key={pageNum}
                            variant={pageNum === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className="min-w-[2.5rem]"
                          >
                            {pageNum}
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={page === totalPages}
                      >
                        Siguiente
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}