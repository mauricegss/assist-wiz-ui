import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

const ChatMessage = ({ role, content, timestamp }: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3 mb-4", isUser ? "flex-row-reverse" : "flex-row")}>
      <Avatar className={cn("h-8 w-8", isUser ? "bg-secondary" : "bg-gradient-primary")}>
        <AvatarFallback>
          {isUser ? (
            <User className="h-4 w-4 text-secondary-foreground" />
          ) : (
            <Bot className="h-4 w-4 text-primary-foreground" />
          )}
        </AvatarFallback>
      </Avatar>
      <div className={cn("flex flex-col max-w-[70%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-lg px-4 py-2",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-card-foreground"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>
        {timestamp && <span className="text-xs text-muted-foreground mt-1">{timestamp}</span>}
      </div>
    </div>
  );
};

export default ChatMessage;
