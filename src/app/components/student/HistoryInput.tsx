import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { ArrowRight, Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { OfficialPlan, AcademicHistory, Discrepancy } from '@/types/academic';

interface HistoryInputProps {
  plan: OfficialPlan;
  onContinue: (history: AcademicHistory[], discrepancies: Discrepancy[]) => void;
}

export function HistoryInput({ plan, onContinue }: HistoryInputProps) {
  const [history, setHistory] = useState<AcademicHistory[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [periodTaken, setPeriodTaken] = useState('');

  const addSubjectToHistory = () => {
    if (!selectedSubject || !periodTaken) {
      toast.error('Debes seleccionar una asignatura y un período');
      return;
    }

    const alreadyAdded = history.some(h => h.subjectId === selectedSubject);
    if (alreadyAdded) {
      toast.error('Esta asignatura ya fue agregada');
      return;
    }

    setHistory([
      ...history,
      {
        subjectId: selectedSubject,
        periodTaken: Number(periodTaken),
        status: 'approved',
      },
    ]);
    setSelectedSubject('');
    setPeriodTaken('');
  };

  const removeFromHistory = (subjectId: string) => {
    setHistory(history.filter(h => h.subjectId !== subjectId));
  };

  const detectDiscrepancies = (): Discrepancy[] => {
    const discrepancies: Discrepancy[] = [];

    history.forEach(hist => {
      const subject = plan.subjects.find(s => s.id === hist.subjectId);
      if (!subject) return;

      // Detectar retraso
      if (hist.periodTaken > subject.idealPeriod) {
        discrepancies.push({
          id: `disc-${hist.subjectId}-delay`,
          type: 'delay',
          subjectId: subject.id,
          subjectName: subject.name,
          expectedPeriod: subject.idealPeriod,
          actualPeriod: hist.periodTaken,
          description: `La asignatura fue cursada en el período ${hist.periodTaken}, pero debía cursarse en el período ${subject.idealPeriod}`,
        });
      }

      // Detectar salto de prerrequisitos
      if (subject.prerequisites.length > 0) {
        subject.prerequisites.forEach(prereqId => {
          const prereqHist = history.find(h => h.subjectId === prereqId);
          if (!prereqHist || prereqHist.periodTaken >= hist.periodTaken) {
            const prereqSubject = plan.subjects.find(s => s.id === prereqId);
            if (prereqSubject) {
              discrepancies.push({
                id: `disc-${hist.subjectId}-prereq-${prereqId}`,
                type: 'prerequisite-skip',
                subjectId: subject.id,
                subjectName: subject.name,
                expectedPeriod: subject.idealPeriod,
                actualPeriod: hist.periodTaken,
                description: `No se cumplió el prerrequisito "${prereqSubject.name}" antes de cursar esta asignatura`,
              });
            }
          }
        });
      }
    });

    return discrepancies;
  };

  const handleContinue = () => {
    if (history.length === 0) {
      toast.error('Debes agregar al menos una asignatura');
      return;
    }

    const discrepancies = detectDiscrepancies();
    onContinue(history, discrepancies);
  };

  const getSubjectName = (subjectId: string) => {
    return plan.subjects.find(s => s.id === subjectId)?.name || '';
  };

  const availableSubjects = plan.subjects.filter(
    s => !history.some(h => h.subjectId === s.id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresa tu Historial Académico</CardTitle>
        <CardDescription>
          Agrega las asignaturas que has cursado y en qué período las tomaste
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="subject">Asignatura</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Selecciona una asignatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.code} - {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="period">Período Cursado</Label>
                <Input
                  id="period"
                  type="number"
                  min="1"
                  max={plan.totalPeriods}
                  placeholder="1"
                  value={periodTaken}
                  onChange={(e) => setPeriodTaken(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={addSubjectToHistory} className="w-full mt-4">
              <Plus className="size-4 mr-2" />
              Agregar Asignatura
            </Button>
          </div>

          {history.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Asignaturas Agregadas ({history.length})</h3>
              <div className="space-y-2">
                {history.map((hist) => (
                  <div
                    key={hist.subjectId}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{getSubjectName(hist.subjectId)}</p>
                      <p className="text-xs text-muted-foreground">
                        Cursada en período {hist.periodTaken}
                      </p>
                    </div>
                    <Button
                      onClick={() => removeFromHistory(hist.subjectId)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {history.length > 0 && detectDiscrepancies().length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">
                    {detectDiscrepancies().length} Discrepancia(s) Detectada(s)
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Se han identificado diferencias entre tu historial y el plan oficial. Podrás justificarlas en el siguiente paso.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleContinue} className="w-full" disabled={history.length === 0}>
            Continuar con Justificaciones
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
