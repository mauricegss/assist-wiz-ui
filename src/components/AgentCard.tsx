import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, CheckCircle, Clock } from "lucide-react";

interface AgentCardProps {
  name: string;
  description: string;
  status: "active" | "idle" | "processing";
  tasksCompleted: number;
}

const AgentCard = ({ name, description, status, tasksCompleted }: AgentCardProps) => {
  const statusConfig = {
    active: { color: "bg-success", label: "Ativo", icon: CheckCircle },
    idle: { color: "bg-muted", label: "Ocioso", icon: Clock },
    processing: { color: "bg-warning", label: "Processando", icon: Clock },
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <Card className="hover:shadow-md transition-smooth border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{name}</CardTitle>
              <CardDescription className="text-sm mt-1">{description}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <div className={`w-2 h-2 rounded-full ${statusConfig[status].color}`} />
            {statusConfig[status].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground">
          <StatusIcon className="h-4 w-4 mr-1" />
          <span>{tasksCompleted} tarefas completadas</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentCard;
