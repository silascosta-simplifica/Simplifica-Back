import requests
import json
import os
import time
import sys
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

load_dotenv()

# Configurações de Ambiente
UNIFICA_URL = os.getenv("UNIFICA_BASE_URL")
UNIFICA_TOKEN = os.getenv("UNIFICA_TOKEN")
DB_URL = os.getenv("DATABASE_URL")
CHECKPOINT_FILE = "unifica_checkpoint.txt"

if UNIFICA_URL: UNIFICA_URL = UNIFICA_URL.rstrip("/")
ENDPOINT = "/operacao/cobrancas"

if not UNIFICA_URL or not UNIFICA_TOKEN or not DB_URL:
    print("🛑 ERRO: Verifique variáveis no .env")
    exit()

# Engine com timeout de conexão para evitar que o script fique "pendurado" no banco
engine = create_engine(
    DB_URL, 
    pool_pre_ping=True,
    connect_args={'connect_timeout': 30}
)

def verificar_e_criar_colunas():
    print("🛠️ Verificando estrutura da tabela raw_unifica...")
    sqls = [
        "ALTER TABLE raw_unifica ADD COLUMN IF NOT EXISTS remuneracao_geracao numeric DEFAULT 0;",
        "ALTER TABLE raw_unifica ADD COLUMN IF NOT EXISTS consumo_kwh numeric DEFAULT 0;",
        "ALTER TABLE raw_unifica ADD COLUMN IF NOT EXISTS energia_compensada numeric DEFAULT 0;",
        "ALTER TABLE raw_unifica ADD COLUMN IF NOT EXISTS economia_total numeric DEFAULT 0;",
        "ALTER TABLE raw_unifica ADD COLUMN IF NOT EXISTS codigo_barras text;",
        "ALTER TABLE raw_unifica ADD COLUMN IF NOT EXISTS codigo_pix text;",
        "ALTER TABLE raw_unifica ADD COLUMN IF NOT EXISTS data_emissao_concessionaria date;",
        "ALTER TABLE raw_unifica ADD COLUMN IF NOT EXISTS vencimento_concessionaria date;",
        "ALTER TABLE raw_unifica ADD COLUMN IF NOT EXISTS data_emissao date;",
        "ALTER TABLE raw_unifica ADD COLUMN IF NOT EXISTS kwh_balance_credits numeric DEFAULT 0;"
    ]
    
    with engine.begin() as conn:
        for sql in sqls:
            try:
                conn.execute(text(sql))
            except Exception as e:
                print(f"⚠️ Aviso ao ajustar tabela: {e}")
    print("✅ Estrutura do banco validada.")

