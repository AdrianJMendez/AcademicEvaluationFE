export interface LoginApiUser {
  idUser: number;
  email: string;
  name: string;
  role: string;
}
export interface StudentData {
  accountNumber: string;
  enrollmentDate: Date;
  currentPeriod: number;
}

export interface EmployeeData {
  employeeCode: string;
  department: string;
  position: string;
  hireDate: Date;
}

export interface RegisterUserProp {
  name: string;
  email: string;
  password: string;
  idRole: number;
  studentData?: StudentData;
  employeeData?: EmployeeData;
}

export interface LoginApiUser {
  id: number;
  email: string;
  name: string;
  role: 'student' | 'employee';
  // otros campos según tu API
}