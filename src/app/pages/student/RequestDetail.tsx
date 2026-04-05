//student/RequestDetail.tsx

import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { ArrowLeft, FileText, Download, Clock, CheckCircle2, Eye, AlertCircle, FileWarning, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import studentService from '../../../services/student.service';
import { Request, Discrepancy, Justification } from '../../../types/request';

export function RequestDetail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams();

  const [request, setRequest] = useState<Request>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRequestDetail = async () => {
      setIsLoading(true);
      try {
        const response = await studentService.getRequestDetailForStudent(id);
        if (!response.hasError) {
          setRequest(response.data);
        }
      } catch (error) {
        console.error('Error fetching request details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchRequestDetail();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando solicitud...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Solicitud no encontrada</CardTitle>
            <CardDescription>La solicitud que buscas no existe</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/student')} className="w-full">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Función para obtener el badge de severidad
  const getSeverityBadge = (severity: string) => {
    const severityStyles = {
      Alta: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      Media: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      Baja: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };

    const severityIcons = {
      Alta: <AlertCircle className="size-3" />,
      Media: <FileWarning className="size-3" />,
      Baja: <CheckCircle2 className="size-3" />,
    };

    return (
      <Badge className={`${severityStyles[severity] || severityStyles.Media} flex items-center gap-1`} variant="outline">
        {severityIcons[severity] || severityIcons.Media}
        {severity}
      </Badge>
    );
  };

  const getStatusBadge = () => {
    const status = request.Status;
    if (!status) return null;

    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'in-review': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      reviewed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };

    const statusLabels = {
      pending: 'Pendiente',
      'in-review': 'En Revisión',
      reviewed: 'Revisado',
    };

    const statusIcons = {
      pending: <Clock className="size-3" />,
      'in-review': <Eye className="size-3" />,
      reviewed: <CheckCircle2 className="size-3" />,
    };

    let statusKey: 'pending' | 'in-review' | 'reviewed' = 'pending';
    if (status.statusName === 'pending') statusKey = 'pending';
    else if (status.statusName === 'in-review') statusKey = 'in-review';
    else if (status.statusName === 'reviewed') statusKey = 'reviewed';

    return (
      <Badge className={`${statusStyles[statusKey]} flex items-center gap-1`} variant="outline">
        {statusIcons[statusKey]}
        {statusLabels[statusKey]}
      </Badge>
    );
  };

  // Función para obtener el tipo de discrepancia en español
  const getDiscrepancyTypeLabel = (type: string) => {
    const types = {
      'Retraso': 'Retraso',
      'Baja carga académica': 'Baja Carga Académica',
      'Periodo sin matricula': 'Periodo sin Matrícula',
      'Observacion': 'Observación'
    };
    return types[type] || type;
  };

  // Función para obtener el ícono según el tipo de discrepancia
  const getDiscrepancyIcon = (type: string) => {
    const icons = {
      'Retraso': <Clock className="size-4" />,
      'Baja carga académica': <FileWarning className="size-4" />,
      'Periodo sin matricula': <AlertCircle className="size-4" />,
      'Observacion': <MessageCircle className="size-4" />
    };
    return icons[type] || <FileText className="size-4" />;
  };

  // Función para verificar si es una observación (sin discrepancias reales)
  const isObservationOnly = () => {
    return request.Discrepancies?.length === 1 && 
           request.Discrepancies[0]?.type === 'Observacion';
  };

  // Función para obtener el color del badge según el tipo
  const getTypeBadgeColor = (type: string) => {
    const colors = {
      'Retraso': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Baja carga académica': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Periodo sin matricula': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Observacion': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[type] || 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button onClick={() => navigate('/student')} variant="ghost">
            <ArrowLeft className="size-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>
                  {request.StudentCareer?.Career?.careerName || 'Solicitud de Revisión'}
                </CardTitle>
                <CardDescription>
                  Solicitud #{request.idRequest} • Enviada el {new Date(request.submittedAt).toLocaleDateString('es-ES')}
                </CardDescription>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Información General</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Estudiante:</span>
                  <p className="font-medium">
                    {user.name || 'No especificado'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Código:</span>
                  <p className="font-medium">
                    {user.accountNumber || 'No especificado'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Carrera:</span>
                  <p className="font-medium">
                    {request.StudentCareer?.Career?.careerName || 'No especificada'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado:</span>
                  <p className="font-medium">
                    {request.Status?.statusName === 'pending' && 'Pendiente'}
                    {request.Status?.statusName === 'in-review' && 'En Revisión'}
                    {request.Status?.statusName === 'reviewed' && 'Revisado'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">
                {isObservationOnly() ? 'Observación General' : 'Discrepancias Detectadas'}
              </h3>
              
              {isObservationOnly() && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="size-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">Solicitud sin discrepancias</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Esta solicitud fue enviada como observación general, no se detectaron discrepancias en tu plan de estudios.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {request.Discrepancies?.map((discrepancy) => (
                  <div key={discrepancy.idDiscrepancy} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={`${getTypeBadgeColor(discrepancy.DiscrepancyType.typeName)} flex items-center gap-1`} variant="outline">
                            {getDiscrepancyIcon(discrepancy.DiscrepancyType.typeName)}
                            {getDiscrepancyTypeLabel(discrepancy.DiscrepancyType.typeName)}
                          </Badge>
                          {discrepancy.DiscrepancyType.typeName !== 'Observacion' && getSeverityBadge(discrepancy.severity)}
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{discrepancy.description}</p>
                        
                        {/* Mostrar información adicional según el tipo */}
                        {discrepancy.DiscrepancyType.typeName === 'Retraso' && (discrepancy.expectedPeriod || discrepancy.actualPeriod) && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {discrepancy.expectedPeriod && <span>Periodo esperado: {discrepancy.expectedPeriod}</span>}
                            {discrepancy.expectedPeriod && discrepancy.actualPeriod && <span> • </span>}
                            {discrepancy.actualPeriod && <span>Periodo actual: {discrepancy.actualPeriod}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Mostrar justificaciones asociadas a esta discrepancia */}
                    {discrepancy.Justifications && discrepancy.Justifications.length > 0 && (
                      <div className="mt-3 space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">
                          Justificaciones ({discrepancy.Justifications.length}):
                        </p>
                        {discrepancy.Justifications.map((justification) => (
                          <div key={justification.idJustification} className="bg-muted/50 rounded-lg p-3">
                            <div className="mb-2">
                              <p className="text-sm font-medium">{justification.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                ID: {justification.idJustification}
                              </p>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{justification.description}</p>
                            
                            {justification.impactLevel && (
                              <div className="mt-2">
                                <Badge variant="outline" className="text-xs">
                                  Impacto: {justification.impactLevel === 'no-impact' && 'Sin impacto'}
                                  {justification.impactLevel === 'low-impact' && 'Bajo impacto'}
                                  {justification.impactLevel === 'high-impact' && 'Alto impacto'}
                                </Badge>
                              </div>
                            )}
                            
                            {justification.employeeComments && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-xs font-medium text-muted-foreground">Comentarios del revisor:</p>
                                <p className="text-sm mt-1 whitespace-pre-wrap">{justification.employeeComments}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {(!request.Discrepancies || request.Discrepancies.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron discrepancias en esta solicitud
                  </div>
                )}
              </div>
            </div>

            {request.Status?.statusName === 'reviewed' && (
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Resultado de la Evaluación</h3>
                    <p className="text-sm text-muted-foreground">
                      Revisado el {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString('es-ES') : 'Fecha no disponible'}
                    </p>
                  </div>
                  {request.finalScore !== undefined && request.finalScore !== null && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Puntuación Final</p>
                      <p className="text-3xl font-bold text-primary">{request.finalScore}/100</p>
                    </div>
                  )}
                </div>

                {request.notes && (
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Notas adicionales:</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{request.notes}</p>
                  </div>
                )}

                {request.generatedReportUrl && (
                  <Button className="w-full" variant="outline" onClick={() => window.open(request.generatedReportUrl, '_blank')}>
                    <Download className="size-4 mr-2" />
                    Descargar Informe PDF
                  </Button>
                )}
              </div>
            )}

            {request.Status?.statusName !== 'reviewed' && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="size-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Solicitud en Proceso</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Tu solicitud está siendo revisada por el personal administrativo. Recibirás una notificación cuando esté lista.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}