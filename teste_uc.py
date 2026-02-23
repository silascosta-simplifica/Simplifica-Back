import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

UNIFICA_URL = os.getenv("UNIFICA_BASE_URL")
UNIFICA_TOKEN = os.getenv("UNIFICA_TOKEN")

if UNIFICA_URL: 
    UNIFICA_URL = UNIFICA_URL.rstrip("/")
    
ENDPOINT = "/operacao/cobrancas"

def validar_uc(uc_alvo):
    if not UNIFICA_URL or not UNIFICA_TOKEN:
        print("🛑 ERRO: Verifique as variáveis no .env")
        return

    print(f"🚀 Buscando informações na API para a UC: {uc_alvo}...")
    
    headers = {
        "Authorization": f"Bearer {UNIFICA_TOKEN}",
        "Content-Type": "application/json",
        "accept": "*/*"
    }
    
    full_url = f"{UNIFICA_URL}{ENDPOINT}"
    
    # Testando o parâmetro em minúsculo, mas vamos garantir o filtro no Python
    params = {
        "uc": uc_alvo, 
        "per_page": 100
    }
    
    try:
        response = requests.get(full_url, headers=headers, params=params, timeout=30)
        
        if response.status_code == 200:
            dados = response.json()
            lista_bruta = dados.get("data", [])
            
            # 🛡️ FILTRO BLINDADO NO PYTHON: Pega estritamente a UC desejada
            lista_filtrada = [item for item in lista_bruta if str(item.get("uc")) == str(uc_alvo)]
            
            if not lista_filtrada:
                print(f"⚠️ Nenhum registro encontrado exatamente para a UC {uc_alvo} nesta busca.")
                # Se quiser ver o que a API mandou de verdade quando falha, descomente a linha abaixo:
                # print(f"A API retornou {len(lista_bruta)} itens misturados.")
            else:
                print(f"✅ Sucesso! Filtramos {len(lista_filtrada)} registro(s) EXATO(S) para a UC {uc_alvo}.\n")
                print(json.dumps(lista_filtrada, indent=4, ensure_ascii=False))
            
        elif response.status_code in [401, 403]:
            print("🛑 Erro de Autenticação. Verifique seu token.")
        else:
            print(f"❌ Erro na API (Status {response.status_code}): {response.text}")
            
    except Exception as e:
        print(f"⚠️ Falha de conexão: {e}")

if __name__ == "__main__":
    # ---------------------------------------------------------
    # COLOQUE AQUI O NÚMERO DA UC QUE VOCÊ QUER TESTAR
    # ---------------------------------------------------------
    UC_PARA_TESTE = "47897289" 
    
    validar_uc(UC_PARA_TESTE)