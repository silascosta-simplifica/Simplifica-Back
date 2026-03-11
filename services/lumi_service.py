import requests
import os
import json
import time
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Carrega variáveis de ambiente
load_dotenv()

# --- CONFIGURAÇÕES ---
LUMI_URL = os.getenv("LUMI_BASE_URL")
LUMI_ENDPOINT = os.getenv("LUMI_ENDPOINT_DADOS", "/faturas/dados") 
DB_URL = os.getenv("DATABASE_URL")

# Lista de Contas para baixar (Multi-Tenant)
CONTAS = [
    {
        "nome": "LUMI",  
        "email": os.getenv("LUMI_EMAIL"),
        "senha": os.getenv("LUMI_SENHA")
    },
    {
        "nome": "LUMI_COOP", 
        "email": os.getenv("LUMI_COOP_EMAIL"),
        "senha": os.getenv("LUMI_COOP_SENHA")
    }
]

# Campos que pedimos para a API da Lumi (ADICIONADO data_emissao)
CAMPOS_LUMI = [
    "uc", "nome", "mes_referencia", "consumo_total_faturado_qt", "valor_total_fatura", "drive_id",
    "payments.energia_compensada", "payments.economia", "payments.status_cobranca_asaas",
    "payments.vencimento", "payments.remuneracao_geracao", "payments.sent_at",
    "payments.asaas_payment_id",
    "creditos_estoque_tot", "data_emissao"
]

# Conexão com Banco
engine = create_engine(DB_URL, pool_pre_ping=True)

# --- FUNÇÕES AUXILIARES ---

def login_lumi(email, senha):
    try:
        if not email or not senha: return None
        resp = requests.post(f"{LUMI_URL}/login", json={"email": email, "senha": senha}, timeout=30)
        return resp.json().get("token") if resp.status_code == 200 else None
    except Exception as e:
        print(f"❌ Erro de conexão no login: {e}", flush=True)
        return None

def limpar_numero(val):
    if val is None or val == "": return 0.0
    if isinstance(val, (int, float)): return float(val)
    try:
        return float(str(val).replace("R$", "").replace(" ", "").replace(".", "").replace(",", ".").strip())
    except: return 0.0

def tratar_data(val):
    if not val: return None
    try:
        return str(val).split("T")[0]
    except: return None

def processar_fatura(item, nome_conta):
    return {
        "uc": str(item.get("uc", "")).strip(),
        "mes_referencia": tratar_data(item.get("mes_referencia")),
        "nome_cliente": item.get("nome"),
        "consumo_kwh": limpar_numero(item.get("consumo_total_faturado_qt")),
        "energia_compensada": limpar_numero(item.get("energia_compensada")),
        "valor_total_fatura": limpar_numero(item.get("valor_total_fatura")),
        "economia_total": limpar_numero(item.get("economia")),
        "remuneracao_geracao": limpar_numero(item.get("remuneracao_geracao")), 
        "data_envio": tratar_data(item.get("sent_at")), 
        "data_emissao": tratar_data(item.get("data_emissao")), # <-- ADICIONADO AQUI
        "status_pagamento": item.get("status_cobranca_asaas"),
        "vencimento": tratar_data(item.get("vencimento")),
        "link_boleto": item.get("drive_id"), 
        "asaas_id": item.get("asaas_payment_id"),
        "creditos_estoque_tot": limpar_numero(item.get("creditos_estoque_tot")),
        "updated_at": datetime.now(),
        "origem_conta": nome_conta 
    }

