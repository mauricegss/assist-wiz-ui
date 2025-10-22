import { useState, useEffect } from "react";
import AgentCard from "@/components/AgentCard";
import { AlertCircle, Loader2 } from "lucide-react"; // Importar ícones
import { Button } from "@/components/ui/button"; // Para botão de tentar novamente

// Interface para o tipo de Agente (igual ao backend)
interface Agent {
  name: string;
  description: string;
  status: "active" | "idle" | "processing";
  tasksCompleted: number;
}

const ActiveAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar os dados dos agentes
  const fetchAgents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:8000/api/agents");
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      const data: Agent[] = await response.json();
      setAgents(data);
    } catch (err) {
      console.error("Erro ao buscar agentes:", err);
      setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido");
      setAgents([]); // Limpa agentes em caso de erro
    } finally {
      setIsLoading(false);
    }
  };

  // Busca os agentes ao montar o componente
  useEffect(() => {
    fetchAgents();

    // Opcional: Atualizar os dados periodicamente (ex: a cada 30 segundos)
    const intervalId = setInterval(fetchAgents, 30000); // 30000 ms = 30 segundos

    // Limpa o intervalo quando o componente é desmontado
    return () => clearInterval(intervalId);
  }, []); // Array vazio significa que executa apenas uma vez ao montar (e depois pelo intervalo)


  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Agentes Ativos</h1>
          <p className="text-muted-foreground">
            Monitore o status e desempenho de cada agente especializado (atualiza a cada 30s)
          </p>
        </div>

        {/* Exibição condicional: Loading, Erro, Lista ou Vazio */}
        {isLoading && agents.length === 0 ? ( // Mostra loading apenas na primeira carga
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Carregando agentes...</p>
          </div>
        ) : error ? (
           <div className="text-center py-12 text-destructive">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Erro ao carregar agentes: {error}</p>
            <Button onClick={fetchAgents} variant="outline" size="sm" className="mt-4">Tentar Novamente</Button>
          </div>
        ) : agents.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {agents.map((agent) => (
              // O AgentCard já espera as props corretas
              <AgentCard key={agent.name} {...agent} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum agente encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveAgents;