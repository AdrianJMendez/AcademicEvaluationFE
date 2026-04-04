import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { FileText, Send, AlertTriangle, Info, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DiscrepancyProp, JustificationProp } from '../../../types/request';

interface JustificationsInputProps {
  discrepancies: DiscrepancyProp[];
  onSubmit: (justifications: JustificationProp[]) => void;
}


export function JustificationsInput({ discrepancies, onSubmit }: JustificationsInputProps) {
  // Verificar si hay algún error crítico
  const hasCriticalError = discrepancies.some(d => d.type === 'Error');
  const criticalError = discrepancies.find(d => d.type === 'Error');
  
  // Filtrar discrepancias que no son de tipo "Observación" ni "error"
  const discrepanciesToJustify = discrepancies.filter(d => d.type !== 'Observacion' && d.type !== 'Error');
  const hasOnlyObservations = discrepanciesToJustify.length === 0 && !hasCriticalError;

  // Estado para justificaciones
  const [justifications, setJustifications] = useState<JustificationProp[]>(
    discrepanciesToJustify.map((disc, idx) => ({
      idDiscrepancyProp: idx,
      title: '',
      description: '',
    }))
  );

  const updateJustification = (index: number, updates: Partial<JustificationProp>) => {
    setJustifications(prev =>
      prev.map((j, i) => (i === index ? { ...j, ...updates } : j))
    );
  };

  const handleSubmit = () => {
    // Si hay error crítico, no permitir continuar
    if (hasCriticalError) {
      toast.error('No se puede continuar debido a un error crítico en la validación');
      return;
    }

    // Si solo hay observaciones, enviar array vacío
    if (hasOnlyObservations) {
      onSubmit([]);
      toast.success('No hay discrepancias que justificar');
      return;
    }

    // Verificar que todas las justificaciones tengan título y descripción
    const allFilled = justifications.every(j => j.title && j.description);
    if (!allFilled) {
      toast.error('Debes completar todas las justificaciones');
      return;
    }

    console.log("justifications", justifications);

    onSubmit(justifications);
  };

  // Función para obtener el color del badge según el tipo
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Baja carga academica':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Retraso':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Periodo sin matricula':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Observacion':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-500';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Función para obtener el ícono según la severidad
  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'Alta':
        return <AlertTriangle className="size-4 text-red-500" />;
      case 'Media':
        return <AlertTriangle className="size-4 text-yellow-500" />;
      case 'Baja':
        return <Info className="size-4 text-blue-500" />;
      default:
        return <Info className="size-4 text-gray-500" />;
    }
  };

  // Si hay un error crítico, mostrar mensaje de bloqueo
  if (hasCriticalError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="size-5" />
            Error Crítico en la Validación
          </CardTitle>
          <CardDescription className="text-red-600">
            Se ha detectado un error que impide continuar con el proceso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-100 mb-2">
                  {criticalError?.type || 'Error'} - No se puede continuar
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {criticalError?.description || 'Se ha encontrado una discrepancia crítica que no puede ser justificada.'}
                </p>
                <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/50 rounded-md">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    ¿Qué debes hacer?
                  </p>
                  <ul className="text-sm text-red-700 dark:text-red-300 mt-2 list-disc list-inside">
                    <li>Contacta al departamento de registro académico</li>
                    <li>Verifica que tu historial académico esté correctamente registrado</li>
                    <li>Solicita una revisión manual de tu situación académica</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <Button disabled className="w-full opacity-50 cursor-not-allowed">
            <Send className="size-4 mr-2" />
            No se puede continuar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Si solo hay observaciones, mostrar mensaje informativo
  if (hasOnlyObservations) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="size-5 text-green-600" />
            Sin Discrepancias
          </CardTitle>
          <CardDescription>
            Tu historial académico coincide perfectamente con el plan oficial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              No se detectaron discrepancias significativas. Puedes continuar con el proceso.
            </p>
          </div>
          <Button onClick={handleSubmit} className="w-full">
            <Send className="size-4 mr-2" />
            Continuar sin Justificaciones
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Justifica las Discrepancias</CardTitle>
        <CardDescription>
          Se detectaron {discrepanciesToJustify.length} discrepancia(s). Proporciona una justificación para cada una.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {discrepanciesToJustify.map((disc, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              {/* Encabezado de la discrepancia */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{disc.type}</h3>
                    <Badge className={getBadgeColor(disc.type)} variant="outline">
                      {disc.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {getSeverityIcon(disc.severity)}
                    <span className="text-xs text-muted-foreground">
                      Severidad: {disc.severity || 'No especificada'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{disc.description}</p>
              </div>

              {/* Formulario de justificación */}
              <div>
                <Label htmlFor={`title-${index}`}>
                  Título de la Justificación <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`title-${index}`}
                  placeholder="Ej: Motivos de salud, situación laboral, cambio de carrera..."
                  value={justifications[index].title}
                  onChange={(e) => updateJustification(index, { title: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor={`description-${index}`}>
                  Descripción Detallada <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id={`description-${index}`}
                  placeholder={`Describe detalladamente las razones de ${disc.type.toLowerCase()}...`}
                  rows={4}
                  value={justifications[index].description}
                  onChange={(e) => updateJustification(index, { description: e.target.value })}
                />
              </div>
            </div>
          ))}

          {/* Nota informativa */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <FileText className="size-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Nota Importante</p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  El nivel de afectación será evaluado por el personal administrativo. 
                  Asegúrate de proporcionar justificaciones claras y detalladas para cada discrepancia.
                </p>
              </div>
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full">
            <Send className="size-4 mr-2" />
            Enviar Justificaciones
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}