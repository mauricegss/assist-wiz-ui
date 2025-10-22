import { useState, useEffect, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"; // Ícones para feedback
import { useToast } from "@/components/ui/use-toast"; // Para notificações

// Interface para o modelo de configurações (igual ao backend)
interface SettingsData {
  companyName: string;
  contactEmail: string;
  autoResponse: boolean;
  techDiagnosis: boolean;
  smartEscalation: boolean;
  sentimentAnalysis: boolean;
  notifyNewTickets: boolean;
  notifyEscalatedTickets: boolean;
}

// Estado inicial vazio ou padrão
const initialSettings: SettingsData = {
    companyName: "",
    contactEmail: "",
    autoResponse: false,
    techDiagnosis: false,
    smartEscalation: false,
    sentimentAnalysis: false,
    notifyNewTickets: false,
    notifyEscalatedTickets: false,
};

const Settings = () => {
  const [settings, setSettings] = useState<SettingsData>(initialSettings);
  const [isLoading, setIsLoading] = useState(true); // Loading inicial
  const [isSaving, setIsSaving] = useState(false); // Loading ao salvar
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast(); // Hook para mostrar notificações

  // Busca configurações da API ao montar
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:8000/api/settings");
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        const data: SettingsData = await response.json();
        setSettings(data);
      } catch (err) {
        console.error("Erro ao buscar configurações:", err);
        setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido");
        toast({ // Notifica erro ao buscar
            variant: "destructive",
            title: "Erro ao carregar configurações",
            description: error,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [toast]); // Adiciona toast às dependências

  // Handler para mudança nos inputs de texto
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
  };

  // Handler para mudança nos switches
  const handleSwitchChange = (id: keyof SettingsData, checked: boolean) => {
    // Garante que só booleanos sejam alterados aqui
    if (typeof settings[id] === 'boolean') {
        setSettings(prev => ({ ...prev, [id]: checked }));
    }
  };

  // Handler para salvar alterações
  const handleSave = async (e: FormEvent) => {
    e.preventDefault(); // Previne reload da página se estiver num form
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:8000/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        let errorMsg = `Erro HTTP: ${response.status}`;
        try { const errorData = await response.json(); errorMsg = errorData.detail || errorMsg; } catch(e) {/*ignorar*/}
        throw new Error(errorMsg);
      }
      const savedSettings: SettingsData = await response.json();
      setSettings(savedSettings); // Atualiza estado com dados salvos (pode ter validação no backend)
      toast({ // Notificação de sucesso
        title: "Sucesso!",
        description: "Configurações salvas com sucesso.",
        action: <CheckCircle className="text-green-500" />,
      });
    } catch (err) {
      console.error("Erro ao salvar configurações:", err);
      const errorMsg = err instanceof Error ? err.message : "Ocorreu um erro desconhecido";
      setError(errorMsg);
       toast({ // Notificação de erro
        variant: "destructive",
        title: "Erro ao salvar",
        description: errorMsg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handler para cancelar (recarrega os dados originais) - Opcional
  // Poderia simplesmente buscar da API novamente
  // Ou ter um estado 'originalSettings' para restaurar
  const handleCancel = () => {
    // Simplesmente recarrega a página para descartar alterações
    // Em uma SPA mais complexa, buscaria os dados novamente da API
     window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  // Não mostra o formulário se houve erro inicial grave
  if (error && settings === initialSettings) {
     return (
        <div className="p-8 max-w-4xl text-center text-destructive">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Erro grave ao carregar configurações: {error}</p>
             <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="mt-4">Tentar Novamente</Button>
        </div>
     )
  }


  return (
    <div className="min-h-screen bg-gradient-subtle">
      <form onSubmit={handleSave}> {/* Adiciona form para submit */}
        <div className="p-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Configurações</h1>
            <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
          </div>

          <div className="space-y-6">
            {/* Configurações Gerais */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>Ajuste as configurações básicas do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input id="companyName" value={settings.companyName} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">E-mail de Contato</Label>
                  <Input id="contactEmail" type="email" value={settings.contactEmail} onChange={handleInputChange} required />
                </div>
              </CardContent>
            </Card>

            {/* Configurações dos Agentes */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações dos Agentes</CardTitle>
                <CardDescription>Configure o comportamento dos agentes de IA</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mapeia as configurações booleanas para criar os Switches dinamicamente */}
                {(Object.keys(settings) as Array<keyof SettingsData>)
                  .filter(key => typeof settings[key] === 'boolean' && !key.startsWith('notify')) // Filtra booleans de agentes
                  .map(key => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                         {/* Labels mais descritivos */}
                        <Label htmlFor={key} className="capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {/* Descrições poderiam vir de um objeto de mapeamento */}
                          {key === 'autoResponse' && 'Ativar resposta automática para novos tickets'}
                          {key === 'techDiagnosis' && 'Permitir tentativa de diagnóstico técnico automático'}
                          {key === 'smartEscalation' && 'Sugerir/realizar escalonamento inteligente'}
                          {key === 'sentimentAnalysis' && 'Ativar análise de sentimento nas interações'}
                        </p>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key] as boolean}
                        onCheckedChange={(checked) => handleSwitchChange(key, checked)}
                      />
                    </div>
                  ))}
              </CardContent>
            </Card>

             {/* Notificações */}
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>Configure as preferências de notificação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {(Object.keys(settings) as Array<keyof SettingsData>)
                  .filter(key => typeof settings[key] === 'boolean' && key.startsWith('notify')) // Filtra booleans de notificação
                  .map(key => (
                    <div key={key} className="flex items-center justify-between">
                       <div className="space-y-0.5">
                         <Label htmlFor={key} className="capitalize">
                            {key.replace('notify', '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Label>
                          <p className="text-sm text-muted-foreground">
                            {key === 'notifyNewTickets' && 'Receber notificação sobre novos tickets'}
                            {key === 'notifyEscalatedTickets' && 'Receber notificação sobre tickets escalonados'}
                         </p>
                       </div>
                       <Switch
                          id={key}
                          checked={settings[key] as boolean}
                          onCheckedChange={(checked) => handleSwitchChange(key, checked)}
                        />
                    </div>
                  ))}
              </CardContent>
            </Card>

             {/* Botões de Ação */}
            <div className="flex justify-end gap-4">
              {/* Mostra erro ao salvar, se houver */}
                {error && !isSaving && (
                    <div className="text-sm text-destructive flex items-center gap-1 mr-auto">
                        <AlertCircle className="h-4 w-4"/> {error}
                    </div>
                )}
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>Cancelar</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 min-w-[120px]" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;