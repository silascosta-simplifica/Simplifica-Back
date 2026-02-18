import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

UNIFICA_URL = os.getenv("UNIFICA_BASE_URL")
UNIFICA_TOKEN = os.getenv("UNIFICA_TOKEN")
ENDPOINT = "/operacao/cobrancas"

# A UC que queremos investigar
ALVO_UC = "20337095"

def audit_specific_uc():
    print(f"🕵️  INVESTIGANDO A UC: {ALVO_UC}")
    
    if UNIFICA_URL: url = UNIFICA_URL.rstrip("/") + ENDPOINT
    headers = {"Authorization": f"Bearer {UNIFICA_TOKEN}", "Content-Type": "application/json"}
    
    # Vamos baixar várias páginas para garantir que achamos tudo
    page = 1
    found_count = 0
    
    while True:
        print(f"🔄 Varrendo página {page}...", end="\r")
        params = {"page": page, "per_page": 100}
        
        try:
            resp = requests.get(url, headers=headers, params=params, timeout=20)
            if resp.status_code != 200:
                print(f"❌ Erro API: {resp.status_code}")
                break

            data = resp.json()
            lista = data.get("data", [])
            
            if not lista:
                print("\n🏁 Fim dos dados da API.")
                break
            
            # Filtra na memória
            for item in lista:
                uc_api = str(item.get("uc", "")).strip()
                
                if uc_api == ALVO_UC:
                    found_count += 1
                    ref = item.get("date_ref")
                    valor = item.get("dealership_bill_cost")
                    status = item.get("status")
                    print(f"\n🔎 ENCONTRADO #{found_count}:")
                    print(f"   - Mês Ref: {ref}")
                    print(f"   - Valor Concessionária: {valor}")
                    print(f"   - Valor Boleto Simplifica: {item.get('invoice_total_cost')}")
                    print(f"   - Status: {status}")
                    print(f"   - ID Interno? (Verificando chaves ocultas):")
                    # Verifica se existe algum ID único oculto para usarmos de chave primária
                    if "id" in item: print(f"     > id: {item['id']}")
                    if "_id" in item: print(f"     > _id: {item['_id']}")
                    if "uuid" in item: print(f"     > uuid: {item['uuid']}")
                    print("-" * 30)

            # Segurança para não rodar infinito (ajuste se precisar de mais páginas)
            if page >= data.get("meta", {}).get("last_page", 500):
                break
                
            page += 1
            
        except Exception as e:
            print(f"\n❌ Erro: {e}")
            break

if __name__ == "__main__":
    audit_specific_uc()