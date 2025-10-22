import { useState } from "react";
import ChatMessage from "@/components/ChatMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá! Sou o assistente de atendimento. Como posso ajudar você hoje?",
      timestamp: "10:00",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const now = new Date();
    const timestamp = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;

    setMessages([
      ...messages,
      { role: "user", content: input, timestamp },
      {
        role: "assistant",
        content:
          "Entendi sua solicitação. Estou analisando e vou encaminhar para o agente mais adequado.",
        timestamp,
      },
    ]);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col shadow-lg">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-xl font-semibold text-foreground">Chat de Atendimento</h2>
          <p className="text-sm text-muted-foreground">Powered by SupportAI</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} {...msg} />
          ))}
        </div>

        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Digite sua mensagem..."
              className="flex-1"
            />
            <Button onClick={handleSend} className="bg-primary hover:bg-primary/90">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Chat;
