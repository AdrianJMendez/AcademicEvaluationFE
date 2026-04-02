import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { Career, Subject } from '@/types/academic';
import { useEffect, useState } from 'react';
import careerService from '../../../services/career.service';

interface PlanVisualizationStudentProps {
  plan: Career;
  onContinue: (subjects: Subject[]) => void;
}

export function PlanVisualizationStudent({ plan, onContinue }: PlanVisualizationStudentProps) {
  const [subjectsByPeriod, setSubjectsByPeriod] = useState<Record<number, Subject[]>>({});
  const [idealSubjects, setIdealSubjects] = useState<Subject[]>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      setIsLoading(true);
      try {
        const response = await careerService.getSubjectsByCareer(plan.idCareer);
        if (!response.hasError && response.data) {
          setIdealSubjects(response.data);
          const grouped = response.data.reduce((acc, subject) => {
            const period = subject.idealPeriod;
            if (!acc[period]) {
              acc[period] = [];
            }
            acc[period].push(subject);
            return acc;
          }, {} as Record<number, Subject[]>);
          
          setSubjectsByPeriod(grouped);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, [plan.idCareer]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="size-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando plan de estudios...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalSubjects = Object.values(subjectsByPeriod).flat().length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="size-5" />
          Plan Oficial: {plan.careerName}
        </CardTitle>
        <CardDescription>
          Visualiza el flujo ideal de tu carrera ({plan.totalPeriods} períodos • {totalSubjects} asignaturas)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {Object.keys(subjectsByPeriod).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay asignaturas disponibles para mostrar</p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {Object.entries(subjectsByPeriod)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([period, subjects]) => (
                <div key={period} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Período {period}</h3>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {subjects.map((subject) => (
                      <div key={subject.idSubject} className="border rounded p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{subject.subjectCode}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{subject.subjectName}</p>
                          </div>
                          {subject.credits && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded ml-2 whitespace-nowrap">
                              {subject.credits} CR
                            </span>
                          )}
                        </div>
                        {subject.Prerequisites && subject.Prerequisites.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Prerrequisitos: {subject.Prerequisites.length}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        <Button onClick={()=>onContinue(idealSubjects)} className="w-full">
          Continuar con mi Historial Académico
          <ArrowRight className="size-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}