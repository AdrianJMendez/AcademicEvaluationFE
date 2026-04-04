import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import requestService from '@/services/request.service';
import careerService from '@/services/career.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/app/components/ui/sheet';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  LockKeyhole,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Career } from '@/types/academic';
import type {
  EmployeeRequestDetail,
  EmployeeRequestDiscrepancy,
  EmployeeRequestJustification,
  ReviewJustificationPayload,
} from '@/types/request';

type EditableJustification = {
  idJustification: number;
  title: string | null;
  description: string | null;
  impactLevel: 'no-impact' | 'low-impact' | 'high-impact' | null;
  employeeComments: string;
};

type ReviewStep = EmployeeRequestJustification & {
  discrepancies: EmployeeRequestDiscrepancy[];
};

const statusLabels = {
  pending: 'Pendiente',
  'in-review': 'En revision',
  reviewed: 'Revisada',
} as const;

const impactLabels = {
  'no-impact': 'Sin afectacion',
  'low-impact': 'Afectacion baja',
  'high-impact': 'Afectacion alta',
} as const;

function buildJustificationMap(requestDetail: EmployeeRequestDetail) {
  const nextMap: Record<number, EditableJustification> = {};

  for (const discrepancy of requestDetail.discrepancies) {
    for (const justification of discrepancy.justifications) {
      if (!nextMap[justification.idJustification]) {
        nextMap[justification.idJustification] = {
          idJustification: justification.idJustification,
          title: justification.title,
          description: justification.description,
          impactLevel: justification.impactLevel,
          employeeComments: justification.employeeComments ?? '',
        };
      }
    }
  }

  return nextMap;
}

function buildReviewSteps(requestDetail: EmployeeRequestDetail): ReviewStep[] {
  const stepMap = new Map<number, ReviewStep>();

  for (const discrepancy of requestDetail.discrepancies) {
    for (const justification of discrepancy.justifications) {
      const existing = stepMap.get(justification.idJustification);

      if (!existing) {
        stepMap.set(justification.idJustification, {
          ...justification,
          discrepancies: [discrepancy],
        });
        continue;
      }

      if (!existing.discrepancies.some((item) => item.idDiscrepancy === discrepancy.idDiscrepancy)) {
        existing.discrepancies.push(discrepancy);
      }
    }
  }

  return Array.from(stepMap.values());
}

function groupSubjectsByPeriod(plan: Career | null) {
  if (!plan?.Subjects?.length) {
    return [];
  }

  const grouped = plan.Subjects.reduce<Record<number, Career['Subjects']>>((acc, subject) => {
    const period = subject.idealPeriod;

    if (!acc[period]) {
      acc[period] = [];
    }

    acc[period].push(subject);
    return acc;
  }, {});

  return Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b));
}

