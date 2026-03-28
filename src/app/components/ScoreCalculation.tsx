import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import { Calculator, TrendingDown, TrendingUp, Award } from 'lucide-react';
import type { Justification, Discrepancy, OfficialPlan, AcademicHistory, ScoreResult } from '@/types/academic';

interface ScoreCalculationProps {
  plan: OfficialPlan;
  history: AcademicHistory[];
  discrepancies: Discrepancy[];
  justifications: Justification[];
  onViewReport: () => void;
}

export function ScoreCalculation({
  plan,
  history,
  discrepancies,
  justifications,
  onViewReport,
}: ScoreCalculationProps) {
  const scoreResult = useMemo(() => {
    const calculateScore = (): ScoreResult => {
      // Calcular tiempo total tomado
      const maxPeriod = Math.max(...history.map(h => h.periodTaken), 0);
      const plannedPeriods = plan.totalPeriods;
      const totalDelay = Math.max(0, maxPeriod - plannedPeriods);

      // Puntuación base: 100 si no hay retraso
      let baseScore = 100;
      
      if (totalDelay === 0) {
        baseScore = 100;
      }

      // Calcular penalización por retraso
      let delayPenalty = 0;
      if (totalDelay > 0) {
        // Penalización base: 5 puntos por período de retraso
        delayPenalty = totalDelay * 5;
      }

      // Calcular ajuste por impacto de las justificaciones
      let impactAdjustment = 0;
      if (justifications.length > 0) {
        const impactScores = justifications.map(j => {
          switch (j.impactLevel) {
            case 'no-impact':
              return 10; // Mayor penalización si no afectó pero hay retraso
            case 'low-impact':
              return 5;
            case 'high-impact':
              return 0; // Sin penalización adicional si afectó mucho
            default:
              return 5;
          }
        });

        impactAdjustment = impactScores.reduce((a, b) => a + b, 0) / justifications.length;
      }

      // Calcular nota final
      const finalScore = Math.max(
        50, // Mínimo 50 puntos
        Math.min(
          100, // Máximo 100 puntos
          baseScore - delayPenalty - impactAdjustment
        )
      );

      return {
        finalScore: Math.round(finalScore * 100) / 100,
        totalDelay,
        discrepanciesCount: discrepancies.length,
        breakdown: {
          baseScore,
          delayPenalty,
          impactAdjustment,
        },
      };
    };

    return calculateScore();
  }, [plan, history, discrepancies, justifications]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 75) return 'text-blue-600 dark:text-blue-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 dark:bg-green-950';
    if (score >= 75) return 'bg-blue-100 dark:bg-blue-950';
    if (score >= 60) return 'bg-amber-100 dark:bg-amber-950';
    return 'bg-red-100 dark:bg-red-950';
  };

  const getScoreBorderColor = (score: number) => {
    if (score >= 90) return 'border-green-300 dark:border-green-800';
    if (score >= 75) return 'border-blue-300 dark:border-blue-800';
    if (score >= 60) return 'border-amber-300 dark:border-amber-800';
    return 'border-red-300 dark:border-red-800';
  };

  return (
    <div className="space-y-6">
      <Card className={`border-2 ${getScoreBorderColor(scoreResult.finalScore)}`}>
        <CardHeader className={getScoreBgColor(scoreResult.finalScore)}>
          <CardTitle className="flex items-center gap-2">
            <Award className="size-6" />
            Nota Final del Plan Cursado
          </CardTitle>
          <CardDescription>
            Evaluación basada en cumplimiento del plan de estudios y justificaciones presentadas
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className={`text-6xl ${getScoreColor(scoreResult.finalScore)}`}>
              {scoreResult.finalScore}
            </div>
            <div className="text-2xl text-muted-foreground">/ 100</div>
          </div>

          <Progress 
            value={scoreResult.finalScore} 
            className="h-3 mb-6" 
          />

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="text-sm text-muted-foreground mb-1">Períodos de Retraso</div>
              <div className="text-2xl font-semibold flex items-center gap-2">
                {scoreResult.totalDelay}
                {scoreResult.totalDelay > 0 && (
                  <TrendingDown className="size-5 text-red-500" />
                )}
                {scoreResult.totalDelay === 0 && (
                  <TrendingUp className="size-5 text-green-500" />
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="text-sm text-muted-foreground mb-1">Discrepancias</div>
              <div className="text-2xl font-semibold">{scoreResult.discrepanciesCount}</div>
            </div>

            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="text-sm text-muted-foreground mb-1">Justificaciones</div>
              <div className="text-2xl font-semibold">{justifications.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="size-5" />
            Desglose del Cálculo
          </CardTitle>
          <CardDescription>
            Detalle de cómo se calculó la nota final
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <span className="text-sm">Puntuación Base</span>
              <span className="font-semibold">{scoreResult.breakdown.baseScore} pts</span>
            </div>

            {scoreResult.breakdown.delayPenalty > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <span className="text-sm">Penalización por Retraso</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  -{scoreResult.breakdown.delayPenalty} pts
                </span>
              </div>
            )}

            {scoreResult.breakdown.impactAdjustment > 0 && (
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <span className="text-sm">Ajuste por Nivel de Impacto</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  -{scoreResult.breakdown.impactAdjustment.toFixed(2)} pts
                </span>
              </div>
            )}

            <div className={`flex items-center justify-between p-4 ${getScoreBgColor(scoreResult.finalScore)} rounded-lg border-2 ${getScoreBorderColor(scoreResult.finalScore)}`}>
              <span className="font-semibold">Nota Final</span>
              <span className={`text-2xl ${getScoreColor(scoreResult.finalScore)}`}>
                {scoreResult.finalScore} / 100
              </span>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Criterios de Evaluación:</strong>
            </p>
            <ul className="text-sm text-blue-900 dark:text-blue-100 mt-2 space-y-1 list-disc list-inside">
              <li>Mismo tiempo o menor al plan original = 100 puntos</li>
              <li>Penalización: 5 puntos por cada período de retraso</li>
              <li>Ajuste según nivel de afectación declarado en justificaciones</li>
              <li>Puntaje mínimo garantizado: 50 puntos</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onViewReport} className="w-full" size="lg">
        Ver Informe Detallado
      </Button>
    </div>
  );
}
