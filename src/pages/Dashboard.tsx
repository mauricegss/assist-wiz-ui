import MetricCard from "@/components/MetricCard";
import AgentCard from "@/components/AgentCard";
import { MessageSquare, CheckCircle, Clock, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const agents = [
    {
      name: "Atendimento Inicial",
      description: "Responde perguntas frequentes e coleta informações",
      status: "active" as const,
      tasksCompleted: 142,
    },
    {
      name: "Diagnóstico Técnico",
      description: "Resolve problemas via APIs internas",
      status: "processing" as const,
      tasksCompleted: 87,
    },
    {
      name: "Escalonamento",
      description: "Encaminha casos complexos para humanos",
      status: "active" as const,
      tasksCompleted: 34,
    },
    {
      name: "Feedback",
      description: "Solicita avaliação e analisa sentimentos",
      status: "idle" as const,
      tasksCompleted: 156,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard de Atendimento</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho dos agentes em tempo real</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Tickets Ativos"
            value={23}
            icon={MessageSquare}
            trend="+12% desde ontem"
            variant="default"
          />
          <MetricCard
            title="Resolvidos Hoje"
            value={87}
            icon={CheckCircle}
            trend="+8% desde ontem"
            variant="success"
          />
          <MetricCard
            title="Tempo Médio"
            value="4.2m"
            icon={Clock}
            trend="-15% desde ontem"
            variant="accent"
          />
          <MetricCard
            title="Satisfação"
            value="94%"
            icon={TrendingUp}
            trend="+3% desde semana passada"
            variant="success"
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Agentes Ativos</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <AgentCard key={agent.name} {...agent} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
