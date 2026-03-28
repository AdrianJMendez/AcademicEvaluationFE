import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Plus, Trash2, GraduationCap } from 'lucide-react';
import type { AcademicHistory, OfficialPlan } from '@/types/academic';

interface StudentHistoryUploadProps {
  plan: OfficialPlan;
  onHistoryUploaded: (history: AcademicHistory[]) => void;
}

export function StudentHistoryUpload({ plan, onHistoryUploaded }: StudentHistoryUploadProps) {
  const [history, setHistory] = useState<AcademicHistory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<AcademicHistory>>({
    subjectId: '',
    periodTaken: 1,
    status: 'approved',
    grade: 70,
  });

  const handleAddRecord = () => {
    if (newRecord.subjectId && newRecord.periodTaken) {
      const record: AcademicHistory = {
        subjectId: newRecord.subjectId!,
        periodTaken: newRecord.periodTaken!,
        status: newRecord.status as 'approved' | 'failed' | 'in-progress',
        grade: newRecord.grade,
      };
      setHistory([...history, record]);
      setNewRecord({ subjectId: '', periodTaken: 1, status: 'approved', grade: 70 });
      setShowForm(false);
    }
  };

  const handleRemoveRecord = (index: number) => {
    setHistory(history.filter((_, i) => i !== index));
  };

  const handleLoadExample = () => {
    const exampleHistory: AcademicHistory[] = [
      { subjectId: '1', periodTaken: 1, status: 'approved', grade: 85 },
      { subjectId: '2', periodTaken: 1, status: 'approved', grade: 90 },
      { subjectId: '3', periodTaken: 2, status: 'failed', grade: 55 },
      { subjectId: '4', periodTaken: 2, status: 'approved', grade: 80 },
      { subjectId: '3', periodTaken: 3, status: 'approved', grade: 75 },
      { subjectId: '5', periodTaken: 4, status: 'approved', grade: 88 },
      { subjectId: '6', periodTaken: 5, status: 'approved', grade: 92 },
    ];
    setHistory(exampleHistory);
  };

  const handleSubmit = () => {
    if (history.length > 0) {
      onHistoryUploaded(history);
    }
  };

  const getSubjectName = (subjectId: string) => {
    const subject = plan.subjects.find(s => s.id === subjectId);
    return subject ? `${subject.code} - ${subject.name}` : 'Desconocida';
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    const labels = {
      approved: 'Aprobada',
      failed: 'Reprobada',
      'in-progress': 'En Curso',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="size-5" />
            Historial Académico del Estudiante
          </CardTitle>
          <CardDescription>
            Registra las asignaturas cursadas por el estudiante, incluyendo el período en que las tomó
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleLoadExample} variant="outline" className="w-full">
            <Plus className="size-4 mr-2" />
            Cargar Historial de Ejemplo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registros Académicos ({history.length})</CardTitle>
          <CardDescription>
            Materias cursadas por el estudiante
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {history.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map((record, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm">{getSubjectName(record.subjectId)}</span>
                      <span className="text-xs text-muted-foreground">
                        Período {record.periodTaken}
                      </span>
                      {getStatusBadge(record.status)}
                      {record.grade && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                          Nota: {record.grade}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRecord(index)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!showForm ? (
            <Button onClick={() => setShowForm(true)} variant="outline" className="w-full">
              <Plus className="size-4 mr-2" />
              Agregar Registro
            </Button>
          ) : (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Asignatura</Label>
                  <Select
                    value={newRecord.subjectId}
                    onValueChange={(value) => setNewRecord({ ...newRecord, subjectId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar asignatura" />
                    </SelectTrigger>
                    <SelectContent>
                      {plan.subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.code} - {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Período Cursado</Label>
                  <Input
                    type="number"
                    min="1"
                    max={plan.totalPeriods}
                    value={newRecord.periodTaken}
                    onChange={(e) => setNewRecord({ ...newRecord, periodTaken: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={newRecord.status}
                    onValueChange={(value) => setNewRecord({ ...newRecord, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Aprobada</SelectItem>
                      <SelectItem value="failed">Reprobada</SelectItem>
                      <SelectItem value="in-progress">En Curso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nota</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newRecord.grade}
                    onChange={(e) => setNewRecord({ ...newRecord, grade: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddRecord} className="flex-1">
                  Agregar
                </Button>
                <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={handleSubmit}
        disabled={history.length === 0}
        className="w-full"
        size="lg"
      >
        Analizar Discrepancias
      </Button>
    </div>
  );
}
