import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { AlertTriangle, FileText, Image as ImageIcon, Paperclip } from 'lucide-react';
import type { Discrepancy, Justification, OfficialPlan, AcademicHistory } from '@/types/academic';

interface DiscrepanciesAnalysisProps {
  plan: OfficialPlan;
  history: AcademicHistory[];
  onJustificationsComplete: (justifications: Justification[]) => void;
}

export function DiscrepanciesAnalysis({
  plan,
  history,
  onJustificationsComplete,
}: DiscrepanciesAnalysisProps) {
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [justifications, setJustifications] = useState<Justification[]>([]);
  const [currentDiscrepancy, setCurrentDiscrepancy] = useState<number>(0);

  useEffect(() => {
    detectDiscrepancies();
  }, [plan, history]);

  const detectDiscrepancies = () => {
    const detected: Discrepancy[] = [];

    plan.subjects.forEach((subject) => {
      const studentRecords = history.filter(
        (h) => h.subjectId === subject.id && h.status === 'approved'
      );

      if (studentRecords.length === 0) return;

      const actualRecord = studentRecords[studentRecords.length - 1];
      const delay = actualRecord.periodTaken - subject.idealPeriod;

      if (delay > 0) {
        detected.push({
          id: `disc-${subject.id}`,
          type: 'delay',
          subjectId: subject.id,
          subjectName: `${subject.code} - ${subject.name}`,
          expectedPeriod: subject.idealPeriod,
          actualPeriod: actualRecord.periodTaken,
          description: `Materia cursada con ${delay} período(s) de retraso`,
        });
      }

      // Detectar saltos de prerrequisitos
      subject.prerequisites.forEach((preqId) => {
        const prereqRecords = history.filter(
          (h) => h.subjectId === preqId && h.status === 'approved'
        );
        if (prereqRecords.length > 0) {
          const prereqPeriod = prereqRecords[0].periodTaken;
          if (actualRecord.periodTaken <= prereqPeriod) {
            detected.push({
              id: `disc-prereq-${subject.id}-${preqId}`,
              type: 'prerequisite-skip',
              subjectId: subject.id,
              subjectName: `${subject.code} - ${subject.name}`,
              expectedPeriod: subject.idealPeriod,
              actualPeriod: actualRecord.periodTaken,
              description: `Cursada antes de aprobar prerrequisito`,
            });
          }
        }
      });
    });

    setDiscrepancies(detected);
    setJustifications(
      detected.map((d) => ({
        discrepancyId: d.id,
        title: '',
        description: '',
        impactLevel: 'low-impact' as const,
        attachments: [],
        images: [],
      }))
    );
  };

  const updateJustification = (field: keyof Justification, value: any) => {
    const updated = [...justifications];
    updated[currentDiscrepancy] = {
      ...updated[currentDiscrepancy],
      [field]: value,
    };
    setJustifications(updated);
  };

  const handleNext = () => {
    if (currentDiscrepancy < discrepancies.length - 1) {
      setCurrentDiscrepancy(currentDiscrepancy + 1);
    }
  };

  const handlePrevious = () => {
    if (currentDiscrepancy > 0) {
      setCurrentDiscrepancy(currentDiscrepancy - 1);
    }
  };

  const handleComplete = () => {
    onJustificationsComplete(justifications);
  };

  const handleFileChange = (type: 'images' | 'attachments', files: FileList | null) => {
    if (files) {
      const currentJustification = justifications[currentDiscrepancy];
      const updated = [...justifications];
      updated[currentDiscrepancy] = {
        ...currentJustification,
        [type]: Array.from(files),
      };
      setJustifications(updated);
    }
  };

  if (discrepancies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600 dark:text-green-400">
            ¡Sin Discrepancias!
          </CardTitle>
          <CardDescription>
            El historial del estudiante coincide perfectamente con el plan oficial.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => onJustificationsComplete([])} className="w-full" size="lg">
            Ver Resultados Finales
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentDisc = discrepancies[currentDiscrepancy];
  const currentJust = justifications[currentDiscrepancy];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            Discrepancias Detectadas
          </CardTitle>
          <CardDescription>
            Se encontraron {discrepancies.length} discrepancia(s) entre el plan oficial y el historial del estudiante
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <span className="text-sm">
                Discrepancia {currentDiscrepancy + 1} de {discrepancies.length}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePrevious}
                disabled={currentDiscrepancy === 0}
                variant="outline"
                size="sm"
              >
                Anterior
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentDiscrepancy === discrepancies.length - 1}
                variant="outline"
                size="sm"
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-amber-200 dark:border-amber-800">
        <CardHeader className="bg-amber-50 dark:bg-amber-950">
          <CardTitle>{currentDisc.subjectName}</CardTitle>
          <CardDescription>{currentDisc.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo de Discrepancia:</span>
              <span className="font-semibold">
                {currentDisc.type === 'delay' ? 'Retraso' : 'Salto de Prerrequisito'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Período Esperado:</span>
              <span>{currentDisc.expectedPeriod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Período Real:</span>
              <span>{currentDisc.actualPeriod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Diferencia:</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                {Math.abs(currentDisc.actualPeriod - currentDisc.expectedPeriod)} período(s)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Justificación Requerida
          </CardTitle>
          <CardDescription>
            Proporciona una justificación detallada para esta discrepancia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título de la Justificación</Label>
            <Input
              id="title"
              placeholder="Ej: No apertura de sección"
              value={currentJust.title}
              onChange={(e) => updateJustification('title', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción Detallada</Label>
            <Textarea
              id="description"
              placeholder="Explica las razones de la discrepancia..."
              rows={5}
              value={currentJust.description}
              onChange={(e) => updateJustification('description', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Nivel de Afectación al Estudiante</Label>
            <RadioGroup
              value={currentJust.impactLevel}
              onValueChange={(value) => updateJustification('impactLevel', value)}
            >
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted cursor-pointer">
                <RadioGroupItem value="no-impact" id="no-impact" />
                <Label htmlFor="no-impact" className="cursor-pointer flex-1">
                  <div className="font-semibold">No Afectó</div>
                  <div className="text-xs text-muted-foreground">
                    El estudiante no se vio perjudicado por esta situación
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted cursor-pointer">
                <RadioGroupItem value="low-impact" id="low-impact" />
                <Label htmlFor="low-impact" className="cursor-pointer flex-1">
                  <div className="font-semibold">Afectó Poco</div>
                  <div className="text-xs text-muted-foreground">
                    El impacto fue mínimo y manejable
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted cursor-pointer">
                <RadioGroupItem value="high-impact" id="high-impact" />
                <Label htmlFor="high-impact" className="cursor-pointer flex-1">
                  <div className="font-semibold">Afectó Mucho</div>
                  <div className="text-xs text-muted-foreground">
                    El estudiante se vio significativamente perjudicado
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="images" className="flex items-center gap-2">
                <ImageIcon className="size-4" />
                Imágenes de Soporte
              </Label>
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileChange('images', e.target.files)}
              />
              {currentJust.images.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {currentJust.images.length} imagen(es) seleccionada(s)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachments" className="flex items-center gap-2">
                <Paperclip className="size-4" />
                Documentos Anexos
              </Label>
              <Input
                id="attachments"
                type="file"
                multiple
                onChange={(e) => handleFileChange('attachments', e.target.files)}
              />
              {currentJust.attachments.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {currentJust.attachments.length} documento(s) seleccionado(s)
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        {currentDiscrepancy === discrepancies.length - 1 && (
          <Button
            onClick={handleComplete}
            className="flex-1"
            size="lg"
            disabled={!currentJust.title || !currentJust.description}
          >
            Calcular Nota Final
          </Button>
        )}
      </div>
    </div>
  );
}
