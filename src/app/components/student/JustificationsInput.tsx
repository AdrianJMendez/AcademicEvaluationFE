//JustificationInput.tsx

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { FileText, Send, AlertTriangle, Info, XCircle, ArrowLeft, Plus, Trash2, Upload, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { DiscrepancyProp, JustificationProp } from '../../../types/request';

interface JustificationsInputProps {
  discrepancies: DiscrepancyProp[];
  onSubmit: (justifications: JustificationProp[], images: File[]) => void;
  onBack: () => void;
}

interface DynamicJustification {
  id: string;
  title: string;
  description: string;
  selectedDiscrepancies: number[]; // índices de las discrepancias seleccionadas
}

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

export function JustificationsInput({ discrepancies, onSubmit, onBack }: JustificationsInputProps) {
  // Verificar si hay algún error crítico
  const hasCriticalError = discrepancies.some(d => d.type === 'Error');
  const criticalError = discrepancies.find(d => d.type === 'Error');
  
  // Filtrar discrepancias que no son de tipo "Observación" ni "error"
  const discrepanciesToJustify = discrepancies.filter(d => d.type !== 'Observacion' && d.type !== 'Error');
  const hasOnlyObservations = discrepanciesToJustify.length === 0 && !hasCriticalError;

  // Estado para justificaciones dinámicas
  const [justifications, setJustifications] = useState<DynamicJustification[]>([
    {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      selectedDiscrepancies: []
    }
  ]);

  // Estado para imágenes
  const [images, setImages] = useState<ImageFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función para agregar una nueva justificación
  const addJustification = () => {
    setJustifications(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: '',
        description: '',
        selectedDiscrepancies: []
      }
    ]);
  };

  // Función para eliminar una justificación
  const removeJustification = (id: string) => {
    if (justifications.length === 1) {
      toast.error('Debe haber al menos una justificación');
      return;
    }
    setJustifications(prev => prev.filter(j => j.id !== id));
  };

  // Función para actualizar una justificación
  const updateJustification = (id: string, updates: Partial<DynamicJustification>) => {
    setJustifications(prev =>
      prev.map(j => j.id === id ? { ...j, ...updates } : j)
    );
  };

  // Función para toggle de selección de discrepancia
  const toggleDiscrepancy = (justificationId: string, discrepancyIndex: number) => {
    setJustifications(prev =>
      prev.map(j => {
        if (j.id === justificationId) {
          const isSelected = j.selectedDiscrepancies.includes(discrepancyIndex);
          return {
            ...j,
            selectedDiscrepancies: isSelected
              ? j.selectedDiscrepancies.filter(idx => idx !== discrepancyIndex)
              : [...j.selectedDiscrepancies, discrepancyIndex]
          };
        }
        return j;
      })
    );
  };

  // Función para seleccionar todas las discrepancias para una justificación
  const selectAllDiscrepancies = (justificationId: string) => {
    setJustifications(prev =>
      prev.map(j =>
        j.id === justificationId
          ? { ...j, selectedDiscrepancies: discrepanciesToJustify.map((_, idx) => idx) }
          : j
      )
    );
  };

  // Función para limpiar la selección de una justificación
  const clearSelection = (justificationId: string) => {
    setJustifications(prev =>
      prev.map(j =>
        j.id === justificationId
          ? { ...j, selectedDiscrepancies: [] }
          : j
      )
    );
  };

  // Función para manejar la subida de imágenes
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    const validFiles = files.filter(file => {
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} no es un formato de imagen válido`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name} excede el tamaño máximo de 5MB`);
        return false;
      }
      return true;
    });

    const newImages = validFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file)
    }));

    setImages(prev => [...prev, ...newImages]);
    
    // Limpiar el input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Función para eliminar una imagen
  const removeImage = (id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const handleSubmit = () => {
    // Si hay error crítico, no permitir continuar
    if (hasCriticalError) {
      toast.error('No se puede continuar debido a un error crítico en la validación');
      return;
    }

    // Si solo hay observaciones, enviar array vacío
    if (hasOnlyObservations) {
      onSubmit([], []);
      toast.success('No hay discrepancias que justificar');
      return;
    }

    // Verificar que todas las justificaciones tengan título y descripción
    const allFilled = justifications.every(j => j.title && j.description);
    if (!allFilled) {
      toast.error('Debes completar todas las justificaciones (título y descripción)');
      return;
    }

    // Verificar que todas las discrepancias estén cubiertas por al menos una justificación
    const coveredDiscrepancies = new Set<number>();
    justifications.forEach(j => {
      j.selectedDiscrepancies.forEach(idx => coveredDiscrepancies.add(idx));
    });

    const allDiscrepanciesCovered = discrepanciesToJustify.length === coveredDiscrepancies.size;
    if (!allDiscrepanciesCovered) {
      toast.error('Debes asignar cada discrepancia a al menos una justificación');
      return;
    }

    const formattedJustifications: JustificationProp[] = justifications.map(j => ({
      discrepancyProps: j.selectedDiscrepancies,
      title: j.title,
      description: j.description,
    }));

    // Enviar las imágenes como archivos
    const imageFiles = images.map(img => img.file);
    onSubmit(formattedJustifications, imageFiles);
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
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1">
              <ArrowLeft className="size-4 mr-2" />
              Regresar
            </Button>
            <Button disabled className="flex-1 opacity-50 cursor-not-allowed">
              <Send className="size-4 mr-2" />
              No se puede continuar
            </Button>
          </div>
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
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1">
              <ArrowLeft className="size-4 mr-2" />
              Regresar
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              <Send className="size-4 mr-2" />
              Continuar sin Justificaciones
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Justifica las Discrepancias</CardTitle>
        <CardDescription>
          Se detectaron {discrepanciesToJustify.length} discrepancia(s). 
          Puedes agrupar varias discrepancias en una misma justificación o crear justificaciones separadas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Lista de discrepancias */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Discrepancias Detectadas:</h3>
            <div className="grid gap-3">
              {discrepanciesToJustify.map((disc, idx) => (
                <div key={idx} className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">#{idx + 1}</span>
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
              ))}
            </div>
          </div>

          {/* Sección de imágenes */}
          <div className="space-y-4 border-t pt-6">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ImageIcon className="size-5" />
                Documentos de Soporte (Opcional)
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sube imágenes, capturas de pantalla o documentos que respalden tus justificaciones.
                Formatos permitidos: JPG, PNG, GIF, WEBP (Máx. 5MB por archivo)
              </p>
            </div>

            {/* Área de subida de imágenes */}
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="size-10 text-muted-foreground" />
                <div>
                  <Button type="button" variant="outline" size="sm">
                    Seleccionar archivos
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  o arrastra y suelta los archivos aquí
                </p>
              </label>
            </div>

            {/* Vista previa de imágenes */}
            {images.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Imágenes subidas ({images.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                        <img
                          src={image.preview}
                          alt={image.file.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImage(image.id)}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {image.file.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Justificaciones dinámicas */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Justificaciones:</h3>
              <Button type="button" variant="outline" size="sm" onClick={addJustification}>
                <Plus className="size-4 mr-2" />
                Agregar Justificación
              </Button>
            </div>

            {justifications.map((justification, jIdx) => (
              <div key={justification.id} className="border-2 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Justificación #{jIdx + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeJustification(justification.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {/* Selección de discrepancias */}
                <div>
                  <Label>Discrepancias que cubre esta justificación:</Label>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                    {discrepanciesToJustify.map((disc, discIdx) => (
                      <label key={discIdx} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={justification.selectedDiscrepancies.includes(discIdx)}
                          onChange={() => toggleDiscrepancy(justification.id, discIdx)}
                          className="size-4"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">#{discIdx + 1}</span>
                            <Badge className={getBadgeColor(disc.type)} variant="outline">
                              {disc.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{disc.description.substring(0, 100)}...</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => selectAllDiscrepancies(justification.id)}
                    >
                      Seleccionar todas
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => clearSelection(justification.id)}
                    >
                      Limpiar selección
                    </Button>
                  </div>
                </div>

                {/* Título de justificación */}
                <div>
                  <Label htmlFor={`title-${justification.id}`}>
                    Título de la Justificación <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`title-${justification.id}`}
                    placeholder="Ej: Motivos de salud, situación laboral, cambio de carrera..."
                    value={justification.title}
                    onChange={(e) => updateJustification(justification.id, { title: e.target.value })}
                  />
                </div>

                {/* Descripción de justificación */}
                <div>
                  <Label htmlFor={`description-${justification.id}`}>
                    Descripción Detallada <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id={`description-${justification.id}`}
                    placeholder="Describe detalladamente las razones que justifican estas discrepancias..."
                    rows={4}
                    value={justification.description}
                    onChange={(e) => updateJustification(justification.id, { description: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Nota informativa */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <FileText className="size-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Nota Importante</p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Puedes agrupar varias discrepancias en una misma justificación si están relacionadas.
                  Cada discrepancia debe estar cubierta por al menos una justificación.
                  El nivel de afectación será evaluado por el personal administrativo.
                  Las imágenes subidas servirán como evidencia de soporte para todas tus justificaciones.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1">
              <ArrowLeft className="size-4 mr-2" />
              Regresar
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              <Send className="size-4 mr-2" />
              Enviar Justificaciones
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}