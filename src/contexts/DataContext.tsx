import { createContext, useContext, useState, ReactNode } from 'react';
import type { OfficialPlan, Request } from '@/types/academic';

interface DataContextType {
  officialPlans: OfficialPlan[];
  requests: Request[];
  addRequest: (request: Request) => void;
  updateRequest: (id: string, updates: Partial<Request>) => void;
  getRequestById: (id: string) => Request | undefined;
  getRequestsByStudent: (studentId: string) => Request[];
  getPendingRequests: () => Request[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Planes oficiales pre-cargados por carrera
const OFFICIAL_PLANS: OfficialPlan[] = [
  {
    id: 'plan-1',
    careerName: 'Ingeniería en Sistemas',
    careerCode: 'ISC',
    totalPeriods: 10,
    subjects: [
      { id: '1', code: 'MAT101', name: 'Cálculo I', idealPeriod: 1, prerequisites: [], credits: 4 },
      { id: '2', code: 'PRG101', name: 'Programación I', idealPeriod: 1, prerequisites: [], credits: 4 },
      { id: '3', code: 'MAT102', name: 'Cálculo II', idealPeriod: 2, prerequisites: ['1'], credits: 4 },
      { id: '4', code: 'PRG102', name: 'Programación II', idealPeriod: 2, prerequisites: ['2'], credits: 4 },
      { id: '5', code: 'EST101', name: 'Estructura de Datos', idealPeriod: 3, prerequisites: ['4'], credits: 4 },
      { id: '6', code: 'BDD101', name: 'Bases de Datos', idealPeriod: 3, prerequisites: ['4'], credits: 4 },
      { id: '7', code: 'ALG101', name: 'Algoritmos', idealPeriod: 4, prerequisites: ['5'], credits: 4 },
      { id: '8', code: 'WEB101', name: 'Desarrollo Web', idealPeriod: 4, prerequisites: ['6'], credits: 4 },
      { id: '9', code: 'ARQ101', name: 'Arquitectura de Software', idealPeriod: 5, prerequisites: ['7'], credits: 4 },
      { id: '10', code: 'RED101', name: 'Redes de Computadoras', idealPeriod: 5, prerequisites: [], credits: 4 },
    ],
  },
  {
    id: 'plan-2',
    careerName: 'Ingeniería Industrial',
    careerCode: 'IND',
    totalPeriods: 10,
    subjects: [
      { id: '11', code: 'MAT101', name: 'Cálculo I', idealPeriod: 1, prerequisites: [], credits: 4 },
      { id: '12', code: 'FIS101', name: 'Física I', idealPeriod: 1, prerequisites: [], credits: 4 },
      { id: '13', code: 'EST201', name: 'Estadística', idealPeriod: 2, prerequisites: ['11'], credits: 4 },
      { id: '14', code: 'PRO101', name: 'Procesos Industriales', idealPeriod: 2, prerequisites: [], credits: 4 },
      { id: '15', code: 'OPE101', name: 'Investigación de Operaciones', idealPeriod: 3, prerequisites: ['13'], credits: 4 },
      { id: '16', code: 'CAL101', name: 'Control de Calidad', idealPeriod: 4, prerequisites: ['13'], credits: 4 },
    ],
  },
  {
    id: 'plan-3',
    careerName: 'Administración de Empresas',
    careerCode: 'ADE',
    totalPeriods: 8,
    subjects: [
      { id: '21', code: 'ADM101', name: 'Introducción a la Administración', idealPeriod: 1, prerequisites: [], credits: 3 },
      { id: '22', code: 'ECO101', name: 'Economía I', idealPeriod: 1, prerequisites: [], credits: 3 },
      { id: '23', code: 'CON101', name: 'Contabilidad', idealPeriod: 2, prerequisites: [], credits: 3 },
      { id: '24', code: 'MAR101', name: 'Marketing', idealPeriod: 3, prerequisites: ['21'], credits: 3 },
      { id: '25', code: 'FIN101', name: 'Finanzas', idealPeriod: 3, prerequisites: ['23'], credits: 3 },
    ],
  },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<Request[]>([]);

  const addRequest = (request: Request) => {
    setRequests(prev => [...prev, request]);
  };

  const updateRequest = (id: string, updates: Partial<Request>) => {
    setRequests(prev =>
      prev.map(req => (req.id === id ? { ...req, ...updates } : req))
    );
  };

  const getRequestById = (id: string) => {
    return requests.find(req => req.id === id);
  };

  const getRequestsByStudent = (studentId: string) => {
    return requests.filter(req => req.studentId === studentId);
  };

  const getPendingRequests = () => {
    return requests.filter(req => req.status === 'pending' || req.status === 'in-review');
  };

  return (
    <DataContext.Provider
      value={{
        officialPlans: OFFICIAL_PLANS,
        requests,
        addRequest,
        updateRequest,
        getRequestById,
        getRequestsByStudent,
        getPendingRequests,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
