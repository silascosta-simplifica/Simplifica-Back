import os
import requests
import time
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Carrega as variáveis do seu arquivo .env
load_dotenv()

# ===== 1. CONFIGURAÇÕES =====
API_KEY_PIPE = os.getenv("PIPEDRIVE_TOKEN")
COMPANY_DOMAIN = os.getenv("PIPEDRIVE_DOMAIN", "vivaenergia")
BASE_URL = f"https://{COMPANY_DOMAIN}.pipedrive.com/api/v1/"
DB_URL = os.getenv("DATABASE_URL")

if not API_KEY_PIPE or not DB_URL:
    print("🛑 ERRO: Verifique as variáveis PIPEDRIVE_TOKEN e DATABASE_URL no .env")
    exit()

# Engine com timeout de conexão para o Supabase
engine = create_engine(
    DB_URL, 
    pool_pre_ping=True,
    connect_args={'connect_timeout': 30}
)

def verificar_e_criar_tabela():
    print("🛠️ Verificando estrutura da tabela raw_pipedrive...")
    sql = """
    CREATE TABLE IF NOT EXISTS raw_pipedrive (
        deal_id BIGINT PRIMARY KEY,
        uc TEXT,
        uc_aneel TEXT,
        nome_funil TEXT,
        organizacao TEXT,
        pessoa_contato TEXT,
        telefone TEXT,
        mwh_mes NUMERIC DEFAULT 0,
        concessionaria TEXT,
        quem_indicou TEXT,
        nome_quem_indicou TEXT,
        parceiro_unidade TEXT,
        parceiro_nome TEXT,
        updated_at TIMESTAMP
    );
    """
    with engine.begin() as conn:
        try:
            conn.execute(text(sql))
        except Exception as e:
            print(f"⚠️ Aviso ao criar/verificar tabela: {e}")
    print("✅ Estrutura da tabela validada no Supabase.")

def limpar_numero(val):
    if val is None or val == "": return 0.0
    if isinstance(val, (int, float)): return float(val)
    try:
        return float(str(val).replace("R$", "").replace(".", "").replace(",", ".").strip())
    except: return 0.0

def get_json(endpoint, params=None):
    if params is None:
        params = {}
    params['api_token'] = API_KEY_PIPE
    
    url = f"{BASE_URL}{endpoint}"
    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Erro na API Pipedrive ({endpoint}): {response.status_code} - {response.text}")
        response.raise_for_status()

def salvar_em_lotes(lista_itens):
    if not lista_itens: return
    
    with engine.begin() as conn:
        for item in lista_itens:
            stmt = text("""
                INSERT INTO raw_pipedrive (
                    deal_id, uc, uc_aneel, nome_funil, organizacao, pessoa_contato, telefone,
                    mwh_mes, concessionaria, quem_indicou, nome_quem_indicou,
                    parceiro_unidade, parceiro_nome, updated_at
                ) VALUES (
                    :deal_id, :uc, :uc_aneel, :nome_funil, :organizacao, :pessoa_contato, :telefone,
                    :mwh_mes, :concessionaria, :quem_indicou, :nome_quem_indicou,
                    :parceiro_unidade, :parceiro_nome, :updated_at
                ) ON CONFLICT (deal_id) DO UPDATE SET
                    uc = EXCLUDED.uc,
                    uc_aneel = EXCLUDED.uc_aneel,
                    nome_funil = EXCLUDED.nome_funil,
                    organizacao = EXCLUDED.organizacao,
                    pessoa_contato = EXCLUDED.pessoa_contato,
                    telefone = EXCLUDED.telefone,
                    mwh_mes = EXCLUDED.mwh_mes,
                    concessionaria = EXCLUDED.concessionaria,
                    quem_indicou = EXCLUDED.quem_indicou,
                    nome_quem_indicou = EXCLUDED.nome_quem_indicou,
                    parceiro_unidade = EXCLUDED.parceiro_unidade,
                    parceiro_nome = EXCLUDED.parceiro_nome,
                    updated_at = EXCLUDED.updated_at;
            """)
            conn.execute(stmt, item)
    print(f"✅ Salvo lote de {len(lista_itens)} registros no Supabase.", flush=True)

