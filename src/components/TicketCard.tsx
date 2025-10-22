import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, User, Clock } from "lucide-react";

interface TicketCardProps {
  id: string;
  customer: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "escalated";
  priority: "low" | "medium" | "high";
  timestamp: string;
  onClick?: () => void;
}

const TicketCard = ({
  id,
  customer,
  subject,
  message,
  status,
  priority,
  timestamp,
  onClick,
}: TicketCardProps) => {
  const statusConfig = {
    open: { label: "Aberto", variant: "default" as const },
    in_progress: { label: "Em Progresso", variant: "default" as const },
    resolved: { label: "Resolvido", variant: "default" as const },
    escalated: { label: "Escalonado", variant: "destructive" as const },
  };

  const priorityConfig = {
    low: { label: "Baixa", color: "text-muted-foreground" },
    medium: { label: "Média", color: "text-warning" },
    high: { label: "Alta", color: "text-destructive" },
  };

  return (
    <Card className="hover:shadow-md transition-smooth cursor-pointer border-border" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={statusConfig[status].variant}>{statusConfig[status].label}</Badge>
              <span className={`text-xs font-medium ${priorityConfig[priority].color}`}>
                {priorityConfig[priority].label}
              </span>
            </div>
            <CardTitle className="text-base font-semibold mb-1">#{id}</CardTitle>
            <p className="text-sm font-medium text-foreground">{subject}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{message}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{customer}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{timestamp}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-7 gap-1">
            <MessageSquare className="h-3 w-3" />
            Responder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketCard;
