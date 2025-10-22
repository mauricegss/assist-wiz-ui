import { useState, useEffect } from "react";
import MetricCard from "@/components/MetricCard";
import { MessageSquare, CheckCircle, Clock, TrendingUp, AlertCircle, Loader2 } from "lucide-react"; // Importar ícones
import { Button } from "@/components/ui/button";

// Interface para as métricas (igual ao backend)
interface DashboardMetrics {
  activeTickets: number;
  resolvedToday: number;
  avgResponseTimeMinutes: number;
  satisfactionRate: number;
}

// Valores iniciais ou de carregamento
const initialMetrics: DashboardMetrics = {
    activeTickets: 0,
    resolvedToday: 0,
    avgResponseTimeMinutes: 0.0,
    satisfactionRate: 0.0,
};

const Dashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar as métricas
  const fetchMetrics = async () => {
    // Não seta isLoading=true aqui para permitir refresh silencioso
    setError(null);
    try {
      const response = await fetch("http://localhost:8000/api/dashboard/metrics");
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      const data: DashboardMetrics = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error("Erro ao buscar métricas:", err);
      setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido");
      // Mantém as métricas anteriores ou reseta se preferir
      // setMetrics(initialMetrics);
    } finally {
       if (isLoading) setIsLoading(false); // Só desativa o loading inicial uma vez
    }
  };

  // Busca as métricas ao montar e define um intervalo para atualização
  useEffect(() => {
    fetchMetrics(); // Busca inicial

    const intervalId = setInterval(fetchMetrics, 60000); // Atualiza a cada 60 segundos

    // Limpa o intervalo quando o componente é desmontado
    return () => clearInterval(intervalId);
  }, []); // Array vazio, executa ao montar

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard de Atendimento</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho em tempo real (atualiza a cada minuto)</p>
        </div>

        {/* Exibição condicional: Loading, Erro ou Métricas */}
        {isLoading ? (
           <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Carregando métricas...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive bg-destructive/10 border border-destructive rounded-md p-4">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="font-semibold">Erro ao carregar métricas:</p>
            <p className="text-sm mb-4">{error}</p>
            <Button onClick={fetchMetrics} variant="destructive" size="sm">Tentar Novamente</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Tickets Ativos"
              value={metrics.activeTickets} // Valor dinâmico
              icon={MessageSquare}
              // Trend pode vir da API ou ser calculado no frontend
              // trend="+12% desde ontem"
              variant="default"
            />
            <MetricCard
              title="Resolvidos Hoje"
              value={metrics.resolvedToday} // Valor dinâmico
              icon={CheckCircle}
              // trend="+8% desde ontem"
              variant="success"
            />
            <MetricCard
              title="Tempo Médio Resp."
              // Formata o valor
              value={`${metrics.avgResponseTimeMinutes.toFixed(1)} min`}
              icon={Clock}
              // trend="-15% desde ontem"
              variant="accent"
            />
            <MetricCard
              title="Satisfação"
              // Formata o valor
              value={`${metrics.satisfactionRate.toFixed(1)}%`}
              icon={TrendingUp}
              // trend="+3% desde semana passada"
              variant={metrics.satisfactionRate >= 90 ? "success" : metrics.satisfactionRate >= 75 ? "warning" : "default"} // Variante dinâmica
            />
          </div>
        )}
         {/* Mostra erro de atualização silenciosa */}
         {!isLoading && error && (
            <div className="mt-4 text-center text-xs text-destructive">
                Falha ao atualizar métricas: {error}
            </div>
         )}
      </div>
    </div>
  );
};

export default Dashboard;