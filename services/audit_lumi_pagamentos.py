import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

LUMI_URL = os.getenv("LUMI_BASE_URL")
LUMI_EMAIL = os.getenv("LUMI_EMAIL")
LUMI_SENHA = os.getenv("LUMI_SENHA")
LUMI_ENDPOINT = os.getenv("LUMI_ENDPOINT_DADOS", "/faturas/dados")

# A lista exata que você pediu
CAMPOS_TESTE = [
    "uc",
    "mes_referencia",
    "payments.energia_compensada",
    "payments.desconto_bruto",
    "payments.remuneracao_geracao",
    "payments.economia",
    "payments.carbono",
    "payments.arvores",
    "payments.vencimento",
    "payments.status_cobranca_asaas",
    "payments.asaas_payment_id",
    "payments.email_enviado_flag",
    "payments.sent_at"
]

def login_lumi():
    try:
        resp = requests.post(f"{LUMI_URL}/login", json={"email": LUMI_EMAIL, "senha": LUMI_SENHA})
        return resp.json().get("token")
    except: return None

def audit_lumi_specific():
    print("\n🕵️ TESTE CIRÚRGICO LUMI (Campos 'payments')")
    token = login_lumi()
    if not token: 
        print("❌ Falha no login")
        return

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    full_url = f"{LUMI_URL}{LUMI_ENDPOINT}"
    
    # Período curto para teste
    params = {
        "inicio": "2025-11-01", 
        "fim": "2025-12-31",
        "campo": CAMPOS_TESTE
    }

    try:
        print("⏳ Consultando API...")
        resp = requests.get(full_url, headers=headers, params=params, timeout=30)
        
        if resp.status_code != 200:
            print(f"❌ Erro API: {resp.status_code}")
            print(f"   Resposta: {resp.text}")
            return

        data = resp.json()
        lista = []
        if isinstance(data, list): lista = data
        elif isinstance(data, dict):
             lista = data.get("data", [])
             if isinstance(lista, dict) and "rows" in lista: lista = lista["rows"]

        if not lista:
            print("⚠️ Nenhum registro retornado nesse período.")
            return

        print(f"✅ Sucesso! Retornou {len(lista)} registros.")
        print("📄 Analisando o primeiro registro:")
        
        item = lista[0]
        print(json.dumps(item, indent=2, ensure_ascii=False))

    except Exception as e:
        print(f"❌ Crash: {e}")

if __name__ == "__main__":
    audit_lumi_specific()