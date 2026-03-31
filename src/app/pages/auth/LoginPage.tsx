import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { GraduationCap, Briefcase, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import {SHA256} from 'crypto-js';
import authService from '../../../services/auth.service';

export function LoginPage() {
  const navigate = useNavigate();
  const { setUserData } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'student' | 'employee'>('student');

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      let hashedPassword = SHA256(password).toString();

      const payload = {
        email: email,
        password : hashedPassword
      }

      authService.login(payload).then((response) => {
        if(!response.hasError){
          toast.success('Inicio de sesión exitoso');
          setUserData(response.data);
          navigate(response.data.role == 'student' ? '/student' : '/employee'); 
        }else{
          toast.error(response.status.message);
        }
        setIsLoading(false);
      });
    };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="size-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Sistema de Evaluacion Academica</CardTitle>
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

            <TabsContent value="student">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-student">Correo institucional</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email-student"
                      type="email"
                      placeholder="estudiante@universidad.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-student">Contrasena</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password-student"
                      type="password"
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Iniciando sesion...' : 'Iniciar sesion'}
                </Button>

              
              </form>
            </TabsContent>

            <TabsContent value="employee">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-employee">Correo institucional</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email-employee"
                      type="email"
                      placeholder="admin@universidad.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-employee">Contrasena</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password-employee"
                      type="password"
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Iniciando sesion...' : 'Iniciar sesion'}
                </Button>

                
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
