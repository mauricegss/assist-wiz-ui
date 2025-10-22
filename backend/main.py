import os
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

# --- CONFIGURAÇÃO INICIAL E CARREGAMENTO DO MODELO ---
try:
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.5)
    print("Modelo LLM (Gemini) carregado com sucesso.")
except Exception as e:
    print(f"Erro ao carregar o LLM: {e}")
    exit()

# --- DEFINIÇÃO DA API COM FASTAPI ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos Pydantic
class ChatRequest(BaseModel):
    message: str # A pergunta do usuário ou o histórico do chat

class ChatResponse(BaseModel):
    response: str

# --- DEFINIÇÃO DOS 4 AGENTES (PROMPTS SEM CONTEXTO) ---

# 1. Agente de Atendimento Inicial
prompt_atendimento = ChatPromptTemplate.from_template("""
    Você é um assistente de "Atendimento Inicial" de suporte ao cliente.
    Sua missão é responder perguntas frequentes e coletar informações básicas sobre o problema do cliente, usando seu conhecimento geral.
    Seja amigável, profissional e prestativo.
    
    PERGUNTA DO USUÁRIO:
    {question}

    RESPOSTA DO ASSISTENTE INICIAL:
""")
# A "chain" é mais simples: só passa a entrada para o prompt, llm e parser.
chain_atendimento = prompt_atendimento | llm | StrOutputParser()


# 2. Agente de Diagnóstico Técnico
prompt_diagnostico = ChatPromptTemplate.from_template("""
    Você é um "Agente de Diagnóstico Técnico" Nível 1. O usuário está com um problema.
    Seu trabalho é usar seu vasto conhecimento técnico para sugerir passos claros (passo a passo) para tentar resolver o problema.
    Pense como um técnico experiente.

    PROBLEMA DO USUÁRIO:
    {question}

    PASSOS DE DIAGNÓSTICO:
""")
chain_diagnostico = prompt_diagnostico | llm | StrOutputParser()


# 3. Agente de Escalonamento
prompt_escalonamento = ChatPromptTemplate.from_template("""
    Você é um "Agente de Escalonamento". Sua função é analisar um histórico de chat e resumir o problema para um atendente humano.
    Seja conciso e direto ao ponto.

    HISTÓRICO DA CONVERSA (FORNECIDO PELO USUÁRIO):
    {question}

    RESUMO PARA ESCALONAMENTO HUMANO (Ex: "Cliente reporta [Problema]. Já tentou [Passos]."):
""")
chain_escalonamento = prompt_escalonamento | llm | StrOutputParser()


# 4. Agente de Feedback
prompt_feedback = ChatPromptTemplate.from_template("""
    Você é o "Agente de Feedback". O atendimento foi concluído.
    Sua missão é:
    1. Agradecer ao usuário.
    2. Analisar o sentimento geral do HISTÓRICO DA CONVERSA (Positivo, Negativo ou Neutro).
    3. Pedir educadamente uma avaliação ou comentário sobre o suporte.
    
    HISTÓRICO DA CONVERSA (FORNECIDO PELO USUÁRIO):
    {question}

    RESPOSTA DE FEEDBACK E ANÁLISE INTERNA:
    (Ex: "Obrigado por entrar em contato! [Análise de Sentimento: Positivo]. Para melhorarmos, poderia nos dar uma nota?")
""")
chain_feedback = prompt_feedback | llm | StrOutputParser()


# --- ENDPOINTS DA API (um para cada agente) ---

@app.post("/api/atendimento", response_model=ChatResponse)
async def chat_atendimento(request: ChatRequest) -> ChatResponse:
    # Invoca a chain passando o dicionário esperado pelo prompt
    # O LangChain espera {"question": "texto do usuário"} porque o prompt tem {question}
    bot_response = chain_atendimento.invoke({"question": request.message})
    return ChatResponse(response=bot_response)

@app.post("/api/diagnostico", response_model=ChatResponse)
async def chat_diagnostico(request: ChatRequest) -> ChatResponse:
    bot_response = chain_diagnostico.invoke({"question": request.message})
    return ChatResponse(response=bot_response)

@app.post("/api/escalonamento", response_model=ChatResponse)
async def chat_escalonamento(request: ChatRequest) -> ChatResponse:
    bot_response = chain_escalonamento.invoke({"question": request.message})
    return ChatResponse(response=bot_response)

@app.post("/api/feedback", response_model=ChatResponse)
async def chat_feedback(request: ChatRequest) -> ChatResponse:
    bot_response = chain_feedback.invoke({"question": request.message})
    return ChatResponse(response=bot_response)


# Comando para rodar a API
if __name__ == "__main__":
    import uvicorn
    print("Iniciando a API de Suporte ao Cliente (Assist-Wiz-UI) em http://localhost:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)