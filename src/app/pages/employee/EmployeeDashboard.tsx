import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import requestService from '@/services/request.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { BriefcaseBusiness, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Eye, Loader2, LogOut, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { EmployeeRequestCounts, EmployeeRequestStatusName, EmployeeRequestSummary } from '@/types/request';

const PAGE_SIZE = 6;

const EMPTY_COUNTS: EmployeeRequestCounts = {
  pending: 0,
  inReview: 0,
  reviewed: 0,
};

type EmployeeBucketStatus = 'pending' | 'in-review' | 'reviewed';
type RequestBuckets = Record<EmployeeBucketStatus, EmployeeRequestSummary[]>;
type PageByStatus = Record<EmployeeBucketStatus, number>;

const EMPTY_BUCKETS: RequestBuckets = {
  pending: [],
  'in-review': [],
  reviewed: [],
};

const INITIAL_PAGES: PageByStatus = {
  pending: 1,
  'in-review': 1,
  reviewed: 1,
};

const statusMeta: Record<
  EmployeeBucketStatus,
  {
    label: string;
    helper: string;
    icon: typeof Clock3;
    badgeClass: string;
    countKey: keyof EmployeeRequestCounts;
  }
> = {
  pending: {
    label: 'Pendientes',
    helper: 'Disponibles para tomar',
    icon: Clock3,
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    countKey: 'pending',
  },
  'in-review': {
    label: 'En revision',
    helper: 'En revision por un empleado',
    icon: Eye,
    badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
    countKey: 'inReview',
  },
  reviewed: {
    label: 'Revisadas',
    helper: 'Con nota calculada',
    icon: CheckCircle2,
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    countKey: 'reviewed',
  },
};

