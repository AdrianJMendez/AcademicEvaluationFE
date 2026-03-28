import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { FileText, Upload, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { Discrepancy, Justification } from '@/types/academic';

interface JustificationsInputProps {
  discrepancies: Discrepancy[];
  onSubmit: (justifications: Justification[]) => void;
}

export function JustificationsInput({ discrepancies, onSubmit }: JustificationsInputProps) {
  const [justifications, setJustifications] = useState<Justification[]>(
    discrepancies.map(disc => ({
      discrepancyId: disc.id,
      title: '',
      description: '',
      documents: [],
      images: [],
    }))
  );

  const updateJustification = (index: number, updates: Partial<Justification>) => {
    setJustifications(prev =>
      prev.map((j, i) => (i === index ? { ...j, ...updates } : j))
    );
  };

  const handleSubmit = () => {
    const allFilled = justifications.every(j => j.title && j.description);
    if (!allFilled) {
      toast.error('Debes completar todas las justificaciones');
      return;
    }

    onSubmit(justifications);
  };

  if (discrepancies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sin Discrepancias</CardTitle>
          <CardDescription>Tu historial académico coincide perfectamente con el plan oficial</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => onSubmit([])} className="w-full">
            <Send className="size-4 mr-2" />
            Enviar Solicitud
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
          Se detectaron {discrepancies.length} discrepancia(s). Proporciona una justificación para cada una.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {discrepancies.map((disc, index) => (
            <div key={disc.id} className="border rounded-lg p-4 space-y-4">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{disc.subjectName}</h3>
                  <Badge variant="outline">
                    {disc.type === 'delay' ? 'Retraso' : disc.type === 'prerequisite-skip' ? 'Prerrequisito' : 'Cambio'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{disc.description}</p>
              </div>

              <div>
                <Label htmlFor={`title-${index}`}>Título de la Justificación *</Label>
                <Input
                  id={`title-${index}`}
                  placeholder="Ej: Motivos de salud, situación familiar..."
                  value={justifications[index].title}
                  onChange={(e) => updateJustification(index, { title: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor={`description-${index}`}>Descripción Detallada *</Label>
                <Textarea
                  id={`description-${index}`}
                  placeholder="Describe detalladamente las razones de esta discrepancia..."
                  rows={4}
                  value={justifications[index].description}
                  onChange={(e) => updateJustification(index, { description: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor={`files-${index}`}>Documentos de Soporte (opcional)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id={`files-${index}`}
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      updateJustification(index, { documents: files as File[] });
                    }}
                  />
                </div>
                {justifications[index].documents.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {justifications[index].documents.length} archivo(s) seleccionado(s)
                  </p>
                )}
              </div>
            </div>
          ))}

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <FileText className="size-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Nota Importante</p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  El nivel de afectación será evaluado por el personal administrativo. Asegúrate de proporcionar justificaciones claras y documentación de soporte cuando sea posible.
                </p>
              </div>
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full">
            <Send className="size-4 mr-2" />
            Enviar Solicitud
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
