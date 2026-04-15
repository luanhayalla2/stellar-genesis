import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Loader2, Infinity, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { loginAsGuest } = useAuth();

  const handleResend = async () => {
    if (!email.trim()) {
      toast.error("Digite seu email para reenviar a confirmação");
      return;
    }
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    setResending(false);
    if (error) {
      toast.error(`Erro ao reenviar: ${error.message}`);
    } else {
      toast.success("Email de confirmação reenviado! Verifique sua caixa de entrada.");
      setShowResend(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      // Only log to console if it's a real technical issue, not a user mistake
      if (error.status !== 400 && error.status !== 422) {
        console.error("Erro técnico no login:", error);
      }
      
      if (error.status === 400) {
        setShowResend(true); // Proactively show resend button on any 400 error to help user
        if (error.message === "Invalid login credentials") {
          toast.error("Usuário ou senha inválidos.", {
            description: "Esqueceu a senha? Ou talvez ainda não confirmou o e-mail? Use o botão abaixo se precisar de um novo link."
          });
        } else if (error.message.includes("Email not confirmed") || error.message.includes("confirm your email")) {
          toast.error("🚀 QUASE LÁ! O e-mail precisa de confirmação.", {
            duration: 6000,
            description: "Enviamos um link para sua caixa de entrada. Se não encontrar, clique no botão abaixo para reenviar."
          });
        } else {
          toast.error(error.message);
        }
      } else if (error.status === 429) {
        toast.error("Muitas tentativas em pouco tempo. Aguarde alguns minutos.");
      } else if (error.status === 422) {
        toast.error("Erro de validação ou conta bloqueada. Verifique seus dados.");
      } else {
        toast.error("Não foi possível conectar ao servidor. Verifique sua conexão.");
      }
    } else {
      toast.success("Login realizado!");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Animated star field */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 2.5 + 0.5,
              height: Math.random() * 2.5 + 0.5,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `hsla(${180 + Math.random() * 60}, 80%, 75%, ${Math.random() * 0.7 + 0.3})`,
              animation: `pulse ${2 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
        {/* Nebula glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(200, 85%, 55%), transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(260, 60%, 55%), transparent 70%)", filter: "blur(50px)" }} />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">
        {/* App Brand Header */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="flex items-center justify-center w-16 h-16 rounded-full border border-primary/30 mb-1"
            style={{ background: "radial-gradient(circle at 40% 40%, hsl(200,85%,30%), hsl(240,20%,8%))", boxShadow: "0 0 32px hsl(200 85% 55% / 0.35)" }}>
            <Infinity className="h-8 w-8 text-primary drop-shadow-lg" />
          </div>
          <h1 className="text-2xl font-bold tracking-widest"
            style={{ background: "linear-gradient(135deg, hsl(200,85%,70%), hsl(170,70%,55%), hsl(260,60%,70%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            AppInfinity Galaxy
          </h1>
          <p className="text-xs tracking-widest text-muted-foreground uppercase">Explore o universo infinito</p>
        </div>

        {/* Login Card */}
        <Card className="w-full border-border/40 relative"
          style={{ background: "linear-gradient(135deg, hsl(240,20%,7%), hsl(240,15%,10%))", boxShadow: "0 0 40px hsl(200 85% 55% / 0.12), 0 4px 40px rgba(0,0,0,0.5)", backdropFilter: "blur(20px)" }}>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl text-foreground">Entrar</CardTitle>
            <CardDescription className="text-muted-foreground">Acesse sua nave e explore o universo</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-foreground/80 text-sm">Email</Label>
                <Input id="login-email" type="email" placeholder="piloto@espaco.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="border-border/50 focus:border-primary/60 transition-colors"
                  style={{ background: "hsl(240,20%,6%)" }} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-foreground/80 text-sm">Senha</Label>
                <div className="relative">
                  <Input 
                    id="login-password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-border/50 focus:border-primary/60 transition-colors pr-10"
                    style={{ background: "hsl(240,20%,6%)" }} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors h-5 w-5 flex items-center justify-center p-0"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" id="login-submit" className="w-full font-semibold tracking-wide transition-all duration-200" disabled={loading}
                style={{ background: "linear-gradient(135deg, hsl(200,85%,45%), hsl(200,85%,35%))", boxShadow: loading ? "none" : "0 0 20px hsl(200 85% 55% / 0.3)" }}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>

              {showResend && (
                <div className="w-full p-3 rounded-lg border border-secondary/30 bg-secondary/10 animate-fade-in flex flex-col gap-2">
                  <p className="text-[10px] text-center text-secondary-foreground font-medium uppercase tracking-wider">Ação requerida</p>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleResend} 
                    disabled={resending}
                    className="w-full text-xs font-bold shadow-[0_0_15px_hsla(260,60%,55%,0.3)]"
                  >
                    {resending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Rocket className="h-3 w-3 mr-2" />}
                    Confirmar E-mail Agora
                  </Button>
                </div>
              )}

              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => {
                  loginAsGuest();
                  toast.success("Entrando em Modo de Demonstração (Convidado)");
                  navigate("/");
                }}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                Entrar como Convidado (Modo Developer)
              </Button>

              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/40" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="px-2 text-muted-foreground" style={{ background: "hsl(240,17%,8%)" }}>ou</span></div>
              </div>
              <Button
                type="button"
                id="login-google"
                variant="outline"
                className="w-full border-border/50 hover:border-primary/40 transition-colors"
                style={{ background: "hsl(240,20%,6%)" }}
                onClick={async () => {
                  const result = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: window.location.origin,
                    },
                  });
                  if (result.error) {
                    console.error("Erro detalhado do Supabase OAuth:", result.error);
                    console.dir(result.error);
                    toast.error(`Erro ao entrar com Google: ${result.error.message}`);
                  }
                }}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Entrar com Google
              </Button>
              <div className="flex justify-between w-full text-sm">
                <Link to="/forgot-password" className="text-primary/80 hover:text-primary transition-colors hover:underline">Esqueci minha senha</Link>
                <Link to="/register" className="text-primary/80 hover:text-primary transition-colors hover:underline">Criar conta</Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
