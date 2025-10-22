# backend/tools.py
from google.adk.tools import tool # <<< IMPORTANTE: Importar 'tool' desta forma
import random
import asyncio # <<< Adicione este import se ainda não estiver

# Simulação de uma base de conhecimento simples
faq_database = {
    "rastrear pedido": "Para rastrear seu pedido, use o link enviado para seu e-mail de confirmação.",
    "cancelar pedido": "Cancelamentos podem ser feitos em até 2 horas após a compra diretamente na página 'Meus Pedidos'. Depois disso, entre em contato conosco.",
    "devolução": "Para devoluções, acesse 'Meus Pedidos', selecione o item e siga as instruções para devolução. O prazo é de 7 dias após o recebimento.",
    "pagamento": "Aceitamos cartão de crédito, boleto bancário e Pix.",
}

# --- Use @tool ---
@tool
def search_faq(query: str) -> str:
    """Busca na base de conhecimento por perguntas frequentes (FAQs) relacionadas à consulta do cliente."""
    print(f"[Tool] Buscando FAQ para: {query}")
    query_lower = query.lower()
    best_match = "Desculpe, não encontrei uma resposta direta para isso nas nossas FAQs."
    # Simulação simples de busca por palavras-chave
    for keyword, answer in faq_database.items():
        if keyword in query_lower:
            best_match = answer
            break
    print(f"[Tool] Resultado FAQ: {best_match}")
    return best_match

# --- Use @tool ---
@tool
async def check_order_status(order_id: str) -> dict:
    """Verifica o status de um pedido no sistema interno usando o ID do pedido (normalmente 5 dígitos)."""
    print(f"[Tool] Verificando status do pedido: {order_id}")
    await asyncio.sleep(0.5) # Simula latência da rede
    status_options = ["Processando", "Enviado", "Em trânsito", "Entregue", "Atrasado", "Cancelado"]
    if order_id.isdigit() and len(order_id) == 5 :
        status = random.choice(status_options)
        response = {
            "order_id": order_id,
            "status": status,
            "details": f"Última atualização: {random.randint(1, 28)}/{random.randint(1, 12)}/2025" if status != "Processando" else "Aguardando envio."
        }
        if status == "Atrasado":
            response["details"] = "Ocorreu um problema logístico. Estimativa: 3 dias úteis."
        elif status == "Entregue":
             response["details"] = f"Entregue em {random.randint(1, 28)}/{random.randint(1, 12)}/2025."
    else:
        response = {
            "order_id": order_id,
            "status": "Não encontrado",
            "details": "O número do pedido parece inválido. Verifique se ele tem 5 dígitos."
        }
    print(f"[Tool] Resultado Status Pedido: {response}")
    return response

# --- Use @tool ---
@tool
async def create_human_support_ticket(summary: str, customer_info: dict, order_id: str = None) -> str:
    """Cria um ticket para atendimento humano com o resumo do caso e informações do cliente."""
    print(f"[Tool] Criando ticket humano:")
    print(f"   Cliente: {customer_info.get('name', 'N/A')}")
    print(f"   Pedido: {order_id if order_id else 'N/A'}")
    print(f"   Resumo: {summary}")
    await asyncio.sleep(0.3)
    ticket_id = f"SUP-{random.randint(10000, 99999)}"
    result = f"Ticket {ticket_id} criado com sucesso. Nossa equipe entrará em contato em breve."
    print(f"[Tool] Resultado Ticket: {result}")
    return result

# --- Use @tool ---
@tool
async def request_customer_feedback(customer_id: str, case_id: str) -> str:
    """Envia uma solicitação de feedback para o cliente sobre o caso resolvido."""
    print(f"[Tool] Solicitando feedback para Cliente {customer_id} sobre Caso {case_id}")
    await asyncio.sleep(0.2)
    result = "Solicitação de feedback enviada ao cliente."
    print(f"[Tool] Resultado Feedback Request: {result}")
    return result

# --- Use @tool ---
@tool
async def analyze_feedback_sentiment(feedback_text: str) -> str:
    """Analisa o sentimento (positivo, negativo, neutro) do feedback fornecido pelo cliente."""
    print(f"[Tool] Analisando sentimento do feedback: {feedback_text[:50]}...")
    await asyncio.sleep(0.1)
    if any(word in feedback_text.lower() for word in ["ótimo", "excelente", "bom", "rápido", "resolveu", "obrigado"]):
        sentiment = "Positivo"
    elif any(word in feedback_text.lower() for word in ["ruim", "péssimo", "lento", "demorou", "não resolveu", "problema", "horrível"]):
        sentiment = "Negativo"
    else:
        sentiment = "Neutro"
    print(f"[Tool] Resultado Sentimento: {sentiment}")
    return sentiment