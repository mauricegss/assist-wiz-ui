import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from typing import List, Dict, Literal, Optional
from datetime import datetime
import random

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

# --- CONFIGURAÇÃO INICIAL E CARREGAMENTO DO MODELO ---
try:
    # Tente carregar a chave da API do ambiente
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key:
        raise ValueError("Variável de ambiente GOOGLE_API_KEY não definida.")

    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.5, google_api_key=google_api_key)
    print("Modelo LLM (Gemini) carregado com sucesso.")
except Exception as e:
    print(f"Erro fatal ao carregar o LLM: {e}")
    print("Verifique se a variável de ambiente GOOGLE_API_KEY está configurada corretamente.")
    # Em um cenário real, você poderia decidir sair ou continuar com funcionalidade limitada
    # exit() # Descomente se quiser que a aplicação pare se o LLM não carregar
    llm = None # Define como None para tratamento posterior nos endpoints
    print("AVISO: LLM não carregado. Funcionalidades de IA estarão indisponíveis.")


# --- SIMULAÇÃO DE BANCO DE DADOS EM MEMÓRIA ---
mock_db = {
    "tickets": [
        { "id": "1001", "customer": "João Silva", "subject": "Pedido não chegou", "message": "Meu pedido não chegou e já faz 10 dias. Gostaria de saber o status.", "status": "open", "priority": "high", "timestamp": "2025-10-22T10:05:00Z" },
        { "id": "1002", "customer": "Maria Santos", "subject": "Problema com pagamento", "message": "Fui cobrada duas vezes pelo mesmo pedido. Preciso de ajuda urgente.", "status": "in_progress", "priority": "high", "timestamp": "2025-10-22T10:15:00Z" },
        { "id": "1003", "customer": "Pedro Costa", "subject": "Dúvida sobre produto", "message": "Gostaria de saber se este produto é compatível com meu dispositivo.", "status": "in_progress", "priority": "medium", "timestamp": "2025-10-22T10:30:00Z" },
        { "id": "1004", "customer": "Ana Oliveira", "subject": "Solicitação de reembolso", "message": "Recebi o produto com defeito e gostaria de solicitar o reembolso.", "status": "escalated", "priority": "high", "timestamp": "2025-10-22T11:00:00Z" },
        { "id": "1005", "customer": "Carlos Lima", "subject": "Atualização de endereço", "message": "Preciso atualizar o endereço de entrega do meu pedido em andamento.", "status": "resolved", "priority": "low", "timestamp": "2025-10-22T12:00:00Z" },
    ],
    "agents": [
        { "name": "Atendimento Inicial", "description": "Responde perguntas frequentes e coleta informações", "status": "active", "tasksCompleted": 142 },
        { "name": "Diagnóstico Técnico", "description": "Resolve problemas via APIs internas", "status": "processing", "tasksCompleted": 87 },
        { "name": "Escalonamento", "description": "Encaminha casos complexos para humanos", "status": "active", "tasksCompleted": 34 },
        { "name": "Feedback", "description": "Solicita avaliação e analisa sentimentos", "status": "idle", "tasksCompleted": 156 },
    ],
    "settings": {
        "companyName": "SupportAI",
        "contactEmail": "contato@supportai.com",
        "autoResponse": True,
        "techDiagnosis": True,
        "smartEscalation": True,
        "sentimentAnalysis": True,
        "notifyNewTickets": True,
        "notifyEscalatedTickets": True,
    }
}
next_ticket_id = 1006

# --- DEFINIÇÃO DA API COM FASTAPI ---
app = FastAPI(title="SupportAI API", description="API para o sistema de atendimento inteligente")

app.add_middleware(
    CORSMiddleware,
    # Permite origens específicas (mais seguro para produção)
    # allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    # Permite todas as origens (mais fácil para desenvolvimento)
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"], # Permite todos os métodos (GET, POST, etc.)
    allow_headers=["*"], # Permite todos os cabeçalhos
)

# --- MODELOS PYDANTIC ---

# Modelos para Chat (Agentes)
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None # Tornar opcional, embora recomendado

class ChatResponse(BaseModel):
    response: str

# Modelos para Tickets
TicketStatus = Literal["open", "in_progress", "resolved", "escalated"]
TicketPriority = Literal["low", "medium", "high"]

class Ticket(BaseModel):
    id: str
    customer: str
    subject: str
    message: str
    status: TicketStatus
    priority: TicketPriority
    timestamp: str # Usar string ISO 8601 para timestamps

class TicketCreate(BaseModel): # Modelo para criar novo ticket (opcional)
    customer: str
    subject: str
    message: str
    priority: TicketPriority = "medium"