def importar_dados_pipedrive():
    try:
        verificar_e_criar_tabela()
        print("🚀 Iniciando extração do Pipedrive...")

        # 1. Busca os campos (DealFields) para mapear Hashes e Opções
        deal_fields_response = get_json("dealFields")
        deal_fields_data = deal_fields_response.get("data", [])

        name_to_key_map = {}
        key_to_options_map = {}

        for field in deal_fields_data:
            field_name = field.get("name")
            field_key = field.get("key")
            name_to_key_map[field_name] = field_key
            
            options = field.get("options")
            if options and isinstance(options, list):
                key_to_options_map[field_key] = {
                    str(opt.get("id")): opt.get("label") for opt in options
                }

        def get_custom_value(deal, field_name):
            key = name_to_key_map.get(field_name)
            if not key: return None
            
            val = deal.get(key)
            if val is None: return None

            options_map = key_to_options_map.get(key)
            if options_map:
                if isinstance(val, list):
                    return ", ".join([options_map.get(str(v), str(v)) for v in val])
                else:
                    return options_map.get(str(val), str(val))
            return val

        # 2. Busca os Negócios e vai salvando em Lotes
        start = 0
        has_more_pages = True
        total_baixado = 0

        while has_more_pages:
            params = {
                "status": "won",
                "limit": 500,
                "user_id": 0,
                "start": start
            }
            page_response = get_json("deals", params)

            if page_response and page_response.get("success") and page_response.get("data"):
                deals_da_pagina = page_response["data"]
                
                # Captura os funis
                related_pipelines = {}
                related = page_response.get("related_objects", {})
                if "pipeline" in related:
                    related_pipelines = related["pipeline"]

                lote_para_banco = []

                for deal in deals_da_pagina:
                    # Pega o telefone do campo customizado ou do contato
                    tel = get_custom_value(deal, "Telefone")
                    if not tel:
                        person = deal.get("person_id")
                        if isinstance(person, dict) and person.get("phone"):
                            telefones = person["phone"]
                            if len(telefones) > 0 and isinstance(telefones[0], dict):
                                tel = telefones[0].get("value")

                    pipeline_id = str(deal.get("pipeline_id"))
                    pipeline_name = related_pipelines.get(pipeline_id, {}).get("name") if pipeline_id in related_pipelines else None

                    org = deal.get("org_id")
                    org_name = org.get("name") if isinstance(org, dict) else None
                    
                    person = deal.get("person_id")
                    person_name = person.get("name") if isinstance(person, dict) else None

                    # Monta o objeto pra inserir no banco
                    lote_para_banco.append({
                        "deal_id": deal.get("id"),
                        "uc": get_custom_value(deal, "UC - Unidade Consumidora"),
                        "uc_aneel": get_custom_value(deal, "UC-ANEEL"),
                        "nome_funil": pipeline_name,
                        "organizacao": org_name,
                        "pessoa_contato": person_name,
                        "telefone": tel,
                        "mwh_mes": limpar_numero(get_custom_value(deal, "MWh/Mês")),
                        "concessionaria": get_custom_value(deal, "Concessionária"),
                        "quem_indicou": get_custom_value(deal, "Quem Indicou"),
                        "nome_quem_indicou": get_custom_value(deal, "Nome de Quem Indicou"),
                        "parceiro_unidade": get_custom_value(deal, "Parceiros - Unidade de Quem Indicou"),
                        "parceiro_nome": get_custom_value(deal, "Parceiros - Nome de Quem Indicou"),
                        "updated_at": datetime.now()
                    })

                # Manda pro banco assim que monta a página
                salvar_em_lotes(lote_para_banco)
                total_baixado += len(lote_para_banco)

                # Verifica se tem mais páginas
                pagination = page_response.get("additional_data", {}).get("pagination", {})
                if pagination.get("more_items_in_collection"):
                    start = pagination.get("next_start")
                    print(f"🔄 Indo para a próxima página... (start: {start})")
                    time.sleep(0.5) # Respiro para a API
                else:
                    has_more_pages = False
            else:
                has_more_pages = False

        print(f"🎉 Extração finalizada! Total de {total_baixado} negócios atualizados no Supabase.")

    except Exception as e:
        print(f"❌ Erro na execução: {e}")

if __name__ == "__main__":
    importar_dados_pipedrive()