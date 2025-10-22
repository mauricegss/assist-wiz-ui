import { useState, useRef, useEffect, KeyboardEvent, FormEvent } from "react";
import ChatMessage from "@/components/ChatMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send } from "lucide-react";

// Interface original mantida
interface Message {
  id: string; // Adicionado ID para key do React
  role: "user" | "assistant";
  content: string;
  timestamp: string; // Mantido como string HH:MM
}

const Chat = () => {
  // Estado inicial como no seu original, mas com ID
  const [messages, setMessages] = useState<Message[]>([
    {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "Olá! Sou o assistente de atendimento. Como posso ajudar você hoje?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), // Timestamp dinâmico inicial
    },
  ]);
  // Renomeado para clareza
  const [inputValue, setInputValue] = useState("");
  // Estado para indicar carregamento da resposta do bot
  const [isLoading, setIsLoading] = useState(false);
  // Estado para ID da sessão
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Refs para input e área de scroll
  const scrollAreaRef = useRef<HTMLDivElement>(null); // Ref para a div rolável
  const inputRef = useRef<HTMLInputElement>(null);    // Ref para o input

  // Gera ID de sessão ao montar
  useEffect(() => {
    if (!sessionId) {
      setSessionId(`session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
    }
  }, [sessionId]);

  // Função para adicionar mensagem (adaptada para ID e timestamp string)
  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Formato HH:MM
    const newMessage: Message = {
      id: `${role}-${Date.now()}-${Math.random()}`,
      role,
      content: content.trim(),
      timestamp,
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  // Função para rolar para o fim (usa a ref na div correta)
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  // Efeito para rolar quando mensagens mudam
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100); // Pequeno delay
    return () => clearTimeout(timer);
  }, [messages]);


  // Função principal para enviar mensagem ao backend
  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    const userMessage = inputValue.trim();

    if (!userMessage || isLoading) return;

    addMessage('user', userMessage); // Adiciona a msg do usuário imediatamente
    setInputValue(''); // Limpa input
    setIsLoading(true); // Mostra indicador de carregamento

    try {
      const response = await fetch('http://localhost:5001/chat', { // URL do backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch (e) {/* ignorar */}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (data.reply) {
        addMessage('assistant', data.reply); // Adiciona resposta do bot
      } else {
        addMessage('assistant', 'Desculpe, não recebi uma resposta válida.');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      addMessage('assistant', `Desculpe, erro ao conectar: (${errorMsg})`);
    } finally {
      setIsLoading(false); // Esconde indicador de carregamento
      inputRef.current?.focus(); // Foca no input novamente
    }
  };

  // Handler para tecla Enter no Input (substitui onKeyPress)
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(); // Chama a função de envio
    }
  };


  // JSX Original com modificações para usar estados/handlers
  return (
    // Mantém seu container principal
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      {/* Mantém seu Card principal */}
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col shadow-lg">
        {/* Mantém seu Header */}
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-xl font-semibold text-foreground">Chat de Atendimento</h2>
          <p className="text-sm text-muted-foreground">Powered by SupportAI</p>
        </div>

        {/* Área de Mensagens - Adiciona a Ref aqui */}
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-6">
          {/* Mapeia o estado 'messages' */}
          {messages.map((msg) => (
            // Usa o ID como key e passa props corretas
            <ChatMessage key={msg.id} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
          ))}
          {/* Indicador de Loading - Usa ChatMessage */}
          {isLoading && (
             <ChatMessage role="assistant" content="..." timestamp={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
          )}
        </div>

        {/* Área de Input - Usa form para submit e handlers corretos */}
        <div className="border-t border-border p-4">
          {/* Adiciona <form> para semântica e submit */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef} // Adiciona ref ao input
              value={inputValue} // Usa estado inputValue
              onChange={(e) => setInputValue(e.target.value)} // Atualiza estado
              onKeyDown={handleKeyDown} // Usa onKeyDown para Enter
              placeholder="Digite sua mensagem..."
              className="flex-1"
              disabled={isLoading} // Desabilita enquanto carrega
              autoComplete="off"
            />
            <Button
              type="submit" // Define como submit do form
              // onClick não é mais necessário aqui, o form cuida disso
              className="bg-primary hover:bg-primary/90"
              disabled={isLoading || !inputValue.trim()} // Desabilita se carregando ou vazio
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