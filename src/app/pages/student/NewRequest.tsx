import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PlanSelection } from '@/app/components/student/PlanSelection';
import { PlanVisualizationStudent } from '@/app/components/student/PlanVisualizationStudent';
import { HistoryInput } from '@/app/components/student/HistoryInput';
import { JustificationsInput } from '@/app/components/student/JustificationsInput';
import { toast } from 'sonner';
import { Career, Subject } from '../../../types/academic';
import { DiscrepancyProp, JustificationProp } from '../../../types/request';
import {ParsedSubject} from '../../../lib/history-parser';
import requestService from '../../../services/request.service';

type Step = 'select-career' | 'view-plan' | 'input-history' | 'justifications';

export function NewRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('select-career');
  const [selectedPlan, setSelectedPlan] = useState<Career | null>(null);
  const [idealSubjects, setIdealSubjects] = useState<Subject[] | undefined>();
  const [history, setHistory] = useState<ParsedSubject[]>([]);
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyProp[]>([]);
  const [justifications, setJustifications] = useState<JustificationProp[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (justs: JustificationProp[], images: File[]) => {
    if (!selectedPlan || !user) return;

    setIsSubmitting(true);

    try {
      setJustifications(justs);
      setImages(images);

      const parsedImagesPromises = images.map(async (image) => {
        try {
          const base64Image = await toBase64(image);
          
          return {
            base64Image
          };
        } catch (error) {
          console.error('Error converting image to base64:', error);
          throw new Error(`Error al procesar la imagen: ${image.name}`);
        }
      });

      const parsedImages = await Promise.all(parsedImagesPromises);

      const payload = {
        idStudentCareer: selectedPlan.StudentCareer?.idStudentCareer,
        discrepancies,
        justifications: justs,
        images: parsedImages
      };

      console.log(payload);

      requestService.createRequest(payload)
      .then((response)=>{
        if(!response.hasError){
          toast.success('Solicitud enviada correctamente');
          navigate('/student');
        }else{
          toast.error(response.meta.message);
        }
      });

    }catch(err){
      console.log(err)
      toast.error('Ocurrió un error al enviar la solicitud. Por favor, intenta nuevamente.');
    }finally{
      setIsSubmitting(false);
    }
    
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button onClick={() => navigate('/student')} variant="ghost">
            <ArrowLeft className="size-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {step === 'select-career' && (
          <PlanSelection
            onSelect={(plan) => {
              console.log("selected Career", plan);
              setSelectedPlan(plan);
              setStep('view-plan'); 
            }}
          />
        )}

        {step === 'view-plan' && selectedPlan && (
          <PlanVisualizationStudent
            plan={selectedPlan}
            onContinue={(subjects) => {
              setIdealSubjects(subjects);
              setStep('input-history');
            }}
          />
        )}

        {step === 'input-history' && selectedPlan && (
          <HistoryInput
            history={history}
            idealSubjects={idealSubjects}
            plan = {selectedPlan}
            onContinue={(hist,discrep) => {
              setHistory(hist);
              setDiscrepancies(discrep);
              setStep('justifications');
            }}
          />
        )}

        {step === 'justifications' && (
          <JustificationsInput
            discrepancies={discrepancies}
            onSubmit={(justs, images) => {
              //setJustifications(justs);
              console.log(justs);
              handleSubmit(justs, images);
            }}
            onBack={()=>{setStep('input-history')}}
          />
        )}

        {isSubmitting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-lg font-semibold">Enviando solicitud...</p>
                <p className="text-sm text-muted-foreground">Por favor espera</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}