def get_session():
    session = requests.Session()
    # Retry configurado para erros comuns de rede e servidor
    retry = Retry(
        total=3, 
        backoff_factor=2, 
        status_forcelist=[429, 500, 502, 503, 504]
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    return session

def limpar_numero(val):
    if val is None or val == "": return 0.0
    if isinstance(val, (int, float)): return float(val)
    try:
        return float(str(val).replace("R$", "").replace(".", "").replace(",", ".").strip())
    except: return 0.0

def tratar_data(val):
    if not val: return None
    s = str(val).split("T")[0].strip()
    if len(s) == 7 and s.count("-") == 1: s += "-01"
    return s

def limpar_uc(valor):
    if not valor: return None
    return str(valor).replace('.', '').replace('-', '').replace('/', '').replace(' ', '').strip()

def processar_item_unifica(item):
    return {
        "uc": limpar_uc(item.get("uc")),
        "mes_referencia": tratar_data(item.get("date_ref")),
        "nome_cliente": item.get("client_name"),
        "valor_fatura": limpar_numero(item.get("dealership_bill_cost")), 
        "remuneracao_geracao": limpar_numero(item.get("invoice_total_cost")),
        "consumo_kwh": limpar_numero(item.get("kWh_consumption")),
        "energia_compensada": limpar_numero(item.get("kWh_consumption_offset")),
        "economia_total": limpar_numero(item.get("savings_brl")),
        "status_pagamento": item.get("status"),
        "vencimento": tratar_data(item.get("due_date")),
        "codigo_barras": item.get("bar_code"),
        "codigo_pix": item.get("pix_code"),
        "data_emissao_concessionaria": tratar_data(item.get("dealership_bill_issue_date")),
        "vencimento_concessionaria": tratar_data(item.get("dealership_bill_due_date")),
        "data_emissao": tratar_data(item.get("issue_date")),
        "link_fatura": item.get("billing_file_key") or item.get("dealership_bill_file_key"),
        "kwh_balance_credits": limpar_numero(item.get("kWh_balance_credits")),
        "updated_at": datetime.now()
    }

def salvar_em_lotes(lista_itens, pagina_atual):
    if not lista_itens: return
    dados_prontos = []
    
    for x in lista_itens:
        try:
            p = processar_item_unifica(x)
            if p["uc"] and p["mes_referencia"] and len(str(p["mes_referencia"])) == 10:
                dados_prontos.append(p)
        except Exception as e:
            print(f"❌ ERRO ao processar linha: {e}")

    if not dados_prontos: return

    with engine.begin() as conn:
        for item in dados_prontos:
            stmt = text("""
                INSERT INTO raw_unifica (
                    uc, mes_referencia, nome_cliente, valor_fatura, remuneracao_geracao, 
                    consumo_kwh, energia_compensada, economia_total, status_pagamento, 
                    vencimento, codigo_barras, codigo_pix, data_emissao_concessionaria, 
                    vencimento_concessionaria, data_emissao, link_fatura, kwh_balance_credits, updated_at
                )
                VALUES (
                    :uc, :mes, :nome, :val, :remun, 
                    :cons, :comp, :eco, :st, 
                    :venc, :bar, :pix, :emi_conc, 
                    :venc_conc, :emi, :link, :saldo, :upd
                )
                ON CONFLICT (uc, mes_referencia) DO UPDATE SET
                    nome_cliente = EXCLUDED.nome_cliente,
                    valor_fatura = EXCLUDED.valor_fatura,
                    remuneracao_geracao = EXCLUDED.remuneracao_geracao,
                    consumo_kwh = EXCLUDED.consumo_kwh,
                    energia_compensada = EXCLUDED.energia_compensada,
                    economia_total = EXCLUDED.economia_total,
                    status_pagamento = EXCLUDED.status_pagamento,
                    vencimento = EXCLUDED.vencimento,
                    codigo_barras = EXCLUDED.codigo_barras,
                    codigo_pix = EXCLUDED.codigo_pix,
                    data_emissao_concessionaria = EXCLUDED.data_emissao_concessionaria,
                    vencimento_concessionaria = EXCLUDED.vencimento_concessionaria,
                    data_emissao = EXCLUDED.data_emissao,
                    link_fatura = EXCLUDED.link_fatura,
                    kwh_balance_credits = EXCLUDED.kwh_balance_credits,
                    updated_at = EXCLUDED.updated_at;
            """)
            conn.execute(stmt, {
                "uc": item["uc"], "mes": item["mes_referencia"], "nome": item["nome_cliente"],
                "val": item["valor_fatura"], "remun": item["remuneracao_geracao"],
                "cons": item["consumo_kwh"], "comp": item["energia_compensada"], "eco": item["economia_total"],
                "st": item["status_pagamento"], "venc": item["vencimento"], 
                "bar": item["codigo_barras"], "pix": item["codigo_pix"], 
                "emi_conc": item["data_emissao_concessionaria"], "venc_conc": item["vencimento_concessionaria"], 
                "emi": item["data_emissao"], "link": item["link_fatura"], 
                "saldo": item["kwh_balance_credits"], "upd": item["updated_at"]
            })
    print(f"✅ Unifica: Salvo lote de {len(dados_prontos)} registros da pág {pagina_atual}", flush=True)

def carregar_checkpoint():
    if os.path.exists(CHECKPOINT_FILE):
        try:
            with open(CHECKPOINT_FILE, "r") as f:
                val = int(f.read().strip())
                print(f"📂 Checkpoint encontrado! Retomando da página {val}.")
                return val
        except: pass
    return 1

def salvar_checkpoint(page):
    with open(CHECKPOINT_FILE, "w") as f:
        f.write(str(page))

def executar_sync_unifica():
    verificar_e_criar_colunas()
    
    # Controle de tempo para evitar o limite de 6h do GitHub
    start_time = time.time()
    max_duration = 50 * 60  # Para em 50 minutos para salvar o estado com segurança
    
    print(f"🚀 Iniciando Sync Unifica às {datetime.now().strftime('%H:%M:%S')}")
    
    headers = {"Authorization": f"Bearer {UNIFICA_TOKEN}", "Content-Type": "application/json", "accept": "*/*"}
    full_url = f"{UNIFICA_URL}{ENDPOINT}"
    session = get_session()
    
    page = carregar_checkpoint() 
    per_page = 50
    total_baixado = 0
    
    while True:
        # Verificação de segurança de tempo
        if time.time() - start_time > max_duration:
            print("\n🕒 LIMITE DE TEMPO PREVENTIVO (50 min) ATINGIDO.")
            print(f"Parando na página {page}. O checkpoint foi salvo para a próxima execução.")
            break

        params = {"page": page, "per_page": per_page}
        tentativas_pag = 0
        sucesso = False
        
        while tentativas_pag < 5:
            try:
                # Timeout explícito na requisição
                resp = session.get(full_url, headers=headers, params=params, timeout=45)
                
                if resp.status_code == 200:
                    sucesso = True
                    break
                elif resp.status_code == 429:
                    print(f"\n⏳ Rate Limit (429) na pág {page}. Aguardando 30s...")
                    time.sleep(30)
                elif resp.status_code == 404:
                    print(f"\n🏁 Página {page} retornou 404. Fim dos dados.")
                    if os.path.exists(CHECKPOINT_FILE): os.remove(CHECKPOINT_FILE)
                    return
                else:
                    print(f"\n⚠️ Erro {resp.status_code} na pág {page}. Tentativa {tentativas_pag+1}/5")
                    time.sleep(10)
                
                tentativas_pag += 1

            except Exception as e:
                tentativas_pag += 1
                print(f"\n⚠️ Falha de conexão na pág {page} ({tentativas_pag}/5): {e}")
                time.sleep(15)

        if not sucesso:
            print(f"❌ Não foi possível carregar a página {page} após 5 tentativas. Abortando para evitar loop.")
            break

        try:
            dados = resp.json()
            lista = dados.get("data", [])
            
            if not lista: 
                print(f"\n🏁 Lista vazia na página {page}. Sincronização concluída.")
                if os.path.exists(CHECKPOINT_FILE): os.remove(CHECKPOINT_FILE)
                break
            
            salvar_em_lotes(lista, page)
            total_baixado += len(lista)
            
            # Salva o progresso para a próxima execução
            salvar_checkpoint(page + 1)
            
            meta = dados.get("meta", {})
            last_page = meta.get("last_page")
            if last_page and page >= last_page:
                print(f"\n🏁 Última página ({last_page}) atingida com sucesso.")
                if os.path.exists(CHECKPOINT_FILE): os.remove(CHECKPOINT_FILE)
                break
                
            page += 1
            # Pequeno respiro para não sobrecarregar a API
            time.sleep(0.3) 
            
        except Exception as e:
            print(f"\n❌ Erro ao processar JSON da página {page}: {e}")
            break

    print(f"\n✅ Sincronização encerrada. Total de registros processados: {total_baixado}")

if __name__ == "__main__":
    executar_sync_unifica()