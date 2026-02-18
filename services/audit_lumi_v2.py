import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

LUMI_URL = os.getenv("LUMI_BASE_URL")
LUMI_EMAIL = os.getenv("LUMI_EMAIL")
LUMI_SENHA = os.getenv("LUMI_SENHA")
LUMI_ENDPOINT = os.getenv("LUMI_ENDPOINT_DADOS", "/faturas/dados")

# AQUI ESTÁ O SEGREDO:
# Vamos pedir TODAS as variações possíveis na lista de campos.
# Assim descobrimos qual é a "chave mestra" que retorna valor.
CAMPOS_TESTE = [
    "uc", 
    "nome",
    "mes_referencia",
    # Variações de Energia
    "energia_compensada",           # Opção A (Raiz)
    "payments.energia_compensada",  # Opção B (Aninhado)
    # Variações de Economia
    "economia",                     # Opção A
    "payments.economia",            # Opção B
    "savings_brl",                  # Opção C (Vai que...)
    # Variações de Status
    "status_cobranca_asaas",
    "payments.status_cobranca_asaas"
]

def audit_lumi_cirurgico():
    print("🕵️  AUDITORIA LUMI V2 (Teste de Campos)")
    print("="*40)
    
    # 1. Login
    print("🔑 Autenticando...")
    try:
        resp_login = requests.post(f"{LUMI_URL}/login", json={"email": LUMI_EMAIL, "senha": LUMI_SENHA})
        if resp_login.status_code != 200:
            print(f"❌ Falha Login: {resp_login.text}")
            return
        token = resp_login.json().get("token")
    except Exception as e:
        print(f"❌ Erro Conexão: {e}")
        return

    # 2. Requisição com a lista de campos explícita
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    full_url = f"{LUMI_URL}{LUMI_ENDPOINT}"
    
    # Pegando um período recente para garantir dados
    params = {
        "inicio": "2024-01-01",
        "fim": "2024-12-31",
        "campo": CAMPOS_TESTE  # Envia a lista para não dar erro 400
    }

    print("⏳ Solicitando amostra com campos variados...")
    try:
        resp = requests.get(full_url, headers=headers, params=params, timeout=30)
        
        if resp.status_code != 200:
            print(f"❌ Erro API: {resp.status_code} - {resp.text}")
            return

        data = resp.json()
        lista = []
        if isinstance(data, list): lista = data
        elif isinstance(data, dict):
             lista = data.get("data", [])
             if isinstance(lista, dict) and "rows" in lista: lista = lista["rows"]

        if not lista:
            print("⚠️ Lista vazia retornada.")
            return

        print(f"✅ Sucesso! {len(lista)} registros encontrados.")
        
        # 3. Análise do Primeiro Item
        item = lista[0]
        print("\n📄 JSON RETORNADO PELA API (Primeiro Registro):")
        print(json.dumps(item, indent=2, ensure_ascii=False))
        
        print("\n🔎 VEREDITO SOBRE OS CAMPOS:")
        
        # Checando Energia
        val_energia_raiz = item.get("energia_compensada")
        val_energia_pay = item.get("payments", {}).get("energia_compensada") if isinstance(item.get("payments"), dict) else None
        
        if val_energia_raiz is not None:
            print(f"  ✅ Energia Compensada está na RAIZ: {val_energia_raiz}")
        elif val_energia_pay is not None:
            print(f"  ✅ Energia Compensada está em PAYMENTS: {val_energia_pay}")
        else:
            print("  ❌ Energia Compensada veio ZERADA ou NULA em ambas as tentativas.")

        # Checando Economia
        val_eco_raiz = item.get("economia")
        val_eco_pay = item.get("payments", {}).get("economia") if isinstance(item.get("payments"), dict) else None
        
        if val_eco_raiz is not None:
             print(f"  ✅ Economia está na RAIZ: {val_eco_raiz}")
        elif val_eco_pay is not None:
             print(f"  ✅ Economia está em PAYMENTS: {val_eco_pay}")
        else:
             print("  ❌ Economia veio ZERADA ou NULA.")

    except Exception as e:
        print(f"❌ Crash: {e}")

if __name__ == "__main__":
    audit_lumi_cirurgico()