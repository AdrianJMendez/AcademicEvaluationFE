import { StudentCareer } from "./academic";

export interface DiscrepancyProp {
  type: string;
  description: string;
  severity: string;
}

export interface JustificationProp {
    idDiscrepancyProp: number,
    title : string,
    description: string;
}

export interface Discrepancy {
  idDiscrepancy?: string;
  type: string;
  expectedPeriod?: number;
  actualPeriod?: number;
  description: string;
  severity: string;
}

export interface Justification {
  idDiscrepancy: string;
  title: string;
  description: string;
  impactLevel?: 'no-impact' | 'low-impact' | 'high-impact'; // Asignado por el empleado
  documents: File[];
  images: File[];
  employeeComments?: string;
  employeeDocuments?: File[];
}

//export type RequestStatus = 'pending' | 'in-review' | 'reviewed';

export interface Status {
  idStatus : number;
  statusName : string;
  idStatusType: number;
}

export interface Request {
  idRequest: number;
  idStudentCareer: number;
  idStatus: number;
  discrepancies?: Discrepancy[];
  justifications?: Justification[];
  submittedAt: Date;
  reviewedAt?: Date;
  idEmployeeReviewer?: number;
  finalScore?: number;
  generatedReportUrl?: string;
  notes?: string;
  StudentCareer?: StudentCareer;
  Status?: Status;
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