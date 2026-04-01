// Tipos de datos actualizados para el sistema académico

export interface Subject {
  idSubject: string;
  code: string;
  name: string;
  idealPeriod: number;
  prerequisites: string[];
  credits?: number;
}

export interface Career {
  idCareer: number;
  careerName: string;
  careerCode: string;
  facultyName: string;
  descripttion? : string;
  yearLength: number;
  totalPeriods: number;
  isActive : boolean;
  Subjects: Subject[];
  StudentCareer? : StudentCareer;
}

// export interface AcademicHistory {
//   subjectId: string;
//   periodTaken: number;
//   status: 'approved' | 'failed' | 'in-progress';
//   grade?: number;
// }

export interface Discrepancy {
  idDiscrepancy: string;
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

export interface StudentCareer {
  idStudentCareer : number;
  idStudent: number;
  idCareer: number;
  Student?: Student;
  Career?: Career;
}

export interface User {
  idUser: string;
  email: string;
  name: string;
  role: 'student' | 'employee';
  isActive: boolean;
  isVerified: boolean;
  accountNumber?: string;
  employeeCode?: string;
}

export interface Student {
  idStudent :number;
  accountNumber : string;
  enrollmentDate : Date;
  currentPeriod: number;
  Careers?: Career[];
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
