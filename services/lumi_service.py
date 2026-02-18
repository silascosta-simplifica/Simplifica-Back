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

# Campos que pedimos para a API da Lumi
CAMPOS_LUMI = [
    "uc", "nome", "mes_referencia", "consumo_total_faturado_qt", "valor_total_fatura", "drive_id",
    "payments.energia_compensada", "payments.economia", "payments.status_cobranca_asaas",
    "payments.vencimento", "payments.remuneracao_geracao", "payments.sent_at"
]

# Conexão com Banco
engine = create_engine(DB_URL)

# --- FUNÇÕES AUXILIARES ---

def login_lumi(email, senha):
    """Faz login e retorna o token JWT"""
    try:
        if not email or not senha: return None
        resp = requests.post(f"{LUMI_URL}/login", json={"email": email, "senha": senha})
        return resp.json().get("token") if resp.status_code == 200 else None
    except: return None

def limpar_numero(val):
    """Converte moeda/texto para float (ex: 'R$ 1.000,00' -> 1000.00)"""
    if val is None or val == "": return 0.0
    if isinstance(val, (int, float)): return float(val)
    try:
        # Remove R$, troca ponto por nada e vírgula por ponto
        return float(str(val).replace("R$", "").replace(" ", "").replace(".", "").replace(",", ".").strip())
    except: return 0.0

def tratar_data(val):
    """Formata data para YYYY-MM-DD ou retorna None se vazio"""
    if not val: return None
    try:
        return str(val).split("T")[0]
    except: return None

def processar_fatura(item, nome_conta):
    """Transforma o JSON da API no formato do nosso Banco de Dados"""
    return {
        "uc": str(item.get("uc", "")).strip(),
        "mes_referencia": tratar_data(item.get("mes_referencia")),
        "nome_cliente": item.get("nome"),
        "consumo_kwh": limpar_numero(item.get("consumo_total_faturado_qt")),
        "energia_compensada": limpar_numero(item.get("energia_compensada")),
        "valor_total_fatura": limpar_numero(item.get("valor_total_fatura")),
        "economia_total": limpar_numero(item.get("economia")),
        "remuneracao_geracao": limpar_numero(item.get("remuneracao_geracao")), # Nova coluna
        "data_envio": tratar_data(item.get("sent_at")), # Nova coluna
        "status_pagamento": item.get("status_cobranca_asaas"),
        "vencimento": tratar_data(item.get("vencimento")),
        "link_boleto": item.get("drive_id"), 
        "updated_at": datetime.now(),
        "origem_conta": nome_conta # Nova coluna
    }

def salvar_em_lotes(lista_faturas, nome_conta):
    """
    TURBO MODE 🚀: Salva tudo de uma vez usando Bulk Insert.
    Muito mais rápido do que salvar linha por linha.
    """
    if not lista_faturas: return
    
    dados_prontos = []
    
    # 1. Prepara os dados
    for item in lista_faturas:
        try:
            fat = processar_fatura(item, nome_conta)
            # Só salva se tiver UC e Mês (Chave Primária)
            if fat["uc"] and fat["mes_referencia"]: 
                dados_prontos.append(fat)
        except Exception as e:
            pass # Ignora fatura com erro de formatação

    if not dados_prontos: return

    # 2. Query Otimizada (SQLAlchemy Core)
    stmt = text("""
        INSERT INTO raw_lumi (
            uc, mes_referencia, nome_cliente, consumo_kwh, 
            energia_compensada, valor_total_fatura, economia_total, 
            remuneracao_geracao, data_envio, status_pagamento, 
            vencimento, link_boleto, updated_at, origem_conta
        )
        VALUES (
            :uc, :mes_referencia, :nome_cliente, :consumo_kwh, 
            :energia_compensada, :valor_total_fatura, :economia_total, 
            :remuneracao_geracao, :data_envio, :status_pagamento, 
            :vencimento, :link_boleto, :updated_at, :origem_conta
        )
        ON CONFLICT (uc, mes_referencia) DO UPDATE SET
            nome_cliente = EXCLUDED.nome_cliente,
            consumo_kwh = EXCLUDED.consumo_kwh,
            energia_compensada = EXCLUDED.energia_compensada,
            valor_total_fatura = EXCLUDED.valor_total_fatura,
            economia_total = EXCLUDED.economia_total,
            remuneracao_geracao = EXCLUDED.remuneracao_geracao,
            data_envio = EXCLUDED.data_envio,
            status_pagamento = EXCLUDED.status_pagamento,
            vencimento = EXCLUDED.vencimento,
            updated_at = EXCLUDED.updated_at,
            origem_conta = EXCLUDED.origem_conta;
    """)

    # 3. Execução em Transação Única
    try:
        with engine.begin() as conn: 
            conn.execute(stmt, dados_prontos)
        print(f"    ✅ [{nome_conta}] Lote salvo: {len(dados_prontos)} registros inseridos/atualizados.", end='\r')
    except Exception as e:
        print(f"\n    ❌ Erro ao salvar lote no banco: {e}")

def executar_sync_lumi():
    print("🚀 Iniciando Sincronização Turbo Lumi...")
    
    for conta in CONTAS:
        if not conta["email"] or not conta["senha"]:
            print(f"⚠️ Pulei conta {conta['nome']} (sem credenciais no .env)")
            continue

        print(f"\n🔑 Logando na conta: {conta['nome']} ({conta['email']})...")
        token = login_lumi(conta["email"], conta["senha"])
        
        if not token: 
            print(f"❌ Falha no login da conta {conta['nome']}")
            continue

        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        full_url = f"{LUMI_URL}{LUMI_ENDPOINT}"
        
        # Como o banco é novo, vamos buscar desde 2023
        anos = [ "2025-01-01"]

        for ano_inicio in anos:
            ano_fim = ano_inicio.replace("-01-01", "-12-31")
            print(f"    📅 {conta['nome']} - Buscando: {ano_inicio} a {ano_fim}...")
            
            params = {"inicio": ano_inicio, "fim": ano_fim, "campo": CAMPOS_LUMI}

            try:
                resp = requests.get(full_url, headers=headers, params=params, timeout=120)
                if resp.status_code != 200: continue
                
                dados = resp.json()
                lista = []
                
                # Tratamento de retorno da API (às vezes vem dict, às vezes list)
                if isinstance(dados, list): lista = dados
                elif isinstance(dados, dict):
                     lista = dados.get("data", [])
                     if isinstance(lista, dict) and "rows" in lista: lista = lista["rows"]
                
                if not lista: 
                    # print(f"       (Sem dados neste período)")
                    continue
                
                salvar_em_lotes(lista, conta["nome"])

            except Exception as e: print(f"❌ Erro requisição {conta['nome']}: {e}")

if __name__ == "__main__":
    executar_sync_lumi()