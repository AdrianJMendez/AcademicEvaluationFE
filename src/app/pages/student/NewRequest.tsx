import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
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
  const { addRequest } = useData();
  const [step, setStep] = useState<Step>('select-career');
  const [selectedPlan, setSelectedPlan] = useState<Career | null>(null);
  const [idealSubjects, setIdealSubjects] = useState<Subject[] | undefined>();
  const [history, setHistory] = useState<ParsedSubject[]>([]);
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyProp[]>([]);
  const [justifications, setJustifications] = useState<JustificationProp[]>([]);

  const handleSubmit = (justs: JustificationProp[]) => {
    if (!selectedPlan || !user) return;

    setJustifications(justs);

    const payload = {
      idStudentCareer: selectedPlan.StudentCareer?.idStudentCareer,
      discrepancies,
      justifications: justs,
    };

    console.log(payload);

    requestService.createRequest(payload).then((response)=>{
      if(!response.hasError){
        toast.success('Solicitud enviada correctamente');
        navigate('/student');
      }else{
        toast.error(response.meta.message);
      }
    });
    
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
            onSubmit={(justs) => {
              //setJustifications(justs);
              console.log(justs);
              handleSubmit(justs);
            }}
            onBack={()=>{setStep('input-history')}}
          />
        )}
      </div>
    </div>
  );
}