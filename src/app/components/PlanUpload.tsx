import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Upload, FileText, Plus, Trash2 } from 'lucide-react';
import type { OfficialPlan, Subject } from '@/types/academic';

interface PlanUploadProps {
  onPlanUploaded: (plan: OfficialPlan) => void;
}

export function PlanUpload({ onPlanUploaded }: PlanUploadProps) {
  const [careerName, setCareerName] = useState('');
  const [totalPeriods, setTotalPeriods] = useState(10);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Formulario para agregar materia
  const [newSubject, setNewSubject] = useState<Partial<Subject>>({
    code: '',
    name: '',
    idealPeriod: 1,
    prerequisites: [],
    credits: 3,
  });

  const handleAddSubject = () => {
    if (newSubject.code && newSubject.name) {
      const subject: Subject = {
        id: `sub-${Date.now()}`,
        code: newSubject.code!,
        name: newSubject.name!,
        idealPeriod: newSubject.idealPeriod || 1,
        prerequisites: newSubject.prerequisites || [],
        credits: newSubject.credits || 3,
      };
      setSubjects([...subjects, subject]);
      setNewSubject({ code: '', name: '', idealPeriod: 1, prerequisites: [], credits: 3 });
      setShowForm(false);
    }
  };

  const handleRemoveSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const handleLoadExample = () => {
    const examplePlan: OfficialPlan = {
      careerName: 'Ingeniería en Sistemas',
      totalPeriods: 10,
      subjects: [
        { id: '1', code: 'MAT101', name: 'Cálculo I', idealPeriod: 1, prerequisites: [], credits: 4 },
        { id: '2', code: 'PRG101', name: 'Programación I', idealPeriod: 1, prerequisites: [], credits: 4 },
        { id: '3', code: 'MAT102', name: 'Cálculo II', idealPeriod: 2, prerequisites: ['1'], credits: 4 },
        { id: '4', code: 'PRG102', name: 'Programación II', idealPeriod: 2, prerequisites: ['2'], credits: 4 },
        { id: '5', code: 'EST101', name: 'Estructura de Datos', idealPeriod: 3, prerequisites: ['4'], credits: 4 },
        { id: '6', code: 'BDD101', name: 'Bases de Datos', idealPeriod: 3, prerequisites: ['4'], credits: 4 },
        { id: '7', code: 'ALG101', name: 'Algoritmos', idealPeriod: 4, prerequisites: ['5'], credits: 4 },
        { id: '8', code: 'WEB101', name: 'Desarrollo Web', idealPeriod: 4, prerequisites: ['6'], credits: 4 },
      ],
    };
    setCareerName(examplePlan.careerName);
    setTotalPeriods(examplePlan.totalPeriods);
    setSubjects(examplePlan.subjects);
  };

  const handleSubmit = () => {
    if (careerName && subjects.length > 0) {
      onPlanUploaded({
        careerName,
        totalPeriods,
        subjects,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Plan de Estudios Oficial
          </CardTitle>
          <CardDescription>
            Define el plan de estudios oficial de la carrera, incluyendo asignaturas, períodos ideales y prerrequisitos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="career">Nombre de la Carrera</Label>
              <Input
                id="career"
                placeholder="Ej: Ingeniería en Sistemas"
                value={careerName}
                onChange={(e) => setCareerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periods">Total de Períodos</Label>
              <Input
                id="periods"
                type="number"
                min="1"
                max="20"
                value={totalPeriods}
                onChange={(e) => setTotalPeriods(parseInt(e.target.value) || 10)}
              />
            </div>
          </div>

          <Button onClick={handleLoadExample} variant="outline" className="w-full">
            <Upload className="size-4 mr-2" />
            Cargar Plan de Ejemplo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asignaturas ({subjects.length})</CardTitle>
          <CardDescription>
            Agrega las asignaturas del plan de estudios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subjects.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm bg-background px-2 py-1 rounded">
                        {subject.code}
                      </span>
                      <span>{subject.name}</span>
                      <span className="text-sm text-muted-foreground">
                        Período {subject.idealPeriod}
                      </span>
                    </div>
                    {subject.prerequisites.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Prerrequisitos: {subject.prerequisites.map(pId => 
                          subjects.find(s => s.id === pId)?.code || pId
                        ).join(', ')}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSubject(subject.id)}
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
              Agregar Asignatura
            </Button>
          ) : (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Input
                    placeholder="MAT101"
                    value={newSubject.code}
                    onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    placeholder="Cálculo I"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Período Ideal</Label>
                  <Input
                    type="number"
                    min="1"
                    max={totalPeriods}
                    value={newSubject.idealPeriod}
                    onChange={(e) => setNewSubject({ ...newSubject, idealPeriod: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Créditos</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newSubject.credits}
                    onChange={(e) => setNewSubject({ ...newSubject, credits: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddSubject} className="flex-1">
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
        disabled={!careerName || subjects.length === 0}
        className="w-full"
        size="lg"
      >
        Continuar con el Plan Oficial
      </Button>
    </div>
  );
}