export function ReviewRequest() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [request, setRequest] = useState<EmployeeRequestDetail | null>(null);
  const [editableJustifications, setEditableJustifications] = useState<Record<number, EditableJustification>>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaking, setIsTaking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [careerPlan, setCareerPlan] = useState<Career | null>(null);

  const loadRequest = async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await requestService.getEmployeeRequestDetail(id);

      if (response?.hasError) {
        toast.error(response.meta.message);
        setRequest(null);
        return;
      }

      setRequest(response.data);
      setEditableJustifications(buildJustificationMap(response.data));
      setCurrentStepIndex(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRequest();
  }, [id]);

  const reviewSteps = useMemo(() => (request ? buildReviewSteps(request) : []), [request]);
  const currentStep = reviewSteps[currentStepIndex] ?? null;
  const subjectsByPeriod = useMemo(() => groupSubjectsByPeriod(careerPlan), [careerPlan]);

  const updateJustification = (
    idJustification: number,
    updates: Partial<Pick<EditableJustification, 'impactLevel' | 'employeeComments'>>,
  ) => {
    setEditableJustifications((prev) => ({
      ...prev,
      [idJustification]: {
        ...prev[idJustification],
        ...updates,
      },
    }));
  };

  const openCareerPlan = async () => {
    if (!request?.career?.idCareer) {
      return;
    }

    setIsPlanOpen(true);

    if (careerPlan) {
      return;
    }

    setIsPlanLoading(true);

    try {
      const response = await careerService.getCareerPlanById(request.career.idCareer);

      if (response?.hasError) {
        toast.error(response.meta.message);
        return;
      }

      setCareerPlan(response.data ?? null);
    } finally {
      setIsPlanLoading(false);
    }
  };

  const handleTakeRequest = async () => {
    if (!id) {
      return;
    }

    setIsTaking(true);

    try {
      const response = await requestService.takeEmployeeRequest(id);

      if (response?.hasError) {
        toast.error(response.meta.message);
        return;
      }

      toast.success('La solicitud fue tomada correctamente.');
      setRequest(response.data);
      setEditableJustifications(buildJustificationMap(response.data));
      setCurrentStepIndex(0);
    } finally {
      setIsTaking(false);
    }
  };

  const handleFinishReview = async () => {
    if (!id || !request) {
      return;
    }

    const payload: ReviewJustificationPayload[] = Object.values(editableJustifications).map((justification) => ({
      idJustification: justification.idJustification,
      impactLevel: justification.impactLevel as ReviewJustificationPayload['impactLevel'],
      employeeComments: justification.employeeComments || undefined,
    }));

    setIsSaving(true);

    try {
      const response = await requestService.finishEmployeeReview(id, payload, request.notes ?? undefined);

      if (response?.hasError) {
        toast.error(response.meta.message);
        return;
      }

      toast.success('La revision se finalizo correctamente.');
      setRequest(response.data);
      setEditableJustifications(buildJustificationMap(response.data));
      setCurrentStepIndex(0);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#fafaf9_0%,_#ffffff_55%,_#f8fafc_100%)]">
        <Loader2 className="size-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#fafaf9_0%,_#ffffff_55%,_#f8fafc_100%)]">
        <Card className="w-full max-w-md rounded-3xl">
          <CardHeader>
            <CardTitle>Solicitud no encontrada</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/employee')} className="w-full rounded-2xl">
              Volver al panel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const requestStatus = request.status?.statusName ?? 'pending';
  const reviewerOwnsRequest = request.reviewer?.idEmployee === user?.idEmployee;
  const canTakeRequest = requestStatus === 'pending';
  const canReviewRequest = requestStatus === 'in-review' && reviewerOwnsRequest;
  const reviewedCount = Object.values(editableJustifications).filter((item) => Boolean(item.impactLevel)).length;
  const totalSteps = reviewSteps.length;
  const allJustificationsReviewed =
    totalSteps === 0 || Object.values(editableJustifications).every((item) => Boolean(item.impactLevel));

  return (
    <>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.04),_transparent_35%),linear-gradient(180deg,_#fafaf9_0%,_#ffffff_55%,_#f8fafc_100%)]">
        <div className="border-b bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5">
            <Button onClick={() => navigate('/employee')} variant="ghost" className="rounded-2xl">
              <ArrowLeft className="mr-2 size-4" />
              Volver al panel
            </Button>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-full border-slate-200 px-3 py-1 text-slate-600">
                Solicitud #{request.idRequest}
              </Badge>
              <Badge variant="outline" className="rounded-full border-slate-200 px-3 py-1 text-slate-600">
                {statusLabels[requestStatus]}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
          <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <Badge variant="outline" className="rounded-full border-slate-200 px-3 py-1 text-slate-600">
                  Revision guiada
                </Badge>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                    {request.student?.name ?? 'Estudiante sin nombre'}
                  </h1>
                  <p className="text-sm leading-6 text-slate-500">
                    {request.student?.accountNumber ?? 'Sin cuenta'} | {request.career?.careerName ?? 'Carrera no disponible'}
                  </p>
                </div>

                <div className="grid gap-3 text-sm text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Correo</p>
                    <p className="mt-2 font-medium text-slate-800">{request.student?.email ?? 'No disponible'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Periodo actual</p>
                    <p className="mt-2 font-medium text-slate-800">{request.student?.currentPeriod ?? 'No disponible'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Enviada</p>
                    <p className="mt-2 font-medium text-slate-800">
                      {new Date(request.submittedAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Evaluador</p>
                    <p className="mt-2 font-medium text-slate-800">
                      {request.reviewer?.name
                        ? `${request.reviewer.name} (${request.reviewer.employeeCode})`
                        : 'Sin asignar'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Sparkles className="size-5" />
                    <p className="font-medium">Resumen de revision</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Discrepancias</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{request.discrepancies.length}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Justificaciones</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{totalSteps}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Revisadas</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{reviewedCount}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button variant="outline" className="rounded-2xl" onClick={() => void openCareerPlan()}>
                    <BookOpen className="mr-2 size-4" />
                    Ver plan de estudio original
                  </Button>

                  {requestStatus === 'reviewed' && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                      <p className="font-medium">Revision completada</p>
                      <p className="mt-1">
                        Nota final: <span className="text-xl font-semibold">{request.finalScore ?? '-'}</span>
                      </p>
                      {request.scoreCalculation && (
                        <p className="mt-2 text-xs">
                          Retraso total: {request.scoreCalculation.totalDelay} | Penalizacion:{' '}
                          {request.scoreCalculation.delayPenalty} | Ajuste: {request.scoreCalculation.impactAdjustment}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {canTakeRequest && (
            <Card className="rounded-3xl border-amber-200 bg-amber-50 shadow-sm">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="size-5 text-amber-700" />
                  <div>
                    <p className="font-medium text-amber-900">Esta solicitud aun no ha sido tomada.</p>
                    <p className="text-sm text-amber-800">Al tomarla quedara bloqueada para los demas empleados.</p>
                  </div>
                </div>

                <Button onClick={() => void handleTakeRequest()} disabled={isTaking} className="rounded-2xl">
                  {isTaking ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Tomando...
                    </>
                  ) : (
                    'Tomar solicitud'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {requestStatus === 'in-review' && !reviewerOwnsRequest && request.reviewer && (
            <Card className="rounded-3xl border-sky-200 bg-sky-50 shadow-sm">
              <CardContent className="flex items-center gap-3 p-5">
                <UserRoundCheck className="size-5 text-sky-700" />
                <p className="text-sm text-sky-900">
                  Esta solicitud esta siendo revisada por {request.reviewer.name ?? 'otro empleado'} ({request.reviewer.employeeCode}).
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-5">
                <CardTitle className="text-xl tracking-tight text-slate-900">Navegacion por justificacion</CardTitle>
                <CardDescription className="text-slate-500">
                  Avanza paso a paso para revisar cada justificacion con sus discrepancias relacionadas.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 p-6">
                {totalSteps === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center">
                    <FileText className="mx-auto mb-3 size-6 text-slate-400" />
                    <p className="font-medium text-slate-700">No hay justificaciones asociadas.</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Puedes revisar las discrepancias registradas y finalizar la solicitud cuando corresponda.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Justificacion {currentStepIndex + 1} de {totalSteps}
                          </p>
                          <p className="text-xs text-slate-500">
                            {reviewedCount} revisada(s) con parametro asignado
                          </p>
                        </div>
                        {currentStep && editableJustifications[currentStep.idJustification]?.impactLevel && (
                          <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">
                            {impactLabels[editableJustifications[currentStep.idJustification].impactLevel!]}
                          </Badge>
                        )}
                      </div>

                      <div className="h-2 rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-slate-900 transition-all"
                          style={{
                            width: `${totalSteps === 0 ? 0 : ((currentStepIndex + 1) / totalSteps) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl"
                        disabled={currentStepIndex === 0}
                        onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                      >
                        <ChevronLeft className="mr-2 size-4" />
                        Anterior
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl"
                        disabled={currentStepIndex >= totalSteps - 1}
                        onClick={() => setCurrentStepIndex((prev) => Math.min(totalSteps - 1, prev + 1))}
                      >
                        Siguiente
                        <ChevronRight className="ml-2 size-4" />
                      </Button>
                    </div>

                    <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
                      {reviewSteps.map((step, index) => {
                        const isActive = index === currentStepIndex;
                        const isReviewed = Boolean(editableJustifications[step.idJustification]?.impactLevel);

                        return (
                          <button
                            key={step.idJustification}
                            type="button"
                            onClick={() => setCurrentStepIndex(index)}
                            className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                              isActive
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-medium">{step.title ?? `Justificacion ${index + 1}`}</p>
                                <p className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                                  {step.discrepancies.length} discrepancia(s) asociada(s)
                                </p>
                              </div>
                              {isReviewed && (
                                <Badge
                                  variant="outline"
                                  className={`rounded-full ${
                                    isActive
                                      ? 'border-white/30 bg-white/10 text-white'
                                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  }`}
                                >
                                  Lista
                                </Badge>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-5">
                <CardTitle className="text-xl tracking-tight text-slate-900">
                  {currentStep ? currentStep.title ?? 'Justificacion del estudiante' : 'Discrepancias de la solicitud'}
                </CardTitle>
                <CardDescription className="text-slate-500">
                  {currentStep
                    ? 'Revisa esta justificacion y asigna el parametro de evaluacion correspondiente.'
                    : 'No hay justificaciones registradas para esta solicitud.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 p-6">
                {currentStep ? (
                  <>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                      <p className="text-sm font-medium text-slate-900">Descripcion del estudiante</p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {currentStep.description ?? 'Sin descripcion registrada.'}
                      </p>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
                      <div className="rounded-3xl border border-slate-200 p-5">
                        <Label className="mb-4 block text-sm font-medium text-slate-900">Parametro de evaluacion</Label>
                        <RadioGroup
                          value={editableJustifications[currentStep.idJustification]?.impactLevel ?? ''}
                          onValueChange={(value) =>
                            updateJustification(currentStep.idJustification, {
                              impactLevel: value as EditableJustification['impactLevel'],
                            })
                          }
                          disabled={!canReviewRequest}
                          className="space-y-3"
                        >
                          {(['no-impact', 'low-impact', 'high-impact'] as const).map((value) => (
                            <label
                              key={value}
                              htmlFor={`${value}-${currentStep.idJustification}`}
                              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                            >
                              <RadioGroupItem value={value} id={`${value}-${currentStep.idJustification}`} />
                              <span>{impactLabels[value]}</span>
                            </label>
                          ))}
                        </RadioGroup>
                      </div>

                      <div className="rounded-3xl border border-slate-200 p-5">
                        <Label htmlFor={`comments-${currentStep.idJustification}`} className="mb-4 block text-sm font-medium text-slate-900">
                          Comentarios del evaluador
                        </Label>
                        <Textarea
                          id={`comments-${currentStep.idJustification}`}
                          placeholder="Agrega comentarios sobre esta justificacion..."
                          value={editableJustifications[currentStep.idJustification]?.employeeComments ?? ''}
                          onChange={(event) =>
                            updateJustification(currentStep.idJustification, {
                              employeeComments: event.target.value,
                            })
                          }
                          disabled={!canReviewRequest}
                          rows={8}
                          className="rounded-2xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Discrepancias relacionadas</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Esta justificacion impacta directamente las siguientes discrepancias de la solicitud.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {currentStep.discrepancies.map((discrepancy) => (
                          <div key={discrepancy.idDiscrepancy} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-lg font-semibold tracking-tight text-slate-900">
                                  {discrepancy.discrepancyType?.typeName ?? 'Discrepancia sin tipo'}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  Periodo esperado: {discrepancy.expectedPeriod ?? '-'} | Periodo real: {discrepancy.actualPeriod ?? '-'} | Diferencia:{' '}
                                  {discrepancy.periodDifference ?? '-'}
                                </p>
                              </div>

                              <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-slate-700">
                                {discrepancy.severity ?? 'Sin severidad'}
                              </Badge>
                            </div>

                            <p className="text-sm leading-7 text-slate-600">
                              {discrepancy.description ?? 'Sin descripcion registrada.'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {request.discrepancies.map((discrepancy) => (
                      <div key={discrepancy.idDiscrepancy} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold tracking-tight text-slate-900">
                              {discrepancy.discrepancyType?.typeName ?? 'Discrepancia sin tipo'}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Periodo esperado: {discrepancy.expectedPeriod ?? '-'} | Periodo real: {discrepancy.actualPeriod ?? '-'} | Diferencia:{' '}
                              {discrepancy.periodDifference ?? '-'}
                            </p>
                          </div>

                          <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-slate-700">
                            {discrepancy.severity ?? 'Sin severidad'}
                          </Badge>
                        </div>

                        <p className="text-sm leading-7 text-slate-600">
                          {discrepancy.description ?? 'Sin descripcion registrada.'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {canReviewRequest && (
                  <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      {allJustificationsReviewed
                        ? 'Todo esta listo para finalizar la revision.'
                        : 'Debes asignar un parametro a cada justificacion antes de finalizar.'}
                    </p>

                    <Button
                      onClick={() => void handleFinishReview()}
                      disabled={!allJustificationsReviewed || isSaving}
                      className="rounded-2xl"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 size-4" />
                          Finalizar revision y generar nota
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Sheet open={isPlanOpen} onOpenChange={setIsPlanOpen}>
        <SheetContent side="right" className="w-full sm:max-w-3xl">
          <SheetHeader className="border-b border-slate-100">
            <SheetTitle>Plan de estudio original</SheetTitle>
            <SheetDescription>
              Visualiza el plan de estudio original de la carrera del estudiante para entender mejor las discrepancias y justificaciones registradas en esta solicitud.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-6 overflow-y-auto p-4">
            {isPlanLoading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 className="size-8 animate-spin text-slate-500" />
              </div>
            ) : !careerPlan ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center">
                <p className="font-medium text-slate-700">No se pudo cargar el plan de estudio.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Carrera</p>
                    <p className="mt-2 font-medium text-slate-800">{careerPlan.careerName}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Periodos</p>
                    <p className="mt-2 font-medium text-slate-800">{careerPlan.totalPeriods}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Asignaturas</p>
                    <p className="mt-2 font-medium text-slate-800">{careerPlan.Subjects?.length ?? 0}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {subjectsByPeriod.map(([period, subjects]) => (
                    <div key={period} className="rounded-3xl border border-slate-200 bg-white p-5">
                      <div className="mb-4">
                        <p className="text-lg font-semibold tracking-tight text-slate-900">Periodo {period}</p>
                        <p className="text-sm text-slate-500">{subjects?.length ?? 0} asignatura(s)</p>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {subjects?.map((subject) => (
                          <div key={subject.idSubject} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium text-slate-900">{subject.subjectCode}</p>
                                <p className="mt-1 text-sm text-slate-600">{subject.subjectName}</p>
                              </div>
                              {subject.credits && (
                                <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-slate-700">
                                  {subject.credits} CR
                                </Badge>
                              )}
                            </div>

                            <p className="mt-3 text-xs text-slate-500">
                              Prerrequisitos: {subject.Prerequisites?.length ?? 0}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
