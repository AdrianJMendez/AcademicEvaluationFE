import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { ArrowLeft, FileText, Download, Clock, CheckCircle2, Eye } from 'lucide-react';

export function RequestDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { getRequestById } = useData();

  const request = id ? getRequestById(id) : undefined;

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

  const getStatusBadge = (status: string) => {
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
                <CardTitle>{request.careerName}</CardTitle>
                <CardDescription>
                  Solicitud #{request.id} • Enviada el {new Date(request.submittedAt).toLocaleDateString('es-ES')}
                </CardDescription>
              </div>
              {getStatusBadge(request.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Información General</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Estudiante:</span>
                  <p className="font-medium">{request.studentName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Código:</span>
                  <p className="font-medium">{request.studentCode}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Carrera:</span>
                  <p className="font-medium">{request.careerName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Discrepancias:</span>
                  <p className="font-medium">{request.discrepancies.length}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Discrepancias Detectadas</h3>
              <div className="space-y-2">
                {request.discrepancies.map((disc, index) => (
                  <div key={disc.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-sm">{disc.subjectName}</span>
                      <Badge variant="outline">{disc.type === 'delay' ? 'Retraso' : disc.type === 'prerequisite-skip' ? 'Prerrequisito' : 'Cambio de Orden'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{disc.description}</p>
                    
                    {request.justifications[index] && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium mb-1">Justificación:</p>
                        <p className="text-sm">{request.justifications[index].title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{request.justifications[index].description}</p>
                        {request.justifications[index].documents?.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            📎 {request.justifications[index].documents.length} archivo(s) adjunto(s)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {request.status === 'reviewed' && (
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Resultado de la Evaluación</h3>
                    <p className="text-sm text-muted-foreground">
                      Revisado el {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString('es-ES') : 'N/A'}
                    </p>
                  </div>
                  {request.finalScore !== undefined && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Nota Final</p>
                      <p className="text-3xl font-bold text-primary">{request.finalScore}/100</p>
                    </div>
                  )}
                </div>

                <Button className="w-full" variant="outline">
                  <Download className="size-4 mr-2" />
                  Descargar Informe PDF
                </Button>
              </div>
            )}

            {request.status !== 'reviewed' && (
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