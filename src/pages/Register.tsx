import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Loader2, Infinity, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    
    // Basic client-side weak password pattern check
    // Relaxed to only block extremely obvious ones
    const weakPatterns = ["123456", "password", "senha123"];
    if (weakPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
      toast.error("Senha muito óbvia. Para sua segurança, use uma combinação menos comum.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      console.error("Erro no registro:", error);
      if (error.status === 422) {
        if (error.message.toLowerCase().includes("weak")) {
          toast.error("Sua senha é considerada frágil pelo sistema. Use uma mistura de letras, números e símbolos.");
        } else {
          toast.error("Este email já está em uso ou o cadastro não é permitido agora.");
        }
      } else if (error.status === 429) {
        toast.error("Muitas tentativas de cadastro. Aguarde um pouco.");
      } else {
        toast.error(error.message || "Ocorreu um erro ao criar sua conta.");
      }
    } else {
      toast.success("Conta criada! Verifique seu email para confirmar.");
      navigate("/login");
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
              background: `hsla(${240 + Math.random() * 60}, 80%, 75%, ${Math.random() * 0.7 + 0.3})`,
              animation: `pulse ${2 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
        {/* Nebula glow blobs */}
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(260, 60%, 55%), transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(170, 70%, 45%), transparent 70%)", filter: "blur(50px)" }} />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">
        {/* App Brand Header */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="flex items-center justify-center w-16 h-16 rounded-full border border-secondary/30 mb-1"
            style={{ background: "radial-gradient(circle at 40% 40%, hsl(260,60%,30%), hsl(240,20%,8%))", boxShadow: "0 0 32px hsl(260 60% 55% / 0.35)" }}>
            <Infinity className="h-8 w-8 text-secondary drop-shadow-lg" />
          </div>
          <h1 className="text-2xl font-bold tracking-widest"
            style={{ background: "linear-gradient(135deg, hsl(260,60%,70%), hsl(170,70%,55%), hsl(200,85%,70%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            AppInfinity Galaxy
          </h1>
          <p className="text-xs tracking-widest text-muted-foreground uppercase">Inicie sua jornada cósmica</p>
        </div>

        {/* Register Card */}
        <Card className="w-full border-border/40 relative"
          style={{ background: "linear-gradient(135deg, hsl(240,20%,7%), hsl(240,15%,10%))", boxShadow: "0 0 40px hsl(260 60% 55% / 0.12), 0 4px 40px rgba(0,0,0,0.5)", backdropFilter: "blur(20px)" }}>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 border border-secondary/20">
              <Rocket className="h-5 w-5 text-secondary" />
            </div>
            <CardTitle className="text-xl text-foreground">Criar Conta</CardTitle>
            <CardDescription className="text-muted-foreground">Registre-se para pilotar sua nave</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-foreground/80 text-sm">Email</Label>
                <Input id="reg-email" type="email" placeholder="piloto@espaco.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="border-border/50 focus:border-secondary/60 transition-colors"
                  style={{ background: "hsl(240,20%,6%)" }} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-foreground/80 text-sm">Senha</Label>
                <div className="relative">
                  <Input 
                    id="reg-password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Mínimo 6 caracteres" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-border/50 focus:border-secondary/60 transition-colors pr-10"
                    style={{ background: "hsl(240,20%,6%)" }} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary transition-colors h-5 w-5 flex items-center justify-center p-0"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-confirm" className="text-foreground/80 text-sm">Confirmar Senha</Label>
                <div className="relative">
                  <Input 
                    id="reg-confirm" 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Repita a senha" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-border/50 focus:border-secondary/60 transition-colors pr-10"
                    style={{ background: "hsl(240,20%,6%)" }} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary transition-colors h-5 w-5 flex items-center justify-center p-0"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" id="register-submit" className="w-full font-semibold tracking-wide transition-all duration-200" disabled={loading}
                style={{ background: "linear-gradient(135deg, hsl(260,60%,45%), hsl(260,60%,35%))", boxShadow: loading ? "none" : "0 0 20px hsl(260 60% 55% / 0.3)" }}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Conta"}
              </Button>
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/40" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="px-2 text-muted-foreground" style={{ background: "hsl(240,17%,8%)" }}>ou</span></div>
              </div>
              <Button
                type="button"
                id="register-google"
                variant="outline"
                className="w-full border-border/50 hover:border-secondary/40 transition-colors"
                style={{ background: "hsl(240,20%,6%)" }}
                onClick={async () => {
                  const result = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: window.location.origin,
                    },
                  });
                  if (result.error) {
                    console.error("Erro detalhado do Supabase OAuth (Registro):", result.error);
                    console.dir(result.error);
                    toast.error(`Erro ao entrar com Google: ${result.error.message}`);
                  }
                }}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Cadastrar com Google
              </Button>
              <Link to="/login" id="goto-login" className="text-sm text-secondary/80 hover:text-secondary transition-colors hover:underline">Já tem conta? Entrar</Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
