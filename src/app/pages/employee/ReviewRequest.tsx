import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { ArrowLeft, Download, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Justification } from '@/types/academic';

export function ReviewRequest() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { getRequestById, updateRequest } = useData();
  const request = id ? getRequestById(id) : undefined;

  const [justifications, setJustifications] = useState<Justification[]>(
    request?.justifications || []
  );

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Solicitud no encontrada</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/employee')} className="w-full">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const updateJustification = (index: number, updates: Partial<Justification>) => {
    setJustifications(prev =>
      prev.map((j, i) => (i === index ? { ...j, ...updates } : j))
    );
  };

  const calculateScore = () => {
    const totalDiscrepancies = request.discrepancies.length;
    if (totalDiscrepancies === 0) return 100;

    let totalDelay = 0;
    request.discrepancies.forEach(disc => {
      totalDelay += Math.max(0, disc.actualPeriod - disc.expectedPeriod);
    });

    const baseScore = 100;
    const delayPenalty = Math.min(totalDelay * 2, 30);
    
    let impactAdjustment = 0;
    justifications.forEach(just => {
      if (just.impactLevel === 'high-impact') impactAdjustment += 5;
      else if (just.impactLevel === 'low-impact') impactAdjustment -= 3;
      else if (just.impactLevel === 'no-impact') impactAdjustment -= 5;
    });

    const finalScore = Math.max(0, Math.min(100, baseScore - delayPenalty + impactAdjustment));
    return Math.round(finalScore);
  };

  const handleFinishReview = () => {
    const finalScore = calculateScore();
    
    updateRequest(request.id, {
      justifications,
      status: 'reviewed',
      reviewedAt: new Date(),
      reviewedBy: user.id,
      finalScore,
    });

    toast.success('Revisión completada y calificación generada');
    navigate('/employee');
  };

  const allJustificationsReviewed = justifications.every(j => j.impactLevel);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button onClick={() => navigate('/employee')} variant="ghost">
            <ArrowLeft className="size-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{request.studentName}</CardTitle>
                <CardDescription>
                  {request.studentCode} • {request.careerName}
                </CardDescription>
              </div>
              <Badge variant="outline">{request.status === 'reviewed' ? 'Revisado' : 'Pendiente'}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Enviada:</span>
                <p className="font-medium">{new Date(request.submittedAt).toLocaleDateString('es-ES')}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Discrepancias:</span>
                <p className="font-medium">{request.discrepancies.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Justificaciones:</span>
                <p className="font-medium">{request.justifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Evaluación de Justificaciones</CardTitle>
            <CardDescription>
              Revisa cada justificación y asigna un nivel de afectación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {request.discrepancies.map((disc, index) => (
              <div key={disc.id} className="border rounded-lg p-4 space-y-4">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{disc.subjectName}</h3>
                    <Badge variant="outline">
                      {disc.type === 'delay' ? 'Retraso' : disc.type === 'prerequisite-skip' ? 'Prerrequisito' : 'Cambio'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{disc.description}</p>
                </div>

                {justifications[index] && (
                  <div className="pt-3 border-t space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Justificación del Estudiante:</p>
                      <p className="text-sm font-semibold">{justifications[index].title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{justifications[index].description}</p>
                      {justifications[index].documents?.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          📎 {justifications[index].documents.length} documento(s) adjunto(s)
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="mb-3 block">Nivel de Afectación</Label>
                      <RadioGroup
                        value={justifications[index].impactLevel || ''}
                        onValueChange={(value) =>
                          updateJustification(index, { impactLevel: value as any })
                        }
                        disabled={request.status === 'reviewed'}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no-impact" id={`no-impact-${index}`} />
                          <Label htmlFor={`no-impact-${index}`} className="cursor-pointer">
                            Sin Afectación
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="low-impact" id={`low-impact-${index}`} />
                          <Label htmlFor={`low-impact-${index}`} className="cursor-pointer">
                            Afectación Baja
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="high-impact" id={`high-impact-${index}`} />
                          <Label htmlFor={`high-impact-${index}`} className="cursor-pointer">
                            Afectación Alta
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor={`comments-${index}`}>Comentarios del Evaluador</Label>
                      <Textarea
                        id={`comments-${index}`}
                        placeholder="Agrega comentarios sobre esta justificación..."
                        value={justifications[index].employeeComments || ''}
                        onChange={(e) =>
                          updateJustification(index, { employeeComments: e.target.value })
                        }
                        disabled={request.status === 'reviewed'}
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {request.status !== 'reviewed' && (
          <div className="flex gap-3">
            <Button
              onClick={handleFinishReview}
              disabled={!allJustificationsReviewed}
              className="flex-1"
            >
              <CheckCircle className="size-4 mr-2" />
              Finalizar Revisión y Generar Nota
            </Button>
          </div>
        )}

        {request.status === 'reviewed' && (
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold mb-1">Revisión Completada</p>
                  <p className="text-sm text-muted-foreground">
                    Nota Final: <span className="text-2xl font-bold text-primary">{request.finalScore}/100</span>
                  </p>
                </div>
                <Button>
                  <Download className="size-4 mr-2" />
                  Descargar Informe PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}