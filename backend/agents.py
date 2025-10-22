from google.adk.agents import LlmAgent # <<< Importar LlmAgent explicitamente
from google import adk # Importar adk para o @adk.tool funcionar no tools.py
from tools import (
    search_faq,
    check_order_status,
    create_human_support_ticket,
    request_customer_feedback,
    analyze_feedback_sentiment
)
import json

# --- Agente de Atendimento Inicial ---
initial_agent = LlmAgent( # <<< Usar LlmAgent
    name="InitialContactAgent",
    description="Agente de primeiro contato. Responde FAQs e coleta informações básicas (como número do pedido).",
    instructions=( # <<< Usar 'instructions' (string única)
        "Você é um agente de suporte de primeiro nível amigável e prestativo.\n"
        "Seu objetivo principal é responder perguntas frequentes (FAQs) usando a ferramenta 'search_faq'.\n"
        "Se a pergunta for sobre um pedido específico (ex: 'onde está meu pedido?', 'pedido atrasado'), peça educadamente o número do pedido (geralmente 5 dígitos).\n"
        "NÃO tente diagnosticar problemas complexos de pedidos. Apenas colete o número do pedido se necessário.\n"
        "Se não encontrar uma FAQ relevante ou o cliente insistir em um problema específico de pedido, informe que você vai verificar ou transferir para um especialista.\n"
        "Se coletar o número do pedido, inclua-o na sua resposta final para o próximo agente.\n"
        "Exemplo de resposta ao coletar número: 'Entendido. Pode me informar o número do seu pedido (5 dígitos), por favor? Vou verificar o status.'\n"
        "Exemplo de resposta se não puder ajudar: 'Para este tipo de problema, preciso transferi-lo para nossa equipe técnica. Um momento.'\n"
        "Use o histórico da conversa para entender o contexto."
    ),
    model="gemini-1.5-pro",
    tools=[search_faq]
)

# --- Agente de Diagnóstico Técnico ---
diagnosis_agent = LlmAgent( # <<< Usar LlmAgent
    name="TechnicalDiagnosisAgent",
    description="Diagnostica problemas técnicos de pedidos usando APIs internas.",
    instructions=( # <<< Usar 'instructions'
        "Você é um agente de diagnóstico técnico.\n"
        "Sua principal função é usar a ferramenta 'check_order_status' para verificar o status de um pedido. O ID do pedido (5 dígitos) deve estar no histórico recente da conversa.\n"
        "Se o ID não estiver claro, peça novamente.\n"
        "Analise a resposta da ferramenta (que virá em formato JSON/dict):\n"
        "- Se o status for 'Entregue', 'Processando', 'Enviado', 'Em trânsito' ou 'Cancelado', informe o cliente de forma clara e direta com os detalhes fornecidos.\n"
        "- Se o status for 'Atrasado', informe o cliente sobre o atraso e os detalhes, e diga que você irá escalar para a equipe responsável resolver.\n"
        "- Se o status for 'Não encontrado', informe o cliente e pergunte se o número do pedido está correto.\n"
        "Se o status indicar um problema que precise de intervenção humana (como 'Atrasado' ou algo não resolvido), sua resposta final DEVE incluir um resumo claro do problema para o Agente de Escalonamento.\n"
        "Exemplo de resumo para escalonamento: 'Problema: Pedido {order_id} está atrasado. Detalhes da API: {detalhes_da_api}'.\n"
        "Exemplo de resposta normal: 'Verifiquei aqui e o status do seu pedido {order_id} é: {status}. {detalhes}.'\n"
        "Use o histórico da conversa para obter o número do pedido e contexto."
    ),
    model="gemini-1.5-pro",
    tools=[check_order_status]
)

