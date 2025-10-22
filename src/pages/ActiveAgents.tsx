import AgentCard from "@/components/AgentCard";

const ActiveAgents = () => {
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Agentes Ativos</h1>
          <p className="text-muted-foreground">
            Monitore o status e desempenho de cada agente especializado
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {agents.map((agent) => (
            <AgentCard key={agent.name} {...agent} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActiveAgents;
