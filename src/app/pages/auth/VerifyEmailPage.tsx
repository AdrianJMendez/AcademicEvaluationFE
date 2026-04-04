import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Mail, Shield, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import authService from '@/services/auth.service';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const stateEmail = location.state?.email;
    const storedEmail = localStorage.getItem('pendingVerificationEmail');
    
    if (stateEmail) {
      setEmail(stateEmail);
      localStorage.setItem('pendingVerificationEmail', stateEmail);
    } else if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // Si no hay email, redirigir al registro
      toast.error('No se encontró información de verificación');
      navigate('/register');
    }
  }, [location, navigate]);

  const handleCodeChange = (index: number, value: string) => {
    // Solo permitir números
    if (value && !/^\d+$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(0, 1);
    setCode(newCode);
    setError('');

    // Auto-focus al siguiente input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Mover al anterior input al presionar backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const pastedCode = pastedData.slice(0, 6).split('');
    
    if (pastedCode.every(char => /^\d+$/.test(char))) {
      const newCode = [...code];
      pastedCode.forEach((char, idx) => {
        if (idx < 6) newCode[idx] = char;
      });
      setCode(newCode);
      
      // Focus en el último input después de pegar
      const lastInput = document.getElementById(`code-${Math.min(pastedCode.length - 1, 5)}`);
      lastInput?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Por favor ingrese el código de 6 dígitos');
      return;
    }
    
    if (!email) {
      toast.error('Email no encontrado');
      navigate('/register');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await authService.verifyEmailCode({
        email,
        code: verificationCode
      });
      
      if (!response.hasError) {
        toast.success('¡Email verificado exitosamente!');
        // Limpiar email pendiente
        localStorage.removeItem('pendingVerificationEmail');
        // Redirigir al login después de 1.5 segundos
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setError(response.meta?.message || 'Código inválido o expirado');
        toast.error(response.meta?.message || 'Código inválido');
        // Limpiar el código en caso de error
        setCode(['', '', '', '', '', '']);
        // Focus en el primer input
        setTimeout(() => {
          document.getElementById('code-0')?.focus();
        }, 100);
      }
    } catch (error) {
      console.error('Error en verificación:', error);
      setError('Error de conexión. Intente nuevamente');
      toast.error('Error al verificar el código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      toast.error('Email no encontrado');
      navigate('/register');
      return;
    }
    
    setIsResending(true);
    
    try {
      const response = await authService.resendEmailVerification({ email });
      
      if (!response.hasError) {
        toast.success('¡Código reenviado! Revisa tu correo electrónico');
        // Limpiar el código actual para que el usuario ingrese el nuevo
        setCode(['', '', '', '', '', '']);
        setError('');
        // Focus en el primer input
        setTimeout(() => {
          document.getElementById('code-0')?.focus();
        }, 100);
      } else {
        toast.error(response.meta?.message || 'Error al reenviar el código');
      }
    } catch (error) {
      console.error('Error al reenviar código:', error);
      toast.error('Error de conexión. Intente nuevamente');
    } finally {
      setIsResending(false);
    }
  };

  const handleGoToLogin = () => {
    localStorage.removeItem('pendingVerificationEmail');
    navigate('/login');
  };

  const handleGoToRegister = () => {
    localStorage.removeItem('pendingVerificationEmail');
    navigate('/register');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="size-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verifica tu correo electrónico</CardTitle>
          <CardDescription className="mt-2">
            Para completar tu registro, necesitamos verificar tu dirección de correo
          </CardDescription>
          <div className="mt-3 p-2 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Hemos enviado un código a:</p>
            <p className="font-medium text-primary break-all">{email}</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-center block">Código de verificación (6 dígitos)</Label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {code.map((digit, index) => (
                  <Input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl font-semibold"
                    disabled={isLoading}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              {error && (
                <div className="flex items-center justify-center gap-2 text-sm text-red-500 mt-2">
                  <XCircle className="size-4" />
                  <span>{error}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center mt-2">
                Ingresa el código de 6 dígitos que enviamos a tu correo
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 size-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Shield className="mr-2 size-4" />
                  Verificar código
                </>
              )}
            </Button>

            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    ¿Problemas con el código?
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleResendCode}
                disabled={isResending}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="mr-2 size-4 animate-spin" />
                    Reenviando código...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 size-4" />
                    Reenviar código de verificación
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="size-3" />
                <span>Revisa tu bandeja de entrada o carpeta de spam</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-center text-sm space-x-2">
                <button
                  type="button"
                  onClick={handleGoToRegister}
                  className="text-primary hover:underline font-medium"
                  disabled={isLoading || isResending}
                >
                  Usar otro correo
                </button>
                <span className="text-muted-foreground">•</span>
                <button
                  type="button"
                  onClick={handleGoToLogin}
                  className="text-primary hover:underline font-medium"
                  disabled={isLoading || isResending}
                >
                  Ir al inicio de sesión
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}