def salvar_em_lotes(lista_faturas, nome_conta):
    if not lista_faturas: return
    
    dados_prontos = []
    for item in lista_faturas:
        try:
            fat = processar_fatura(item, nome_conta)
            if fat["uc"] and fat["mes_referencia"]: 
                dados_prontos.append(fat)
        except: pass

    if not dados_prontos: return

    stmt = text("""
        INSERT INTO raw_lumi (
            uc, mes_referencia, nome_cliente, consumo_kwh, 
            energia_compensada, valor_total_fatura, economia_total, 
            remuneracao_geracao, data_envio, data_emissao, status_pagamento, 
            vencimento, link_boleto, updated_at, origem_conta, asaas_id, creditos_estoque_tot
        )
        VALUES (
            :uc, :mes_referencia, :nome_cliente, :consumo_kwh, 
            :energia_compensada, :valor_total_fatura, :economia_total, 
            :remuneracao_geracao, :data_envio, :data_emissao, :status_pagamento, 
            :vencimento, :link_boleto, :updated_at, :origem_conta, :asaas_id, :creditos_estoque_tot
        )
        ON CONFLICT (uc, mes_referencia) DO UPDATE SET
            nome_cliente = EXCLUDED.nome_cliente,
            consumo_kwh = EXCLUDED.consumo_kwh,
            energia_compensada = EXCLUDED.energia_compensada,
            valor_total_fatura = EXCLUDED.valor_total_fatura,
            economia_total = EXCLUDED.economia_total,
            remuneracao_geracao = EXCLUDED.remuneracao_geracao,
            data_envio = EXCLUDED.data_envio,
            data_emissao = EXCLUDED.data_emissao,
            status_pagamento = EXCLUDED.status_pagamento,
            vencimento = EXCLUDED.vencimento,
            updated_at = EXCLUDED.updated_at,
            origem_conta = EXCLUDED.origem_conta,
            asaas_id = EXCLUDED.asaas_id,
            creditos_estoque_tot = EXCLUDED.creditos_estoque_tot;
    """)

    try:
        with engine.begin() as conn: 
            conn.execute(stmt, dados_prontos)
        print(f"    ✅ [{nome_conta}] Lote salvo: {len(dados_prontos)} registros.", flush=True)
    except Exception as e:
        print(f"    ❌ Erro ao salvar no banco: {e}", flush=True)

def executar_sync_lumi():
    print("🚀 Iniciando Sincronização Turbo Lumi...", flush=True)
    
    for conta in CONTAS:
        if not conta["email"] or not conta["senha"]:
            print(f"⚠️ Pulei conta {conta['nome']} (sem credenciais)", flush=True)
            continue

        print(f"\n🔑 Logando: {conta['nome']}...", flush=True)
        token = login_lumi(conta["email"], conta["senha"])
        
        if not token: 
            print(f"❌ Falha no login da conta {conta['nome']}. Verifique credenciais ou bloqueio de IP.", flush=True)
            continue

        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        full_url = f"{LUMI_URL}{LUMI_ENDPOINT}"
        
        anos = ["2023-01-01", "2024-01-01", "2025-01-01", "2026-01-01"]

        for ano_inicio in anos:
            ano_fim = ano_inicio.replace("-01-01", "-12-31")
            print(f"    📅 {conta['nome']} - Período: {ano_inicio} a {ano_fim}...", flush=True)
            
            params = {"inicio": ano_inicio, "fim": ano_fim, "campo": CAMPOS_LUMI}

            try:
                resp = requests.get(full_url, headers=headers, params=params, timeout=120)
                if resp.status_code != 200: 
                    print(f"    ⚠️ Erro API ({resp.status_code}) para este período.", flush=True)
                    continue
                
                dados = resp.json()
                lista = []
                
                if isinstance(dados, list): lista = dados
                elif isinstance(dados, dict):
                    lista = dados.get("data", [])
                    if isinstance(lista, dict) and "rows" in lista: lista = lista["rows"]
                
                if not lista: 
                    continue
                
                salvar_em_lotes(lista, conta["nome"])

            except Exception as e: 
                print(f"    ❌ Erro na requisição: {e}", flush=True)

    print("\n🔄 Atualizando View Materializada...", flush=True)
    try:
        with engine.begin() as conn:
            conn.execute(text("REFRESH MATERIALIZED VIEW analytics_materializada;"))
        print("✅ Tudo pronto!", flush=True)
    except Exception as e:
        print(f"❌ Erro na View: {e}", flush=True)

if __name__ == "__main__":
    executar_sync_lumi()