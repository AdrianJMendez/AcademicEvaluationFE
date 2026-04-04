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

export type EmployeeRequestStatusName = 'pending' | 'in-review' | 'reviewed' | 'all';

export interface EmployeeRequestStatus {
  idStatus: number;
  statusName: 'pending' | 'in-review' | 'reviewed';
}

export interface EmployeeRequestStudent {
  idStudent: number;
  name: string | null;
  email: string | null;
  accountNumber: string;
  currentPeriod: number | null;
  enrollmentDate?: string | Date | null;
}

export interface EmployeeRequestCareer {
  idCareer: number;
  careerName: string;
  careerCode: string;
  facultyName: string | null;
  totalPeriods?: number;
  yearLength?: number;
}

export interface EmployeeReviewer {
  idEmployee: number;
  employeeCode: string;
  name: string | null;
  email: string | null;
  department?: string | null;
  position?: string | null;
}

export interface EmployeeRequestJustification {
  idJustification: number;
  title: string | null;
  description: string | null;
  impactLevel: 'no-impact' | 'low-impact' | 'high-impact' | null;
  employeeComments: string | null;
  submittedAt: string | Date;
  reviewedAt: string | Date | null;
}

export interface EmployeeRequestDiscrepancy {
  idDiscrepancy: number;
  expectedPeriod: number | null;
  actualPeriod: number | null;
  periodDifference?: number | null;
  description: string | null;
  severity: string | null;
  detectedAt: string | Date;
  discrepancyType: {
    idDiscrepancyType: number;
    typeName: string;
  } | null;
  justifications: EmployeeRequestJustification[];
}

export interface EmployeeScoreCalculation {
  idScoreCalculation: number;
  baseScore: number;
  totalDelay: number;
  delayPenalty: number;
  impactAdjustment: number;
  finalScore: number;
  discrepanciesCount: number;
  calculatedAt: string | Date;
}

export interface EmployeeRequestSummary {
  idRequest: number;
  submittedAt: string | Date;
  reviewedAt: string | Date | null;
  finalScore: number | null;
  status: EmployeeRequestStatus | null;
  student: EmployeeRequestStudent | null;
  career: EmployeeRequestCareer | null;
  reviewer: EmployeeReviewer | null;
  discrepancyCount: number;
  justificationCount: number;
}

export interface EmployeeRequestDetail {
  idRequest: number;
  submittedAt: string | Date;
  reviewedAt: string | Date | null;
  finalScore: number | null;
  generatedReportUrl: string | null;
  notes: string | null;
  status: EmployeeRequestStatus | null;
  student: EmployeeRequestStudent | null;
  career: EmployeeRequestCareer | null;
  reviewer: EmployeeReviewer | null;
  discrepancies: EmployeeRequestDiscrepancy[];
  scoreCalculation: EmployeeScoreCalculation | null;
}

export interface EmployeeRequestCounts {
  pending: number;
  inReview: number;
  reviewed: number;
}

export interface EmployeeRequestListParams {
  page?: number;
  size?: number;
}

export interface ReviewJustificationPayload {
  idJustification: number;
  impactLevel: 'no-impact' | 'low-impact' | 'high-impact';
  employeeComments?: string;
}