# Modelos para Agentes
AgentStatus = Literal["active", "idle", "processing"]

class Agent(BaseModel):
    name: str
    description: str
    status: AgentStatus
    tasksCompleted: int

# Modelos para Dashboard
class DashboardMetrics(BaseModel):
    activeTickets: int
    resolvedToday: int
    avgResponseTimeMinutes: float # Usar float para tempo médio
    satisfactionRate: float # Usar float para percentual

# Modelos para Configurações
class SettingsModel(BaseModel):
    companyName: str = Field(..., examples=["Minha Empresa"])
    contactEmail: str = Field(..., examples=["contato@minhaempresa.com"])
    autoResponse: bool
    techDiagnosis: bool
    smartEscalation: bool
    sentimentAnalysis: bool
    notifyNewTickets: bool
    notifyEscalatedTickets: bool


# --- DEFINIÇÃO DOS AGENTES (PROMPTS SEM CONTEXTO) ---

# Função helper para invocar LLM com tratamento de erro
def invoke_llm_safe(chain, input_data):
    if llm is None:
        # Retorna uma resposta padrão ou erro se o LLM não carregou
        print("AVISO: Tentativa de usar agente de IA, mas o LLM não está carregado.")
        if "escalonamento" in chain.prompt.template:
             return "ERRO: O agente de IA para escalonamento não está disponível. Por favor, resuma manualmente."
        if "feedback" in chain.prompt.template:
             return "Obrigado por usar nossos serviços! Gostaríamos muito de ouvir sua opinião."
        return "Desculpe, o serviço de inteligência artificial está temporariamente indisponível."

    try:
        # Invoca a chain normalmente
        return chain.invoke(input_data)
    except Exception as e:
        print(f"Erro ao invocar a chain: {e}")
        # Retorna uma mensagem de erro mais amigável para o usuário
        return f"Desculpe, ocorreu um erro ao processar sua solicitação com a IA ({e}). Tente novamente mais tarde."


# 1. Agente de Atendimento Inicial
prompt_atendimento = ChatPromptTemplate.from_template("""
    Você é um assistente de "Atendimento Inicial" de suporte ao cliente da empresa {company_name}.
    Sua missão é responder perguntas frequentes e coletar informações básicas sobre o problema do cliente, usando seu conhecimento geral e o contexto da conversa, se aplicável.
    Seja amigável, profissional e prestativo. Pergunte o nome do cliente se ainda não souber.
    Se a pergunta for muito específica ou técnica, sugira que o cliente pode pedir um diagnóstico técnico.
    Se o cliente parecer frustrado ou o problema complexo, sugira escalonar para um humano.

    Contexto da conversa anterior (se houver):
    {history}

    PERGUNTA/MENSAGEM ATUAL DO USUÁRIO:
    {question}

    RESPOSTA DO ASSISTENTE INICIAL:
""")
chain_atendimento = prompt_atendimento | (llm if llm else StrOutputParser()) | StrOutputParser() # Usa LLM se disponível


# 2. Agente de Diagnóstico Técnico
prompt_diagnostico = ChatPromptTemplate.from_template("""
    Você é um "Agente de Diagnóstico Técnico" Nível 1 da empresa {company_name}. O usuário está com um problema descrito no histórico e na última mensagem.
    Seu trabalho é usar seu vasto conhecimento técnico para:
    1. Analisar o histórico da conversa E a última mensagem do usuário.
    2. Identificar o problema técnico principal.
    3. Sugerir passos claros e numerados (passo a passo) que o usuário pode tentar para resolver o problema.
    4. Se não for possível diagnosticar ou os passos não funcionarem, informe que o próximo passo seria escalonar para um especialista.
    Pense como um técnico experiente e didático.

    HISTÓRICO DA CONVERSA:
    {history}

    PROBLEMA/MENSAGEM ATUAL DO USUÁRIO:
    {question}

    PASSOS DE DIAGNÓSTICO TÉCNICO:
""")
chain_diagnostico = prompt_diagnostico | (llm if llm else StrOutputParser()) | StrOutputParser()


