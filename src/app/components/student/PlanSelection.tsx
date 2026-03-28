import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { BookOpen, ChevronRight } from 'lucide-react';
import type { OfficialPlan } from '@/types/academic';

interface PlanSelectionProps {
  onSelect: (plan: OfficialPlan) => void;
}

export function PlanSelection({ onSelect }: PlanSelectionProps) {
  const { officialPlans } = useData();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="size-5" />
          Selecciona tu Carrera
        </CardTitle>
        <CardDescription>
          Elige la carrera para la cual deseas enviar la solicitud de evaluación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {officialPlans.map((plan) => (
          <div
            key={plan.id}
            className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors group"
            onClick={() => onSelect(plan)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">{plan.careerName}</h3>
                <p className="text-sm text-muted-foreground">
                  Código: {plan.careerCode} • {plan.totalPeriods} períodos • {plan.subjects.length} asignaturas
                </p>
              </div>
              <Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
