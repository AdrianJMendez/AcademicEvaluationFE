import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { GraduationCap, Briefcase, Mail, Lock, User, Calendar, Hash, Building, Badge, CreditCard } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { toast } from 'sonner';
import { SHA256 } from 'crypto-js';
import authService from '../../../services/auth.service';
import type { RegisterUserProp, StudentData, EmployeeData } from '@/types/auth';
import { Career } from '../../../types/academic';
import publicService from '../../../services/public.service';
import { MultiSelect } from '@/app/components/ui/multi-select';

export function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'student' | 'employee'>('student');
  
  // Campos comunes
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Campos de estudiante
  const [accountNumber, setAccountNumber] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState('');
  const [currentPeriod, setCurrentPeriod] = useState('');
  const [careers, setCareers] = useState<Career[]>([]);
  const [selectedCareers, setSelectedCareers] = useState<string[]>([]); // Cambiado a array
  
  // Campos de empleado
  const [employeeCode, setEmployeeCode] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [hireDate, setHireDate] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones comunes
    if (!name || !email || !password) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    // Validaciones según rol
    if (activeTab === 'student') {
      if (!accountNumber || !enrollmentDate || !currentPeriod) {
        toast.error('Por favor complete todos los campos de estudiante');
        return;
      }
      
      if (selectedCareers.length === 0) {
        toast.error('Debe seleccionar al menos una carrera');
        return;
      }
      
      const periodNumber = parseInt(currentPeriod);
      if (isNaN(periodNumber) || periodNumber < 1 || periodNumber > 12) {
        toast.error('El período actual debe ser un número entre 1 y 12');
        return;
      }
    } else {
      if (!employeeCode || !department || !position || !hireDate) {
        toast.error('Por favor complete todos los campos de empleado');
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      const hashedPassword = SHA256(password).toString();
      
      const studentData: StudentData | undefined = activeTab === 'student' ? {
        accountNumber,
        enrollmentDate: new Date(enrollmentDate),
        currentPeriod: parseInt(currentPeriod),
        careers: selectedCareers // Enviar array de IDs
      } : undefined;
      
      const employeeData: EmployeeData | undefined = activeTab === 'employee' ? {
        employeeCode,
        department,
        position,
        hireDate: new Date(hireDate)
      } : undefined;
      
      const payload: RegisterUserProp = {
        name,
        email,
        password: hashedPassword,
        idRole: activeTab === 'student' ? 1 : 2,
        studentData,
        employeeData
      };
      
      const response = await authService.register(payload);
      if (!response.hasError) {
        toast.success('Registro exitoso. Ahora verifica tu correo');
        navigate('/verify-email', { 
          state: { email: email }
        });
      } else {
        toast.error(response.status.message);
      }
    } catch (error) {
      console.error('Error en registro:', error);
      toast.error('Error de conexión. Intente nuevamente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  useEffect(() => {
    publicService.getCareersForRegistration().then((response) => {
      if (!response.hasError && response.data) {
        setCareers(response.data);
        // Ya no seleccionamos ninguna por defecto, el usuario debe elegir
      }
    });
  }, []);

  // Preparar opciones para el MultiSelect
  const careerOptions = careers.map(career => ({
    value: career.idCareer.toString(),
    label: career.careerName
  }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="size-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Crear una cuenta</CardTitle>
          <CardDescription>
            Regístrate como estudiante o empleado para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'student' | 'employee')}>
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="student" className="flex items-center gap-2">
                <GraduationCap className="size-4" />
                Estudiante
              </TabsTrigger>
              <TabsTrigger value="employee" className="flex items-center gap-2">
                <Briefcase className="size-4" />
                Empleado
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Campos comunes */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Juan Pérez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo institucional *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="juan.perez@universidad.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="********"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Campos de Estudiante */}
              <TabsContent value="student" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Número de cuenta *</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="accountNumber"
                      type="text"
                      placeholder="2024123456"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="pl-10"
                      required={activeTab === 'student'}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enrollmentDate">Fecha de inscripción *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="enrollmentDate"
                      type="date"
                      value={enrollmentDate}
                      onChange={(e) => setEnrollmentDate(e.target.value)}
                      className="pl-10"
                      required={activeTab === 'student'}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="careers">Carreras *</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <MultiSelect
                      options={careerOptions}
                      value={selectedCareers}
                      onChange={setSelectedCareers}
                      placeholder="Selecciona una o más carreras"
                      disabled={isLoading || careers.length === 0}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Puedes seleccionar múltiples carreras si estás inscrito en más de una
                  </p>
                  {selectedCareers.length > 0 && (
                    <p className="text-xs text-green-600">
                      Carreras seleccionadas: {selectedCareers.length}
                    </p>
                  )}
                  {careers.length === 0 && !isLoading && (
                    <p className="text-xs text-red-500 mt-1">
                      No se pudieron cargar las carreras. Recarga la página.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentPeriod">Período actual *</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="currentPeriod"
                      type="number"
                      placeholder="1"
                      min="1"
                      max="12"
                      value={currentPeriod}
                      onChange={(e) => setCurrentPeriod(e.target.value)}
                      className="pl-10"
                      required={activeTab === 'student'}
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Período académico actual (1-12)</p>
                </div>
              </TabsContent>

              {/* Campos de Empleado */}
              <TabsContent value="employee" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeCode">Código de empleado *</Label>
                  <div className="relative">
                    <Badge className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="employeeCode"
                      type="text"
                      placeholder="EMP-2024-001"
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value)}
                      className="pl-10"
                      required={activeTab === 'employee'}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Departamento *</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="department"
                      type="text"
                      placeholder="Ingeniería de Sistemas"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="pl-10"
                      required={activeTab === 'employee'}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Cargo *</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="position"
                      type="text"
                      placeholder="Profesor"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="pl-10"
                      required={activeTab === 'employee'}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hireDate">Fecha de contratación *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="hireDate"
                      type="date"
                      value={hireDate}
                      onChange={(e) => setHireDate(e.target.value)}
                      className="pl-10"
                      required={activeTab === 'employee'}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </TabsContent>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Registrando...' : 'Registrarse'}
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">¿Ya tienes una cuenta? </span>
                <button
                  type="button"
                  onClick={handleGoToLogin}
                  className="text-primary hover:underline font-medium"
                  disabled={isLoading}
                >
                  Iniciar sesión
                </button>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}