import MetricCard from "@/components/MetricCard";
import { MessageSquare, CheckCircle, Clock, TrendingUp } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard de Atendimento</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho dos agentes em tempo real</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </div>
    </div>
  );
};

export default Dashboard;
