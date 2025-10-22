# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import asyncio
import os
from dotenv import load_dotenv
import traceback # Para logs de erro mais detalhados

# Carrega variáveis de ambiente do arquivo .env
load_dotenv()

# Verifica se a API key está configurada
if not os.getenv("GOOGLE_API_KEY"):
    raise ValueError("A variável de ambiente GOOGLE_API_KEY não está configurada.")

# Importa o agente orquestrador após carregar .env
try:
    from agents import orchestrator_agent
except ImportError as e:
    print(f"Erro ao importar agentes: {e}")
    traceback.print_exc()
    raise e


app = Flask(__name__)
# Habilita CORS para permitir que seu frontend chame esta API
CORS(app, resources={r"/chat": {"origins": "*"}}) # Permite todas as origens para /chat (para desenvolvimento)

# Armazenamento simples de histórico em memória (para demonstração)
# Em produção, use um banco de dados ou serviço de sessão mais robusto.
conversation_history = {}

async def run_agent_async(session_id, user_message):
    """Função assíncrona para rodar o agente orquestrador."""
    # Nota: A gestão do histórico entre os agentes que são ferramentas pode ser complexa.
    # O LlmAgent chamado como ferramenta recebe o histórico da chamada pai (o orquestrador).
    # Para histórico persistente entre chamadas à API, precisaríamos de uma solução mais robusta
    # como passar o histórico explicitamente ou usar um serviço de sessão.
    # Por enquanto, confiamos no histórico implícito gerenciado pelo ADK dentro de uma única chamada `run`.

    print(f"\n--- Sessão {session_id} ---")
    print(f"Usuário: {user_message}")

    # Roda o agente orquestrador
    agent_response = await orchestrator_agent.run(user_message)

    print(f"Agente: {agent_response}")
    return agent_response

@app.route('/chat', methods=['POST'])
def chat_handler():
    """Endpoint para receber mensagens do usuário e retornar a resposta do agente."""
    try:
        data = request.get_json()
        if not data:
             return jsonify({"error": "Requisição sem JSON"}), 400

        user_message = data.get('message')
        # Usar um ID de sessão (pode vir do frontend ou ser gerado)
        session_id = data.get('session_id', 'default_session') # Usa 'default_session' se não fornecido

        if not user_message:
            return jsonify({"error": "Nenhuma mensagem fornecida no JSON ('message')"}), 400

        try:
            # Executa a função assíncrona no loop de eventos asyncio
            # asyncio.run cria um novo loop a cada chamada, o que é simples para Flask
            agent_response_text = asyncio.run(run_agent_async(session_id, user_message))
            return jsonify({"reply": agent_response_text, "session_id": session_id})

        except Exception as e:
            print(f"Erro ao executar o agente para a sessão {session_id}: {e}")
            traceback.print_exc() # Imprime o stack trace completo no console do servidor
            return jsonify({"error": f"Erro interno ao processar a mensagem com o agente: {e}"}), 500

    except Exception as e:
        print(f"Erro no handler /chat: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Erro interno no servidor: {e}"}), 500

if __name__ == '__main__':
    # Roda o servidor Flask
    # host='0.0.0.0' permite acesso de outras máquinas na rede (útil para testar do celular/outro PC)
    # Use debug=False em produção
    app.run(host='0.0.0.0', port=5001, debug=True)