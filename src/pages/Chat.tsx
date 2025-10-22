import { useState, useRef, useEffect, KeyboardEvent, FormEvent } from "react";
import ChatMessage from "@/components/ChatMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Settings, UserCheck, MessageSquareWarning, BotMessageSquare } from "lucide-react"; // Importar ícones extras

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string; // Formato HH:MM
}

// Define o tipo para os nomes dos agentes que correspondem aos endpoints
type AgentName = "atendimento" | "diagnostico" | "escalonamento" | "feedback";

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "Olá! Sou o assistente de atendimento. Como posso ajudar você hoje?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Gera ID de sessão ao montar
  useEffect(() => {
    if (!sessionId) {
      const generatedSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setSessionId(generatedSessionId);
      console.log("Session ID gerado:", generatedSessionId); // Para depuração
    }
  }, [sessionId]);

  // Função para adicionar mensagem
  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage: Message = {
      id: `${role}-${Date.now()}-${Math.random()}`,
      role,
      content: content.trim(),
      timestamp,
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  // Função para rolar para o fim
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      // Usar scrollIntoView na última mensagem pode ser mais robusto
      scrollAreaRef.current.lastElementChild?.scrollIntoView({ behavior: "smooth" });
      // Ou manter o scrollTop se preferir:
      // scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  // Efeito para rolar quando mensagens mudam
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100); // Pequeno delay para garantir renderização
    return () => clearTimeout(timer);
  }, [messages]);

  // Função genérica para chamar API do agente
  const callApi = async (agentName: AgentName, messageContent: string) => {
    if (!messageContent || isLoading || !sessionId) {
        console.warn("Chamada de API bloqueada:", { messageContent, isLoading, sessionId });
        if (!sessionId) addMessage('assistant', "Erro: ID da sessão não está definido.");
        return;
    };

    setIsLoading(true);
    console.log(`Chamando agente: ${agentName} com session_id: ${sessionId}`); // Log

    // Constrói o histórico da conversa para agentes que precisam dele
    const chatHistory = messages.map(msg => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`).join('\n');
    // Para atendimento, só a última msg. Para outros, histórico + última msg/pedido.
    const messageToSend = agentName === 'atendimento'
        ? messageContent
        : `Histórico:\n${chatHistory}\n\nProblema/Pedido Atual: ${messageContent}`;

    const endpoint = `/api/chat/${agentName}`; // Endpoint dinâmico

    try {
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        let errorMsg = `Erro HTTP! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.detail || JSON.stringify(errorData) || errorMsg; // Tenta pegar 'detail' do FastAPI
        } catch (e) { /* ignorar erro no parsing do erro */ }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (data.response) {
        addMessage('assistant', data.response);
      } else {
        addMessage('assistant', 'Desculpe, não recebi uma resposta válida do servidor.');
      }
    } catch (error) {
      console.error(`Erro ao chamar ${endpoint}:`, error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      addMessage('assistant', `Desculpe, ocorreu um erro ao conectar ao agente "${agentName}". (${errorMsg})`);
    } finally {
      setIsLoading(false);
      // Focar no input apenas se não foi uma ação de botão que limpou o input
      if (inputRef.current?.value === "") {
         inputRef.current?.focus();
      }
    }
  };

  // Submit do formulário (envio de mensagem normal)
  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    const userMessage = inputValue.trim();
    if (!userMessage || isLoading) return;

    addMessage('user', userMessage);
    setInputValue(''); // Limpa input
    await callApi('atendimento', userMessage); // Chama o atendimento inicial por padrão
  };

  // Função para chamar agentes específicos via botões
  const handleAgentAction = async (agentName: AgentName) => {
      // Pega a última mensagem do usuário OU o texto no input como contexto principal
      const lastUserMessage = messages.slice().reverse().find(msg => msg.role === 'user');
      const contextMessage = inputValue.trim() || lastUserMessage?.content || "Por favor, analise a situação e continue.";

      // Adiciona uma mensagem indicando a ação, se não houver input novo e houver msg anterior
      if (!inputValue.trim() && lastUserMessage) {
         addMessage('user', `(Solicitando ${agentName} sobre: "${lastUserMessage.content}")`);
      }
      // Se houver texto no input, usa ele e indica a ação
      else if (inputValue.trim()) {
         addMessage('user', inputValue.trim() + ` (Solicitando ${agentName})`);
      }
      // Se não houver input nem mensagem anterior (pouco provável, mas seguro)
      else {
         addMessage('user', `(Solicitando ${agentName})`);
      }

      setInputValue(''); // Limpa input após confirmar a ação
      await callApi(agentName, contextMessage); // Chama o agente específico
  };

  // Handler para tecla Enter no Input
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !isLoading) { // Previne submit duplo com isLoading
      event.preventDefault();
      handleSubmit(); // Chama a função de envio padrão (atendimento)
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[calc(100vh-4rem)] flex flex-col shadow-lg border border-border">
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-xl font-semibold text-foreground">Chat de Atendimento</h2>
          <p className="text-sm text-muted-foreground">ID da Sessão: {sessionId || "Gerando..."}</p>
        </div>

        {/* Área de Mensagens */}
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
          ))}
          {/* Indicador de Loading */}
          {isLoading && (
             <ChatMessage role="assistant" content="..." timestamp={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
          )}
        </div>

        {/* Área de Ações */}
        <div className="border-t border-border p-2 flex flex-wrap justify-start gap-2 bg-background/50">
             <Button variant="outline" size="sm" onClick={() => handleAgentAction('atendimento')} disabled={isLoading} title="Chamar Atendimento Inicial (padrão ao enviar)">
                <BotMessageSquare className="h-4 w-4 mr-1" /> Atendimento
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleAgentAction('diagnostico')} disabled={isLoading} title="Solicitar Diagnóstico Técnico">
                <Settings className="h-4 w-4 mr-1" /> Diagnóstico
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleAgentAction('escalonamento')} disabled={isLoading} title="Escalonar para Atendente Humano">
                <MessageSquareWarning className="h-4 w-4 mr-1" /> Escalonar
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleAgentAction('feedback')} disabled={isLoading} title="Finalizar e dar Feedback">
                <UserCheck className="h-4 w-4 mr-1" /> Feedback
            </Button>
        </div>

        {/* Área de Input */}
        <div className="border-t border-border p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem ou use uma ação acima..."
              className="flex-1"
              disabled={isLoading}
              autoComplete="off"
            />
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
              disabled={isLoading || (!inputValue.trim() && messages.length <= 1)} // Desabilita se carregando ou vazio E sem histórico
              title="Enviar mensagem para Atendimento Inicial"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default Chat;