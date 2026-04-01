// app/components/student/HistoryInput.tsx
import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Upload, Loader2, FileText, AlertCircle, Eye, HelpCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import type { OfficialPlan, AcademicHistory, Discrepancy } from '@/types/academic';
import OCRService from '@/lib/ocr';
import HistoryParserService, { ParsedSubject, HistoryFormat } from '@/lib/history-parser';
import { EditableSubjectsTable } from '@/app/components/student/EditableSubjectsTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';

interface HistoryInputProps {
  plan: OfficialPlan;
  onContinue: (history: AcademicHistory[], discrepancies: Discrepancy[]) => void;
}

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  text?: string;
  error?: string;
  parsedSubjects?: ParsedSubject[];
}

export function HistoryInput({ plan, onContinue }: HistoryInputProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [allSubjects, setAllSubjects] = useState<ParsedSubject[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [historyFormat, setHistoryFormat] = useState<HistoryFormat>('standard');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
      toast.error('Solo se permiten archivos de imagen');
    }
    
    if (validFiles.length === 0) return;
    
    const newImages: ImageFile[] = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
    }));
    
    setImages(prev => [...prev, ...newImages]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const processImages = async () => {
    if (images.length === 0) {
      toast.error('Debes seleccionar al menos una imagen');
      return;
    }
    
    const pendingImages = images.filter(img => img.status === 'pending');
    if (pendingImages.length === 0) {
      toast.info('Todas las imágenes ya fueron procesadas');
      return;
    }
    
    setIsProcessing(true);
    const allExtractedTexts: string[] = [];
    const updatedImages = [...images];
    
    try {
      for (let i = 0; i < pendingImages.length; i++) {
        const image = pendingImages[i];
        const imageIndex = updatedImages.findIndex(img => img.id === image.id);
        
        updatedImages[imageIndex] = { ...image, status: 'processing' };
        setImages([...updatedImages]);
        
        try {
          const result = await OCRService.scanImage(image.file);
          
          updatedImages[imageIndex] = {
            ...image,
            status: 'completed',
            text: result,
          };
          
          allExtractedTexts.push(result);
          
          toast.success(`Imagen procesada: ${image.file.name}`);
        } catch (error) {
          updatedImages[imageIndex] = {
            ...image,
            status: 'error',
            error: 'Error al procesar la imagen',
          };
          toast.error(`Error al procesar: ${image.file.name}`);
        }
        
        setImages([...updatedImages]);
      }
      
      // Parsear todos los textos extraídos con el formato seleccionado
      if (allExtractedTexts.length > 0) {
        const parsedSubjects = HistoryParserService.combineResults(allExtractedTexts, historyFormat);
        setAllSubjects(parsedSubjects);
        setShowTable(true);
        toast.success(`Se detectaron ${parsedSubjects.length} asignaturas`);
      }
      
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubjectsChange = (newSubjects: ParsedSubject[]) => {
    setAllSubjects(newSubjects);
  };

  const handleContinue = () => {
    if (allSubjects.length === 0) {
      toast.error('No hay asignaturas para continuar');
      return;
    }
    
    // Convertir ParsedSubject a AcademicHistory
    const academicHistory: AcademicHistory[] = allSubjects.map(subject => ({
      subjectId: subject.code,
      periodTaken: subject.period,
      year: subject.year,
      grade: subject.grade,
      status: subject.status === 'APR' ? 'approved' : 
              subject.status === 'RPB' ? 'failed' : 'notPresented',
    }));
    
    // Por ahora, no detectamos discrepancias hasta tener el plan
    const discrepancies: Discrepancy[] = [];
    
    onContinue(academicHistory, discrepancies);
  };

  const getStatusIcon = (status: ImageFile['status']) => {
    switch (status) {
      case 'pending':
        return <FileText className="size-4 text-muted-foreground" />;
      case 'processing':
        return <Loader2 className="size-4 animate-spin text-blue-500" />;
      case 'completed':
        return <Eye className="size-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="size-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getFormatDescription = (format: HistoryFormat) => {
    if (format === 'standard') {
      return "Formato estándar con columnas: CÓDIGO | NOMBRE | UV | PERÍODO | NOTA | OBS";
    }
    return "Formato de tabla web con columnas: CÓDIGO | ASIGNATURA | UV | SECCIÓN | AÑO | PERÍODO | CALIFICACIÓN | OBS";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Subir Historial Académico</CardTitle>
        <CardDescription>
          Sube imágenes de tu historial académico. El sistema extraerá automáticamente la información y te permitirá editarla.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Selector de formato */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">
                Formato del historial académico
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="size-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>{getFormatDescription(historyFormat)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={historyFormat}
              onValueChange={(value: HistoryFormat) => {
                setHistoryFormat(value);
                // Resetear los datos cuando se cambia el formato
                setAllSubjects([]);
                setShowTable(false);
              }}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Selecciona el formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">
                  Formato Estándar
                  <span className="text-xs text-muted-foreground ml-2">
                    (CÓDIGO | NOMBRE | UV | PERÍODO | NOTA | OBS)
                  </span>
                </SelectItem>
                <SelectItem value="webTable">
                  Formato Tabla Web
                  <span className="text-xs text-muted-foreground ml-2">
                    (CÓDIGO | ASIGNATURA | UV | SECCIÓN | AÑO | PERÍODO | CALIFICACIÓN | OBS)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Área de carga de imágenes */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="size-8 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Haz clic para seleccionar imágenes
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos soportados: JPG, PNG, GIF, WebP
                </p>
                <p className="text-xs text-muted-foreground">
                  Puedes seleccionar múltiples imágenes (cada página del historial)
                </p>
                {historyFormat === 'webTable' && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    💡 Sugerencia: Para el formato Tabla Web, asegúrate de que la imagen capture claramente todas las columnas
                  </p>
                )}
              </div>
            </label>
          </div>

          {/* Lista de imágenes */}
          {images.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">
                  Imágenes cargadas ({images.length})
                </h3>
                <Button
                  onClick={processImages}
                  disabled={isProcessing}
                  size="sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Procesar todas'
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="border rounded-lg overflow-hidden relative group"
                  >
                    <div className="aspect-square bg-muted relative">
                      <img
                        src={image.preview}
                        alt={image.file.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(image.id)}
                        className="absolute top-1 right-1 p-1 bg-background/80 hover:bg-destructive/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        disabled={isProcessing}
                      >
                        <X className="size-3 text-destructive" />
                      </button>
                    </div>
                    
                    <div className="p-2 flex items-center justify-between">
                      <p className="text-xs truncate flex-1">
                        {image.file.name}
                      </p>
                      {getStatusIcon(image.status)}
                    </div>
                    
                    {image.status === 'processing' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="size-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabla de asignaturas editable */}
          {showTable && allSubjects.length > 0 && (
            <div className="border-t pt-6">
              <EditableSubjectsTable
                subjects={allSubjects}
                onSubjectsChange={handleSubjectsChange}
              />
            </div>
          )}

          {/* Botón continuar */}
          {showTable && (
            <Button
              onClick={handleContinue}
              className="w-full"
              disabled={allSubjects.length === 0}
            >
              Continuar con la evaluación
            </Button>
          )}

          {/* Mensaje informativo */}
          {images.length === 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <FileText className="size-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Instrucciones
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    1. Selecciona el formato correcto de tu historial académico
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    2. Sube imágenes de tu historial académico (cada página por separado)
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    3. El sistema procesará las imágenes y extraerá las asignaturas
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    4. Revisa y edita los datos si es necesario
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    5. Continúa para verificar discrepancias con tu plan de estudios
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}