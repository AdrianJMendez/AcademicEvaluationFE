import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { ArrowRight, BookOpen } from 'lucide-react';
import type { OfficialPlan } from '@/types/academic';

interface PlanVisualizationStudentProps {
  plan: OfficialPlan;
  onContinue: () => void;
}

export function PlanVisualizationStudent({ plan, onContinue }: PlanVisualizationStudentProps) {
  const subjectsByPeriod = plan.subjects.reduce((acc, subject) => {
    if (!acc[subject.idealPeriod]) {
      acc[subject.idealPeriod] = [];
    }
    acc[subject.idealPeriod].push(subject);
    return acc;
  }, {} as Record<number, typeof plan.subjects>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="size-5" />
          Plan Oficial: {plan.careerName}
        </CardTitle>
        <CardDescription>
          Visualiza el flujo ideal de tu carrera ({plan.totalPeriods} períodos • {plan.subjects.length} asignaturas)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          {Object.entries(subjectsByPeriod)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([period, subjects]) => (
              <div key={period} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Período {period}</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="border rounded p-3 bg-muted/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{subject.code}</p>
                          <p className="text-xs text-muted-foreground">{subject.name}</p>
                        </div>
                        {subject.credits && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {subject.credits} CR
                          </span>
                        )}
                      </div>
                      {subject.prerequisites.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Prerrequisitos: {subject.prerequisites.length}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>

        <Button onClick={onContinue} className="w-full">
          Continuar con mi Historial Académico
          <ArrowRight className="size-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
