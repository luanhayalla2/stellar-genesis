import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Digite seu email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Email enviado! Verifique sua caixa de entrada.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <KeyRound className="h-6 w-6 text-accent" />
          </div>
          <CardTitle className="text-2xl text-foreground">Esqueci minha senha</CardTitle>
          <CardDescription className="text-muted-foreground">
            {sent ? "Verifique seu email para o link de redefinição" : "Digite seu email para redefinir a senha"}
          </CardDescription>
        </CardHeader>
        {!sent ? (
          <form onSubmit={handleReset}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input id="email" type="email" placeholder="piloto@espaco.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-muted/50 border-border" />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar link de redefinição"}
              </Button>
              <Link to="/login" className="text-sm text-primary hover:underline flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Voltar ao login
              </Link>
            </CardFooter>
          </form>
        ) : (
          <CardFooter className="flex flex-col gap-3">
            <Link to="/login" className="text-sm text-primary hover:underline flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Voltar ao login
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
