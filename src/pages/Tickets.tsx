import { useState, useEffect } from "react";
import TicketCard from "@/components/TicketCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, AlertCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow, parseISO } from 'date-fns'; // Para formatar timestamps
import { ptBR } from 'date-fns/locale'; // Para localização pt-BR

// Interface para o tipo de Ticket (igual ao backend)
interface Ticket {
  id: string;
  customer: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "escalated";
  priority: "low" | "medium" | "high";
  timestamp: string; // Vem como ISO string da API
}

const Tickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Busca os tickets da API ao montar o componente
  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:8000/api/tickets");
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        const data: Ticket[] = await response.json();
        setTickets(data);
        setFilteredTickets(data); // Inicialmente, todos os tickets são filtrados
      } catch (err) {
        console.error("Erro ao buscar tickets:", err);
        setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido");
        setTickets([]); // Limpa tickets em caso de erro
        setFilteredTickets([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, []); // Array vazio significa que executa apenas uma vez ao montar

  // Filtra os tickets localmente quando o searchTerm muda
  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const result = tickets.filter(
      (ticket) =>
        ticket.subject.toLowerCase().includes(lowerSearchTerm) ||
        ticket.customer.toLowerCase().includes(lowerSearchTerm) ||
        ticket.id.toLowerCase().includes(lowerSearchTerm) ||
        ticket.message.toLowerCase().includes(lowerSearchTerm) // Adiciona busca na mensagem
    );
    setFilteredTickets(result);
  }, [searchTerm, tickets]); // Re-executa quando searchTerm ou tickets originais mudam


  // Função para formatar o timestamp
  const formatRelativeTime = (timestamp: string): string => {
    try {
        const date = parseISO(timestamp);
        // 'addSuffix: true' adiciona "há" ou "em"
        return formatDistanceToNow(date, { locale: ptBR, addSuffix: true });
    } catch (e) {
        console.error("Erro ao formatar data:", e);
        return "Data inválida"; // Retorna algo padrão em caso de erro
    }
   };


  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Tickets de Suporte</h1>
          <p className="text-muted-foreground">Gerencie todas as solicitações dos clientes</p>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ID, cliente, assunto ou mensagem..."
              className="pl-10"
              disabled={isLoading} // Desabilita busca durante o loading inicial
            />
          </div>
          {/* Botão de Filtros (funcionalidade não implementada) */}
          <Button variant="outline" className="gap-2" disabled>
            <Filter className="h-4 w-4" />
            Filtros (Em breve)
          </Button>
        </div>

        {/* Exibição condicional: Loading, Erro, Lista ou Vazio */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Carregando tickets...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Erro ao carregar tickets: {error}</p>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="mt-4">Tentar Novamente</Button>
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                {...ticket}
                // Passa o timestamp formatado para o componente filho
                timestamp={formatRelativeTime(ticket.timestamp)}
                // Adicione um onClick se quiser abrir detalhes do ticket
                // onClick={() => console.log("Abrir ticket:", ticket.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {tickets.length === 0 ? "Nenhum ticket encontrado no sistema." : "Nenhum ticket corresponde à sua busca."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tickets;