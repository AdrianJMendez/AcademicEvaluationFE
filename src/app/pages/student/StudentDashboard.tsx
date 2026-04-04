import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { GraduationCap, Plus, FileText, LogOut, Filter, Clock, CheckCircle2, Eye } from 'lucide-react';
import { Career, Request, Status } from '../../../types/academic';
import studentService from '../../../services/student.service';

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeStatus, setActiveStatus] = useState(0);  //TODOS
  const [requests, setRequests] = useState<Request[]>();
  const [requestCount, setRequestCount] = useState<{pending:number,inReview:number,reviewed:number}>();
  const [careers, setCareers] = useState<Career[]>();
  const [activeCareer, setActiveCareer] = useState(0);

  const [page,setPage] = useState(1);
  const [size,setSize] = useState(10);
  const [sort,setSort] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(()=>{
    studentService.getCareersForStudent().then((response) => {
      if(!response.hasError){
        console.log(response.data[0]);
        setCareers(response.data);
        setActiveCareer(response.data[0].idCareer);
      }
    });

    studentService.getRequestCountForStudent().then((response)=>{
      if(!response.hasError){
        setRequestCount(response.data);
      }
    });

  },[]);

  useEffect(()=>{
    studentService.getRequestByStatusAndCareerForStudent(activeStatus, activeCareer, page, size, sort).then((response) => {
      if (!response.hasError) {
        setRequests(response.data.data ?? []); // ✅ extrae el array
      } else {
        setRequests([]); // limpia si hay error
      }
    });
  },[activeCareer,activeStatus,page,size,sort]);

  // const getStatusBadge = (status: RequestStatus) => {
  //   const styles = {
  //     pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  //     'in-review': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  //     reviewed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  //   };
  //   const labels = {
  //     pending: 'Pendiente',
  //     'in-review': 'En Revisión',
  //     reviewed: 'Revisado',
  //   };
  //   const icons = {
  //     pending: <Clock className="size-3" />,
  //     'in-review': <Eye className="size-3" />,
  //     reviewed: <CheckCircle2 className="size-3" />,
  //   };

  //   return (
  //     <Badge className={`${styles[status]} flex items-center gap-1`} variant="outline">
  //       {icons[status]}
  //       {labels[status]}
  //     </Badge>
  //   );
  // };

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
                  <CardTitle className="text-3xl">{requestCount.inReview + requestCount.pending +requestCount.reviewed}</CardTitle>
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
                <Select value={activeStatus} onValueChange={(v:any) => setActiveStatus(v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={0}>Todas</SelectItem>
                    <SelectItem value={1}>Pendientes</SelectItem>
                    <SelectItem value={2}>En Revisión</SelectItem>
                    <SelectItem value={3}>Revisadas</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={activeCareer} onValueChange={(v:any) => setActiveCareer(v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {careers && (
                      careers.map((career)=>(
                        <SelectItem key={career.idCareer} value={career.idCareer}>{career.careerName}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {!requests ? (
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
                            {/* {getStatusBadge(request.status)} */}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Enviada el {new Date(request.submittedAt).toLocaleDateString('es-ES')}
                          </p>
                          {/* {request.discrepancies.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {request.discrepancies.length} discrepancia(s) detectada(s)
                            </p>
                          )} */}
                          {request.idStatus == 3 && request.finalScore !== undefined && (
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
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}