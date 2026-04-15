import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    } else {
      // Check if user has an active session from recovery
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setReady(true);
        else navigate("/login");
      });
    }
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
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
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      console.error("Erro na redefinição:", error);
      if (error.message.toLowerCase().includes("weak")) {
        toast.error("Esta nova senha é muito frágil. Tente uma combinação mais forte.");
      } else {
        toast.error(error.message || "Erro ao atualizar senha.");
      }
    } else {
      toast.success("Senha atualizada com sucesso!");
      navigate("/");
    }
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <KeyRound className="h-6 w-6 text-accent" />
          </div>
          <CardTitle className="text-2xl text-foreground">Nova Senha</CardTitle>
          <CardDescription className="text-muted-foreground">Digite sua nova senha</CardDescription>
        </CardHeader>
        <form onSubmit={handleReset}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Nova Senha</Label>
              <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-muted/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-foreground">Confirmar Senha</Label>
              <Input id="confirm" type="password" placeholder="Repita a nova senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-muted/50 border-border" />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar Senha"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
