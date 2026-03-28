import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { Badge } from '@/app/components/ui/badge';
import { FileText, Download, Sparkles, Calendar, Award } from 'lucide-react';
import type { Justification, Discrepancy, OfficialPlan, AcademicHistory } from '@/types/academic';

interface FinalReportProps {
  plan: OfficialPlan;
  history: AcademicHistory[];
  discrepancies: Discrepancy[];
  justifications: Justification[];
  finalScore: number;
}

export function FinalReport({
  plan,
  history,
  discrepancies,
  justifications,
  finalScore,
}: FinalReportProps) {
  const generateReport = () => {
    const reportDate = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      date: reportDate,
      sections: [
        {
          title: 'Resumen Ejecutivo',
          content: `Este informe presenta la evaluación del cumplimiento del plan de estudios de la carrera ${plan.careerName}. Se ha analizado el historial académico del estudiante en comparación con el plan oficial, identificando discrepancias y evaluando las justificaciones presentadas.`,
        },
        {
          title: 'Datos del Plan de Estudios',
          content: `Carrera: ${plan.careerName}\nTotal de Períodos Planificados: ${plan.totalPeriods}\nTotal de Asignaturas: ${plan.subjects.length}`,
        },
        {
          title: 'Análisis de Discrepancias',
          content: discrepancies.length === 0
            ? 'No se detectaron discrepancias. El estudiante completó el plan según lo establecido.'
            : `Se identificaron ${discrepancies.length} discrepancia(s) entre el plan oficial y el historial del estudiante.`,
        },
      ],
    };
  };

  const report = generateReport();

  const handleExport = () => {
    // Generar texto del informe
    let reportText = `INFORME ACADÉMICO DE EVALUACIÓN\n`;
    reportText += `Carrera: ${plan.careerName}\n`;
    reportText += `Fecha: ${report.date}\n`;
    reportText += `\n${'='.repeat(80)}\n\n`;

    report.sections.forEach(section => {
      reportText += `${section.title.toUpperCase()}\n`;
      reportText += `${'-'.repeat(section.title.length)}\n`;
      reportText += `${section.content}\n\n`;
    });

    reportText += `DISCREPANCIAS Y JUSTIFICACIONES\n`;
    reportText += `${'-'.repeat(80)}\n\n`;

    discrepancies.forEach((disc, index) => {
      const just = justifications.find(j => j.discrepancyId === disc.id);
      reportText += `${index + 1}. ${disc.subjectName}\n`;
      reportText += `   Tipo: ${disc.type === 'delay' ? 'Retraso' : 'Salto de Prerrequisito'}\n`;
      reportText += `   Período Esperado: ${disc.expectedPeriod}\n`;
      reportText += `   Período Real: ${disc.actualPeriod}\n`;
      if (just) {
        reportText += `   Justificación: ${just.title}\n`;
        reportText += `   Descripción: ${just.description}\n`;
        reportText += `   Nivel de Impacto: ${
          just.impactLevel === 'no-impact' ? 'No Afectó' :
          just.impactLevel === 'low-impact' ? 'Afectó Poco' : 'Afectó Mucho'
        }\n`;
      }
      reportText += `\n`;
    });

    reportText += `\nNOTA FINAL: ${finalScore} / 100\n`;
    reportText += `\nFirma Digital: ${Date.now()}\n`;

    // Descargar como archivo
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe-academico-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getImpactBadge = (level: string) => {
    const styles = {
      'no-impact': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'low-impact': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'high-impact': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    const labels = {
      'no-impact': 'No Afectó',
      'low-impact': 'Afectó Poco',
      'high-impact': 'Afectó Mucho',
    };
    return (
      <Badge className={styles[level as keyof typeof styles]} variant="outline">
        {labels[level as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary">
        <CardHeader className="bg-primary/10">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileText className="size-6" />
            Informe Académico Final
          </CardTitle>
          <CardDescription className="text-base">
            Evaluación generada automáticamente del cumplimiento del plan de estudios
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-4" />
              <span>{report.date}</span>
            </div>
            <Button onClick={handleExport} variant="outline">
              <Download className="size-4 mr-2" />
              Exportar Informe
            </Button>
          </div>

          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
            <Sparkles className="size-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Este informe fue generado automáticamente mediante análisis inteligente del historial académico
            </p>
          </div>
        </CardContent>
      </Card>

      {report.sections.map((section, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-lg">{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">{section.content}</p>
          </CardContent>
        </Card>
      ))}

      {discrepancies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Discrepancias y Justificaciones</CardTitle>
            <CardDescription>
              Análisis individualizado de cada discrepancia detectada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {discrepancies.map((disc, index) => {
              const just = justifications.find(j => j.discrepancyId === disc.id);
              return (
                <div key={disc.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">
                        {index + 1}. {disc.subjectName}
                      </h4>
                      <p className="text-sm text-muted-foreground">{disc.description}</p>
                    </div>
                    <Badge variant="outline">
                      {disc.type === 'delay' ? 'Retraso' : 'Prerrequisito'}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Período Esperado:</span>
                      <span className="font-medium">{disc.expectedPeriod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Período Real:</span>
                      <span className="font-medium">{disc.actualPeriod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Diferencia:</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        {Math.abs(disc.actualPeriod - disc.expectedPeriod)} período(s)
                      </span>
                    </div>
                  </div>

                  {just && (
                    <>
                      <Separator />
                      
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-semibold text-sm">Justificación:</h5>
                          {getImpactBadge(just.impactLevel)}
                        </div>
                        
                        <div>
                          <p className="font-medium text-sm">{just.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{just.description}</p>
                        </div>

                        {(just.images.length > 0 || just.attachments.length > 0) && (
                          <div className="flex gap-4 text-xs text-muted-foreground pt-2">
                            {just.images.length > 0 && (
                              <span>📷 {just.images.length} imagen(es)</span>
                            )}
                            {just.attachments.length > 0 && (
                              <span>📎 {just.attachments.length} archivo(s)</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-900 dark:text-blue-100">
                          <strong>Ponderación:</strong> Esta discrepancia fue considerada en el cálculo final. 
                          El nivel de impacto declarado ({
                            just.impactLevel === 'no-impact' ? 'no afectó' :
                            just.impactLevel === 'low-impact' ? 'afectó poco' : 'afectó mucho'
                          }) influyó en la penalización aplicada.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-primary">
        <CardHeader className="bg-primary/10">
          <CardTitle className="flex items-center gap-2">
            <Award className="size-5" />
            Nota Final
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-6xl font-bold text-primary mb-2">
              {finalScore}
            </div>
            <div className="text-2xl text-muted-foreground">/ 100</div>
            <p className="text-sm text-muted-foreground mt-4">
              {finalScore >= 90 ? 'Excelente cumplimiento del plan de estudios' :
               finalScore >= 75 ? 'Buen cumplimiento con ligeras variaciones' :
               finalScore >= 60 ? 'Cumplimiento aceptable con variaciones moderadas' :
               'Variaciones significativas respecto al plan original'}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
        <p>Este informe fue generado automáticamente el {report.date}</p>
        <p className="mt-1">Firma digital: {Date.now()}</p>
      </div>
    </div>
  );
}