# 3. Agente de Escalonamento
prompt_escalonamento = ChatPromptTemplate.from_template("""
    Você é um "Agente de Escalonamento". Sua função é analisar um histórico de chat de suporte da empresa {company_name} e resumir concisamente o problema para um atendente humano.
    Inclua:
    1. O nome do cliente (se mencionado).
    2. O problema principal reportado.
    3. Quais passos de diagnóstico (se houver) já foram tentados.
    4. O sentimento aparente do cliente (Calmo, Frustrado, Urgente, etc.).
    Seja direto ao ponto. Use o formato:
    **Resumo para Atendente:**
    **Cliente:** [Nome ou "Não informado"]
    **Problema:** [Descrição curta do problema]
    **Tentativas:** [Passos tentados ou "Nenhuma tentativa registrada"]
    **Sentimento:** [Sentimento observado]

    HISTÓRICO DA CONVERSA PARA ANÁLISE:
    {history}

    ÚLTIMA MENSAGEM DO USUÁRIO (pode indicar o motivo do escalonamento):
    {question}

    RESUMO GERADO:
""")
chain_escalonamento = prompt_escalonamento | (llm if llm else StrOutputParser()) | StrOutputParser()


# 4. Agente de Feedback
prompt_feedback = ChatPromptTemplate.from_template("""
    Você é o "Agente de Feedback" da empresa {company_name}. O atendimento parece estar sendo concluído.
    Sua missão é:
    1. Agradecer ao usuário pelo contato.
    2. Analisar o sentimento geral do HISTÓRICO DA CONVERSA (Positivo, Negativo ou Neutro) de forma sutil na sua resposta (não diga explicitamente "Sentimento: X"). Ex: Se negativo, "Lamentamos que tenha tido problemas..."; se positivo, "Ficamos felizes em ajudar!".
    3. Pedir educadamente uma avaliação ou comentário sobre o suporte para ajudar a melhorar.

    HISTÓRICO DA CONVERSA PARA ANÁLISE:
    {history}

    ÚLTIMA MENSAGEM DO USUÁRIO (pode indicar a conclusão):
    {question}

    RESPOSTA DE FEEDBACK:
""")
chain_feedback = prompt_feedback | (llm if llm else StrOutputParser()) | StrOutputParser()


# --- ENDPOINTS DA API ---

# Endpoint para Agentes de Chat
@app.post("/api/chat/{agent_name}", response_model=ChatResponse, tags=["Chat Agents"])
async def chat_agent(agent_name: Literal["atendimento", "diagnostico", "escalonamento", "feedback"], request: ChatRequest) -> ChatResponse:
    """Recebe uma mensagem e direciona para o agente de IA especificado."""

    chain = None
    if agent_name == "atendimento":
        chain = chain_atendimento
    elif agent_name == "diagnostico":
        chain = chain_diagnostico
    elif agent_name == "escalonamento":
        chain = chain_escalonamento
    elif agent_name == "feedback":
        chain = chain_feedback
    else:
        # Este caso não deve ocorrer devido ao Literal, mas é bom ter um fallback
        raise HTTPException(status_code=404, detail="Agente não encontrado")

    # Simplesmente passamos a mensagem do usuário como 'question'.
    # O prompt de cada agente decide como usar essa informação (se é pergunta direta, histórico, etc.)
    # Adicionamos history (vazio por enquanto) e company_name para os prompts que os usam
    input_data = {
        "question": request.message,
        "history": "", # Em uma implementação real, buscaria o histórico da session_id
        "company_name": mock_db["settings"]["companyName"] # Pega o nome da empresa das configurações
    }

    # Invoca a chain específica com tratamento de erro
    bot_response = invoke_llm_safe(chain, input_data)

    return ChatResponse(response=bot_response)

# Endpoint para Tickets
@app.get("/api/tickets", response_model=List[Ticket], tags=["Tickets"])
async def get_tickets(status: Optional[TicketStatus] = None, priority: Optional[TicketPriority] = None, search: Optional[str] = None):
    """Lista os tickets, com filtros opcionais por status, prioridade e busca."""
    tickets = mock_db["tickets"]
    if status:
        tickets = [t for t in tickets if t["status"] == status]
    if priority:
        tickets = [t for t in tickets if t["priority"] == priority]
    if search:
        search_lower = search.lower()
        tickets = [t for t in tickets if
                   search_lower in t["id"].lower() or
                   search_lower in t["customer"].lower() or
                   search_lower in t["subject"].lower() or
                   search_lower in t["message"].lower()]
    # Ordena por timestamp descendente (mais recentes primeiro)
    tickets.sort(key=lambda x: x["timestamp"], reverse=True)
    return tickets

# Endpoint para obter um ticket específico (opcional)
@app.get("/api/tickets/{ticket_id}", response_model=Ticket, tags=["Tickets"])
async def get_ticket(ticket_id: str):
    """Obtém detalhes de um ticket específico."""
    ticket = next((t for t in mock_db["tickets"] if t["id"] == ticket_id), None)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    return ticket

