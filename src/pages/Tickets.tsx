import { useState } from "react";
import TicketCard from "@/components/TicketCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";

const Tickets = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const tickets = [
    {
      id: "1001",
      customer: "João Silva",
      subject: "Pedido não chegou",
      message: "Meu pedido não chegou e já faz 10 dias. Gostaria de saber o status.",
      status: "open" as const,
      priority: "high" as const,
      timestamp: "há 5 min",
    },
    {
      id: "1002",
      customer: "Maria Santos",
      subject: "Problema com pagamento",
      message: "Fui cobrada duas vezes pelo mesmo pedido. Preciso de ajuda urgente.",
      status: "in_progress" as const,
      priority: "high" as const,
      timestamp: "há 15 min",
    },
    {
      id: "1003",
      customer: "Pedro Costa",
      subject: "Dúvida sobre produto",
      message: "Gostaria de saber se este produto é compatível com meu dispositivo.",
      status: "in_progress" as const,
      priority: "medium" as const,
      timestamp: "há 30 min",
    },
    {
      id: "1004",
      customer: "Ana Oliveira",
      subject: "Solicitação de reembolso",
      message: "Recebi o produto com defeito e gostaria de solicitar o reembolso.",
      status: "escalated" as const,
      priority: "high" as const,
      timestamp: "há 1h",
    },
    {
      id: "1005",
      customer: "Carlos Lima",
      subject: "Atualização de endereço",
      message: "Preciso atualizar o endereço de entrega do meu pedido em andamento.",
      status: "resolved" as const,
      priority: "low" as const,
      timestamp: "há 2h",
    },
  ];

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.includes(searchTerm)
  );

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
              placeholder="Buscar por ticket, cliente ou assunto..."
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTickets.map((ticket) => (
            <TicketCard key={ticket.id} {...ticket} />
          ))}
        </div>

        {filteredTickets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum ticket encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tickets;
