// Tipos de datos actualizados para el sistema académico

export interface Subject {
  idSubject: string;
  subjectCode: string;
  subjectName: string;
  idealPeriod: number;
  Prerequisites: Subject[];
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
  Subjects?: Subject[];
  StudentCareer? : StudentCareer;
}

// export interface AcademicHistory {
//   subjectId: string;
//   periodTaken: number;
//   status: 'approved' | 'failed' | 'in-progress';
//   grade?: number;
// }


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
  role: 'student' | 'employee' | 'admin';
  isActive: boolean;
  isVerified: boolean;
  idRole?: number;
  idStudent?: number;
  idEmployee?: number;
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


