import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Loader2, Infinity as InfinityIcon, Eye, EyeOff, ShieldCheck, Info } from "lucide-react";
import { toast } from "sonner";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { loginAsGuest } = useAuth();

  const passwordStrength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

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
      const msg = error.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered")) {
        toast.error("Este email já está cadastrado. Tente entrar.");
      } else if (msg.includes("weak") || msg.includes("password")) {
        toast.error("Senha fraca. Use letras, números e símbolos.");
      } else if (error.status === 429) {
        toast.error("Muitas tentativas. Aguarde alguns minutos.");
      } else {
        toast.error(error.message || "Erro ao criar conta");
      }
      return;
    }

    setSuccess(true);
    toast.success("Conta criada! Verifique seu email.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
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
              background: `hsla(${240 + Math.random() * 60}, 80%, 75%, ${Math.random() * 0.7 + 0.3})`,
              animation: `pulse ${2 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
        <div
          className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(260,60%,55%), transparent 70%)", filter: "blur(60px)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">
        <div className="text-center flex flex-col items-center gap-2">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full border border-secondary/30"
            style={{
              background: "radial-gradient(circle at 40% 40%, hsl(260,60%,30%), hsl(240,20%,8%))",
              boxShadow: "0 0 32px hsl(260 60% 55% / 0.35)",
            }}
          >
            <InfinityIcon className="h-8 w-8 text-secondary drop-shadow-lg" />
          </div>
          <h1
            className="text-2xl font-bold tracking-widest"
            style={{
              background: "linear-gradient(135deg, hsl(260,60%,70%), hsl(170,70%,55%), hsl(200,85%,70%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            AppInfinity Galaxy
          </h1>
          <p className="text-xs tracking-widest text-muted-foreground uppercase">Inicie sua jornada cósmica</p>
        </div>

        <Card
          className="w-full border-border/40"
          style={{
            background: "linear-gradient(135deg, hsl(240,20%,7%), hsl(240,15%,10%))",
            boxShadow: "0 0 40px hsl(260 60% 55% / 0.12), 0 4px 40px rgba(0,0,0,0.5)",
            backdropFilter: "blur(20px)",
          }}
        >
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 border border-secondary/20">
              <Rocket className="h-5 w-5 text-secondary" />
            </div>
            <CardTitle className="text-xl text-foreground">
              {success ? "Verifique seu email" : "Criar Conta"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {success ? "Enviamos um link de confirmação" : "Registre-se para pilotar sua nave"}
            </CardDescription>
          </CardHeader>

          {success ? (
            <CardContent className="space-y-6 pt-4 pb-8 text-center">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-secondary/10 flex items-center justify-center border-2 border-secondary/30 animate-pulse">
                  <ShieldCheck className="h-10 w-10 text-secondary" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-foreground/90 leading-relaxed">
                  Confirme seu endereço{" "}
                  <span className="text-secondary font-medium">{email}</span> clicando no link do email.
                </p>
                <div className="bg-secondary/5 p-4 rounded-lg border border-secondary/10 flex items-start gap-3 text-left">
                  <Info className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-normal">
                    Não encontrou? Verifique a pasta de spam ou aguarde alguns minutos.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/login")}
                variant="outline"
                className="w-full border-secondary/30 text-secondary hover:bg-secondary/10"
              >
                Ir para o Login
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-foreground/80 text-sm">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    placeholder="piloto@espaco.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-border/50 focus:border-secondary/60"
                    style={{ background: "hsl(240,20%,6%)" }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-foreground/80 text-sm">Senha</Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-border/50 focus:border-secondary/60 pr-10"
                      style={{ background: "hsl(240,20%,6%)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="flex gap-1 h-1 mt-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-full transition-colors"
                          style={{
                            background:
                              i < passwordStrength
                                ? passwordStrength <= 1
                                  ? "hsl(0,70%,50%)"
                                  : passwordStrength === 2
                                  ? "hsl(40,80%,50%)"
                                  : "hsl(140,60%,45%)"
                                : "hsl(240,15%,18%)",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-confirm" className="text-foreground/80 text-sm">Confirmar senha</Label>
                  <div className="relative">
                    <Input
                      id="reg-confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Repita a senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="border-border/50 focus:border-secondary/60 pr-10"
                      style={{ background: "hsl(240,20%,6%)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary"
                      aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="text-[10px] text-destructive">As senhas não coincidem</p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full font-semibold tracking-wide"
                  disabled={loading}
                  style={{
                    background: "linear-gradient(135deg, hsl(260,60%,45%), hsl(260,60%,35%))",
                    boxShadow: loading ? "none" : "0 0 20px hsl(260 60% 55% / 0.3)",
                  }}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Conta"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-border/50 hover:border-secondary/40 text-secondary/80 hover:text-secondary"
                  style={{ background: "hsl(240,20%,6%)" }}
                  onClick={() => {
                    loginAsGuest();
                    navigate("/");
                    toast.success("Entrando como convidado...");
                  }}
                >
                  🎮 Entrar como Convidado
                </Button>

                <Link to="/login" className="mt-1 text-xs text-muted-foreground hover:text-secondary">
                  Já tem conta? <span className="text-secondary/80 font-medium">Entrar</span>
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Register;
