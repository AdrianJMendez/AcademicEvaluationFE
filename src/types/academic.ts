// Tipos de datos actualizados para el sistema académico

export interface Subject {
  id: string;
  code: string;
  name: string;
  idealPeriod: number;
  prerequisites: string[];
  credits?: number;
}

export interface OfficialPlan {
  id: string;
  careerName: string;
  careerCode: string;
  totalPeriods: number;
  subjects: Subject[];
}

export interface AcademicHistory {
  subjectId: string;
  periodTaken: number;
  status: 'approved' | 'failed' | 'in-progress';
  grade?: number;
}

export interface Discrepancy {
  id: string;
  type: 'delay' | 'prerequisite-skip' | 'order-change';
  subjectId: string;
  subjectName: string;
  expectedPeriod: number;
  actualPeriod: number;
  description: string;
}

export interface Justification {
  discrepancyId: string;
  title: string;
  description: string;
  impactLevel?: 'no-impact' | 'low-impact' | 'high-impact'; // Asignado por el empleado
  documents: File[];
  images: File[];
  employeeComments?: string;
  employeeDocuments?: File[];
}

export type RequestStatus = 'pending' | 'in-review' | 'reviewed';

export interface Request {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  careerId: string;
  careerName: string;
  officialPlan: OfficialPlan;
  studentHistory: AcademicHistory[];
  discrepancies: Discrepancy[];
  justifications: Justification[];
  status: RequestStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  finalScore?: number;
  generatedReport?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'employee';
  studentCode?: string;
  employeeId?: string;
}

export interface ScoreResult {
  finalScore: number;
  totalDelay: number;
  discrepanciesCount: number;
  breakdown: {
    baseScore: number;
    delayPenalty: number;
    impactAdjustment: number;
  };
}