export function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatus, setActiveStatus] = useState<EmployeeBucketStatus>('pending');
  const [counts, setCounts] = useState<EmployeeRequestCounts>(EMPTY_COUNTS);
  const [requests, setRequests] = useState<RequestBuckets>(EMPTY_BUCKETS);
  const [pages, setPages] = useState<PageByStatus>(INITIAL_PAGES);
  const [isCountsLoading, setIsCountsLoading] = useState(true);
  const [isListLoading, setIsListLoading] = useState(true);
  const [takingRequestId, setTakingRequestId] = useState<number | null>(null);

  const currentPage = pages[activeStatus];
  const totalItemsForActiveStatus = counts[statusMeta[activeStatus].countKey];
  const totalPages = Math.max(1, Math.ceil(totalItemsForActiveStatus / PAGE_SIZE));

  const visiblePages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, currentPage - 1, currentPage, currentPage + 1, totalPages];
  }, [currentPage, totalPages]);

  const loadCounts = async () => {
    setIsCountsLoading(true);

    try {
      const response = await requestService.getEmployeeCounts();

      if (response?.hasError) {
        toast.error(response.meta.message);
        return;
      }

      setCounts(response.data ?? EMPTY_COUNTS);
    } finally {
      setIsCountsLoading(false);
    }
  };

  const loadActiveList = async (status: EmployeeBucketStatus, page: number) => {
    setIsListLoading(true);

    try {
      const response = await requestService.getEmployeeRequestsByStatus(status, {
        page,
        size: PAGE_SIZE,
      });

      if (response?.hasError) {
        toast.error(response.meta.message);
        setRequests((prev) => ({
          ...prev,
          [status]: [],
        }));
        return;
      }

      setRequests((prev) => ({
        ...prev,
        [status]: response.data ?? [],
      }));
    } finally {
      setIsListLoading(false);
    }
  };

  useEffect(() => {
    void loadCounts();
  }, []);

  useEffect(() => {
    void loadActiveList(activeStatus, currentPage);
  }, [activeStatus, currentPage]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTakeRequest = async (idRequest: number) => {
    setTakingRequestId(idRequest);

    try {
      const response = await requestService.takeEmployeeRequest(idRequest);

      if (response?.hasError) {
        toast.error(response.meta.message);
        return;
      }

      toast.success('La solicitud fue tomada correctamente.');
      navigate(`/employee/review/${idRequest}`);
    } finally {
      setTakingRequestId(null);
    }
  };

  const currentItems = requests[activeStatus];
  const filteredItems = currentItems.filter((request) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return true;
    }

    return [
      request.student?.name ?? '',
      request.student?.accountNumber ?? '',
      request.student?.email ?? '',
      request.career?.careerName ?? '',
      request.career?.careerCode ?? '',
      request.reviewer?.name ?? '',
    ].some((value) => value.toLowerCase().includes(normalizedSearch));
  });

  const renderPageButton = (page: number) => (
    <Button
      key={page}
      type="button"
      variant={page === currentPage ? 'default' : 'outline'}
      size="sm"
      onClick={() => setPages((prev) => ({ ...prev, [activeStatus]: page }))}
      className="min-w-9"
    >
      {page}
    </Button>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.04),_transparent_35%),linear-gradient(180deg,_#fafaf9_0%,_#ffffff_55%,_#f8fafc_100%)]">
      <div className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
              <BriefcaseBusiness className="size-6 text-slate-700" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">Panel del Empleado</h1>
              <p className="text-sm text-slate-500">
                {user?.name ?? 'Empleado'} {user?.employeeCode ? `| ${user.employeeCode}` : ''}
              </p>
            </div>
          </div>

          <Button onClick={handleLogout} variant="outline" className="rounded-xl">
            <LogOut className="mr-2 size-4" />
            Cerrar sesion
          </Button>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
        <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              <Badge variant="outline" className="rounded-full border-slate-200 px-3 py-1 text-slate-600">
                Revision administrativa
              </Badge>
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Revision de solicitudes de evaluacion para recibir honores academicos.
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-slate-500">
                  En este panel podras gestionar las solicitudes de los estudiantes para la revision de su historial academico con el fin de determinar su elegibilidad para honores academicos. 
                  Revisa cada solicitud, toma las que desees evaluar y avanza al detalle para analizar su historial, verificar discrepancias y justificar decisiones. 
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {(['pending', 'in-review', 'reviewed'] as EmployeeBucketStatus[]).map((status) => {
                const meta = statusMeta[status];
                const Icon = meta.icon;

                return (
                  <div key={status} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className={`rounded-xl border px-2.5 py-2 ${meta.badgeClass}`}>
                        <Icon className="size-4" />
                      </div>
                      <span className="text-2xl font-semibold text-slate-900">
                        {isCountsLoading ? '-' : counts[meta.countKey]}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{meta.label}</p>
                    <p className="text-xs text-slate-500">{meta.helper}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="gap-4 border-b border-slate-100 pb-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle className="text-xl tracking-tight text-slate-900">Bandeja de solicitudes</CardTitle>
                
              </div>

              <div className="relative w-full lg:max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por estudiante, cuenta o carrera..."
                  className="rounded-2xl border-slate-200 bg-slate-50 pl-10"
                />
              </div>
            </div>

            <Tabs value={activeStatus} onValueChange={(value) => setActiveStatus(value as EmployeeBucketStatus)}>
              <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl bg-slate-100 p-1">
                {(['pending', 'in-review', 'reviewed'] as EmployeeBucketStatus[]).map((status) => (
                  <TabsTrigger
                    key={status}
                    value={status}
                    className="rounded-2xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">{statusMeta[status].label}</p>
                      <p className="text-xs text-slate-500">{counts[statusMeta[status].countKey]} registro(s)</p>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{statusMeta[activeStatus].label}</p>
                <p className="text-xs text-slate-500">
                  Pagina {currentPage} de {totalPages}
                </p>
              </div>
              <Badge variant="outline" className={`rounded-full px-3 py-1 ${statusMeta[activeStatus].badgeClass}`}>
                {statusMeta[activeStatus].helper}
              </Badge>
            </div>

            {isListLoading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 className="size-8 animate-spin text-slate-500" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-16 text-center">
                <p className="text-base font-medium text-slate-700">No hay solicitudes para mostrar.</p>
                <p className="mt-2 text-sm text-slate-500">
                  Cambia de bandeja o ajusta la busqueda para seguir revisando.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map((request) => (
                  <div
                    key={request.idRequest}
                    className="group rounded-3xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                            {request.student?.name ?? 'Estudiante sin nombre'}
                          </h3>
                          <Badge variant="outline" className={`rounded-full ${statusMeta[activeStatus].badgeClass}`}>
                            {statusMeta[activeStatus].label}
                          </Badge>
                        </div>

                        <div className="grid gap-3 text-sm text-slate-500 md:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Cuenta</p>
                            <p className="mt-1 font-medium text-slate-700">
                              {request.student?.accountNumber ?? 'No disponible'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Carrera</p>
                            <p className="mt-1 font-medium text-slate-700">
                              {request.career?.careerName ?? 'No disponible'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Fecha</p>
                            <p className="mt-1 font-medium text-slate-700">
                              {new Date(request.submittedAt).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Carga</p>
                            <p className="mt-1 font-medium text-slate-700">
                              {request.discrepancyCount} discrepancia(s) | {request.justificationCount} justificacion(es)
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                          <span>Correo: {request.student?.email ?? 'No disponible'}</span>
                          {activeStatus === 'in-review' && request.reviewer && (
                            <span>
                              Tomada por {request.reviewer.name ?? 'Empleado'} ({request.reviewer.employeeCode})
                            </span>
                          )}
                          {activeStatus === 'reviewed' && (
                            <span className="font-medium text-emerald-700">
                              Nota final: {request.finalScore ?? 'Sin nota'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row xl:flex-col">
                        {activeStatus === 'pending' ? (
                          <Button
                            onClick={() => void handleTakeRequest(request.idRequest)}
                            disabled={takingRequestId === request.idRequest}
                            className="rounded-2xl"
                          >
                            {takingRequestId === request.idRequest ? (
                              <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Tomando...
                              </>
                            ) : (
                              'Tomar y revisar'
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="rounded-2xl"
                            onClick={() => navigate(`/employee/review/${request.idRequest}`)}
                          >
                            Abrir detalle
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={currentPage <= 1}
                  onClick={() =>
                    setPages((prev) => ({ ...prev, [activeStatus]: Math.max(1, prev[activeStatus] - 1) }))
                  }
                >
                  <ChevronLeft className="mr-1 size-4" />
                  Anterior
                </Button>

                <div className="flex flex-wrap items-center gap-2">
                  {visiblePages.map((page, index) => {
                    const previousPage = visiblePages[index - 1];
                    const shouldRenderGap = previousPage && page - previousPage > 1;

                    return (
                      <div key={page} className="flex items-center gap-2">
                        {shouldRenderGap && <span className="px-1 text-sm text-slate-400">...</span>}
                        {renderPageButton(page)}
                      </div>
                    );
                  })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setPages((prev) => ({
                      ...prev,
                      [activeStatus]: Math.min(totalPages, prev[activeStatus] + 1),
                    }))
                  }
                >
                  Siguiente
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
