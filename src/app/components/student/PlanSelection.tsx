import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { BookOpen, ChevronRight } from 'lucide-react';
import type { Career } from '@/types/academic';
import { useEffect, useState } from 'react';
import studentService from '../../../services/student.service';

interface PlanSelectionProps {
  onSelect: (plan: Career) => void;
}

export function PlanSelection({ onSelect }: PlanSelectionProps) {
  const [careers, setCareers] = useState<Career[]>();

  useEffect(()=>{
    studentService.getCareersForStudent().then((response)=>{
      if(!response.hasError){
        setCareers(response.data);
      }
    })
  },[]);

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
        {careers && (
          careers.map((c) => (
            <div
              key={c.idCareer}
              className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors group"
              onClick={() => onSelect(c)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">{c.careerName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Código: {c.careerCode} • {c.totalPeriods} períodos • {c.yearLength} años estimados
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
