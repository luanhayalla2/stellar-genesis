import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Loader2, Infinity as InfinityIcon, Eye, EyeOff } from "lucide-react";
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
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setResending(false);
    if (error) {
      toast.error(`Erro ao reenviar: ${error.message}`);
    } else {
      toast.success("Email de confirmação reenviado!");
      setShowResend(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Preencha email e senha");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login")) {
        toast.error("Email ou senha incorretos");
      } else if (msg.includes("email not confirmed") || msg.includes("confirm")) {
        toast.error("Confirme seu email antes de entrar");
        setShowResend(true);
      } else if (error.status === 429) {
        toast.error("Muitas tentativas. Aguarde alguns minutos.");
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success("Login realizado!");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Star field */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => (
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
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(200,85%,55%), transparent 70%)", filter: "blur(60px)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(260,60%,55%), transparent 70%)", filter: "blur(50px)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">
        {/* Brand */}
        <div className="text-center flex flex-col items-center gap-2">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full border border-primary/30"
            style={{
              background: "radial-gradient(circle at 40% 40%, hsl(200,85%,30%), hsl(240,20%,8%))",
              boxShadow: "0 0 32px hsl(200 85% 55% / 0.35)",
            }}
          >
            <InfinityIcon className="h-8 w-8 text-primary drop-shadow-lg" />
          </div>
          <h1
            className="text-2xl font-bold tracking-widest"
            style={{
              background: "linear-gradient(135deg, hsl(200,85%,70%), hsl(170,70%,55%), hsl(260,60%,70%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            AppInfinity Galaxy
          </h1>
          <p className="text-xs tracking-widest text-muted-foreground uppercase">Explore o universo infinito</p>
        </div>

        <Card
          className="w-full border-border/40"
          style={{
            background: "linear-gradient(135deg, hsl(240,20%,7%), hsl(240,15%,10%))",
            boxShadow: "0 0 40px hsl(200 85% 55% / 0.12), 0 4px 40px rgba(0,0,0,0.5)",
            backdropFilter: "blur(20px)",
          }}
        >
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl text-foreground">Entrar</CardTitle>
            <CardDescription className="text-muted-foreground">
              Acesse sua nave e explore a galáxia
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-foreground/80 text-sm">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="piloto@espaco.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-border/50 focus:border-primary/60"
                  style={{ background: "hsl(240,20%,6%)" }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-foreground/80 text-sm">Senha</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-border/50 focus:border-primary/60 pr-10"
                    style={{ background: "hsl(240,20%,6%)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full font-semibold tracking-wide"
                disabled={loading}
                style={{
                  background: "linear-gradient(135deg, hsl(200,85%,45%), hsl(200,85%,35%))",
                  boxShadow: loading ? "none" : "0 0 20px hsl(200 85% 55% / 0.3)",
                }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>

              {showResend && (
                <div className="w-full p-3 rounded-lg border border-secondary/30 bg-secondary/10 animate-fade-in flex flex-col gap-2">
                  <p className="text-[10px] text-center text-secondary-foreground font-medium uppercase tracking-wider">
                    Email não confirmado
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleResend}
                    disabled={resending}
                    className="w-full text-xs font-bold"
                  >
                    {resending ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    ) : (
                      <Rocket className="h-3 w-3 mr-2" />
                    )}
                    Reenviar email de confirmação
                  </Button>
                </div>
              )}

              <Button
                type="button"
                onClick={() => {
                  loginAsGuest();
                  toast.success("Bem-vindo, Piloto Convidado! 🚀");
                  navigate("/");
                }}
                className="w-full font-bold tracking-wide"
                style={{
                  background: "linear-gradient(135deg, hsl(140,60%,25%), hsl(140,50%,18%))",
                  border: "1px solid hsl(140,60%,35%)",
                  boxShadow: "0 0 16px hsl(140 60% 40% / 0.25)",
                  color: "hsl(140, 80%, 75%)",
                }}
              >
                🎮 Entrar como Convidado
              </Button>

              <div className="flex justify-between w-full text-sm pt-1">
                <Link to="/forgot-password" className="text-primary/80 hover:text-primary hover:underline">
                  Esqueci a senha
                </Link>
                <Link to="/register" className="text-primary/80 hover:text-primary hover:underline">
                  Criar conta
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