# Endpoint para criar um novo ticket (exemplo)
@app.post("/api/tickets", response_model=Ticket, status_code=201, tags=["Tickets"])
async def create_ticket(ticket_data: TicketCreate):
    """Cria um novo ticket."""
    global next_ticket_id
    new_ticket = Ticket(
        id=str(next_ticket_id),
        customer=ticket_data.customer,
        subject=ticket_data.subject,
        message=ticket_data.message,
        status="open",
        priority=ticket_data.priority,
        timestamp=datetime.utcnow().isoformat() + "Z" # Formato ISO 8601 UTC
    )
    mock_db["tickets"].append(new_ticket.dict())
    next_ticket_id += 1
    return new_ticket


# Endpoint para Agentes Ativos
@app.get("/api/agents", response_model=List[Agent], tags=["Agents"])
async def get_agents():
    """Lista o status atual dos agentes."""
    # Simula alguma variação no status e tasks para dinamismo
    for agent in mock_db["agents"]:
        if agent["name"] != "Feedback": # Feedback fica mais ocioso
             agent["status"] = random.choice(["active", "processing", "idle", "active", "active"]) # Mais chance de active
        else:
             agent["status"] = random.choice(["active", "idle", "idle", "idle"]) # Mais chance de idle
        if agent["status"] != "idle":
             agent["tasksCompleted"] += random.randint(0, 2)
    return mock_db["agents"]

# Endpoint para Dashboard
@app.get("/api/dashboard/metrics", response_model=DashboardMetrics, tags=["Dashboard"])
async def get_dashboard_metrics():
    """Retorna as métricas principais para o dashboard."""
    active_tickets = len([t for t in mock_db["tickets"] if t["status"] in ["open", "in_progress", "escalated"]])
    # Simula resolvidos hoje (simplificado)
    resolved_today = len([t for t in mock_db["tickets"] if t["status"] == "resolved" and t["timestamp"].startswith(datetime.utcnow().strftime('%Y-%m-%d'))]) + random.randint(5, 15)
    # Simula outras métricas
    avg_response_time = round(random.uniform(3.0, 7.0), 1)
    satisfaction = round(random.uniform(90.0, 98.0), 1)

    return DashboardMetrics(
        activeTickets=active_tickets,
        resolvedToday=resolved_today,
        avgResponseTimeMinutes=avg_response_time,
        satisfactionRate=satisfaction
    )

# Endpoint para Configurações
@app.get("/api/settings", response_model=SettingsModel, tags=["Settings"])
async def get_settings():
    """Retorna as configurações atuais do sistema."""
    return mock_db["settings"]

@app.put("/api/settings", response_model=SettingsModel, tags=["Settings"])
async def update_settings(settings: SettingsModel):
    """Atualiza as configurações do sistema."""
    mock_db["settings"] = settings.dict()
    print("Configurações atualizadas:", mock_db["settings"]) # Log no console
    # Atualiza o nome da empresa nos prompts que o utilizam
    global prompt_atendimento, prompt_diagnostico, prompt_escalonamento, prompt_feedback
    global chain_atendimento, chain_diagnostico, chain_escalonamento, chain_feedback

    # Recria prompts e chains com o novo nome da empresa
    # (Em um sistema real, isso pode ser mais otimizado)
    company_name = mock_db["settings"]["companyName"]

    prompt_atendimento = ChatPromptTemplate.from_template(prompt_atendimento.template.replace("{company_name}", company_name))
    chain_atendimento = prompt_atendimento | (llm if llm else StrOutputParser()) | StrOutputParser()

    prompt_diagnostico = ChatPromptTemplate.from_template(prompt_diagnostico.template.replace("{company_name}", company_name))
    chain_diagnostico = prompt_diagnostico | (llm if llm else StrOutputParser()) | StrOutputParser()

    prompt_escalonamento = ChatPromptTemplate.from_template(prompt_escalonamento.template.replace("{company_name}", company_name))
    chain_escalonamento = prompt_escalonamento | (llm if llm else StrOutputParser()) | StrOutputParser()

    prompt_feedback = ChatPromptTemplate.from_template(prompt_feedback.template.replace("{company_name}", company_name))
    chain_feedback = prompt_feedback | (llm if llm else StrOutputParser()) | StrOutputParser()

    return mock_db["settings"]


# --- ROTA RAIZ (Opcional) ---
@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Bem-vindo à API SupportAI!"}


# --- INICIALIZAÇÃO DA API ---
if __name__ == "__main__":
    import uvicorn
    print("Iniciando a API SupportAI (Assist-Wiz-UI) em http://localhost:8000")
    # Use reload=True apenas para desenvolvimento
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)