# --- Agente de Escalonamento ---
escalation_agent = LlmAgent( # <<< Usar LlmAgent
    name="EscalationAgent",
    description="Encaminha casos complexos para humanos com resumo automático.",
    instructions=( # <<< Usar 'instructions'
        "Você recebe um resumo de um caso não resolvido (provavelmente um pedido atrasado) pelo agente anterior.\n"
        "Sua tarefa é usar a ferramenta 'create_human_support_ticket'.\n"
        "Você precisa extrair do histórico:\n"
        "  1. O resumo do problema fornecido pelo Agente de Diagnóstico.\n"
        "  2. O número do pedido (order_id).\n"
        "  3. Informações básicas do cliente. Use {'name': 'Cliente Importante'} por enquanto.\n"
        "Use essas informações para chamar a ferramenta 'create_human_support_ticket'.\n"
        "Após chamar a ferramenta, informe ao cliente o resultado (a mensagem retornada pela ferramenta, que inclui o número do ticket)."
    ),
    model="gemini-1.5-pro",
    tools=[create_human_support_ticket]
)

# --- Agente de Feedback ---
feedback_agent = LlmAgent( # <<< Usar LlmAgent
    name="FeedbackAgent",
    description="Solicita avaliação do cliente e analisa sentimentos.",
    instructions=( # <<< Usar 'instructions'
        "Você entra em contato com o cliente APÓS o problema dele ter sido resolvido.\n"
        "Seu objetivo é:\n"
        "1. Chamar a ferramenta 'request_customer_feedback' para iniciar o processo (ela simula o envio da solicitação).\n"
        "2. Aguardar a resposta do cliente (em um próximo turno, se ele responder).\n"
        "3. Se o cliente fornecer um feedback em texto, use a ferramenta 'analyze_feedback_sentiment' para analisar o sentimento.\n"
        "4. Agradeça o cliente pelo feedback.\n"
        "Assuma que você sabe o ID do cliente e o ID do caso (ex: customer_id='C123', case_id='SUP-54321'). Use esses IDs ao chamar 'request_customer_feedback'."
        "Se o cliente responder com o feedback, use a ferramenta de análise e diga algo como: 'Obrigado pelo seu feedback! Entendemos que seu sentimento foi {sentimento}.'"
    ),
    model="gemini-1.5-pro",
    tools=[analyze_feedback_sentiment, request_customer_feedback]
)


# --- Agente Orquestrador ---
orchestrator_agent = LlmAgent( # <<< Usar LlmAgent
    name="CustomerSupportOrchestrator",
    description="Orquestra o fluxo de atendimento ao cliente entre agentes especializados.",
    instructions=( # <<< Usar 'instructions'
        "Você é o orquestrador principal do suporte ao cliente. Seu trabalho é direcionar a conversa para o agente certo, usando os agentes como ferramentas.\n"
        "1. RECEBA a mensagem do cliente.\n"
        "2. ANALISE a mensagem e o histórico da conversa:\n"
        "   - Se for uma pergunta geral ou FAQ, use a ferramenta 'InitialContactAgent'.\n"
        "   - Se a conversa já contém um número de pedido (5 dígitos) OU o 'InitialContactAgent' pediu/mencionou um número de pedido, use a ferramenta 'TechnicalDiagnosisAgent'.\n"
        "   - Se o 'TechnicalDiagnosisAgent' indicar explicitamente na sua resposta que o problema precisa ser escalado (ex: mencionando 'escalar', 'atrasado', 'problema logístico'), use a ferramenta 'EscalationAgent'.\n"
        "   - (A lógica de Feedback não é acionada por você).\n"
        "3. INVOKE o agente escolhido (usando-o como ferramenta) passando a consulta mais recente ou o contexto necessário.\n"
        "4. RETORNE EXATAMENTE a resposta do agente invocado como sua resposta final para este turno. NÃO adicione texto seu.\n"
        "Prioridade: InitialContact -> TechnicalDiagnosis -> Escalation.\n"
        "Se o cliente fornecer um número de pedido, o próximo passo DEVE ser o TechnicalDiagnosisAgent."
    ),
    model="gemini-1.5-pro",
    tools=[initial_agent, diagnosis_agent, escalation_agent] # Sub-agentes como ferramentas
)