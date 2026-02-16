'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    try {
      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        console.error('Erro de autenticação:', {
          status: error.status,
          message: error.message,
          name: error.name,
        })
        throw error
      }

      // Registrar login na tabela de histórico (se a tabela existir)
      if (authData.user?.id) {
        try {
          const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
          await (supabase as any).from('user_login_history').insert({
            user_id: authData.user.id,
            user_email: data.email,
            user_agent: userAgent,
          })
        } catch (logError: any) {
          // Não bloquear o login se a tabela não existir
          if (logError?.message?.includes('does not exist')) {
            console.warn('Tabela user_login_history não encontrada. Execute o SQL de migração.')
          } else {
            console.error('Erro ao registrar login em histórico:', logError)
          }
        }
      }

      toast.success('Login realizado com sucesso')
      // O redirecionamento será feito pelo AuthLayout via onAuthStateChange
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao fazer login'
      
      // Mensagens mais específicas
      if (errorMessage.includes('Invalid login credentials')) {
        toast.error('E-mail ou senha incorretos. Verifique suas credenciais.')
      } else if (errorMessage.includes('User not found')) {
        toast.error('Usuário não encontrado. Crie uma conta no painel do Supabase.')
      } else if (errorMessage.includes('Email not confirmed')) {
        toast.error('E-mail não confirmado. Verifique sua caixa de entrada.')
      } else {
        toast.error(errorMessage)
      }
      
      console.error('Erro de autenticação detalhado:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <svg
        className="absolute h-0 w-0"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <filter id="login-glass-distortion" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.008"
              numOctaves={2}
              seed={92}
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="1.5" result="blurred" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="blurred"
              scale={10}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div className="login-orb login-orb--teal" />
      <div className="login-orb login-orb--blue" />

      <Card className="login-glass-card relative z-10 w-full max-w-xl !bg-transparent border border-white/60 shadow-none">
        <CardHeader className="space-y-4 px-8 pt-8">
          <div className="space-y-2">
            <CardTitle className="text-4xl font-bold tracking-tight">
              <span className="text-teal-500">Solar</span>
              <span className="login-text-primary"> Energy</span>
              <span className="login-text-muted"> CRM</span>
            </CardTitle>
            <CardDescription className="login-text-secondary text-lg">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="email" className="login-text-secondary text-sm font-semibold">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                disabled={loading}
                className={`login-input h-12 rounded-xl pr-3 transition-all duration-200 ${
                  errors.email 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-slate-300/70 focus:border-blue-500 focus:ring-blue-500/20'
                }`}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="password" className="login-text-secondary text-sm font-semibold">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  disabled={loading}
                  className={`login-input h-12 rounded-xl pr-10 transition-all duration-200 ${
                    errors.password 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-slate-300/70 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-50"
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>

            <div className="border-t border-slate-200/70 pt-2">
              <p className="login-text-muted text-center text-xs">
                Sistema seguro com autenticação Supabase
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
