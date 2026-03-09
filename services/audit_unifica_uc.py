import requests
import os
from dotenv import load_dotenv

load_dotenv()

UNIFICA_URL = os.getenv("UNIFICA_BASE_URL")
UNIFICA_TOKEN = os.getenv("UNIFICA_TOKEN")
ENDPOINT = "/operacao/cobrancas"

# A UC e Referência que queremos investigar
ALVO_UC = "3001223734"
MES_REF = "2026-02" # Convertido de 02/2026 para o padrão YYYY-MM exigido pela API

def audit_specific_uc():
    print(f"🕵️ INVESTIGANDO A UC: {ALVO_UC} | REF: {MES_REF}")
    
    if UNIFICA_URL: 
        url = UNIFICA_URL.rstrip("/") + ENDPOINT
    else:
        print("❌ Erro: UNIFICA_BASE_URL não encontrada no arquivo .env.")
        return

    # O Header precisa do Token Bearer, conforme documentação
    headers = {
        "Authorization": f"Bearer {UNIFICA_TOKEN}", 
        "Content-Type": "application/json"
    }
    
    page = 1
    found_count = 0
    
    while True:
        print(f"🔄 Buscando página {page} diretamente na API...", end="\r")
        
        # ATUALIZAÇÃO: Passando os filtros de UC e Data Ref direto para a API
        params = {
            "page": page, 
            "per_page": 100,
            "uc": ALVO_UC,
            "date_ref": MES_REF
        }
        
        try:
            resp = requests.get(url, headers=headers, params=params, timeout=20)
            if resp.status_code != 200:
                print(f"\n❌ Erro API: {resp.status_code} - {resp.text}")
                break

            data = resp.json()
            lista = data.get("data", [])
            
            if not lista:
                print("\n🏁 Fim dos dados da API ou nenhum registro encontrado para estes filtros.")
                break
            
            # Como a API já filtrou na origem, tudo que vier na 'lista' já pertence à UC e ao Mês Ref!
            for item in lista:
                found_count += 1
                ref = item.get("date_ref")
                valor_concessionaria = item.get("dealership_bill_cost")
                status = item.get("status")
                
                import json # Pode colocar isso lá no topo do arquivo junto com os outros imports

                print(f"\n🔎 ENCONTRADO #{found_count}:")
                # Isso vai imprimir TODOS os campos que a API retornou, com indentação de 4 espaços
                print(json.dumps(item, indent=4, ensure_ascii=False))
                print("-" * 30)

            # Segurança da paginação lendo o objeto "meta"
            ultima_pagina = data.get("meta", {}).get("last_page", 1)
            if page >= ultima_pagina:
                print("\n✅ Busca finalizada com sucesso.")
                break
                
            page += 1
            
        except Exception as e:
            print(f"\n❌ Erro de conexão ou execução: {e}")
            break

if __name__ == "__main__":
    audit_specific_uc()