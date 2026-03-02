import os
import requests
import json
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

RD_TOKEN = os.getenv("RD_TOKEN")
DB_URL = os.getenv("DATABASE_URL")
RD_URL = "https://crm.rdstation.com/api/v1"

if not RD_TOKEN or not DB_URL:
    print("🛑 ERRO: Verifique as variáveis no seu arquivo .env")
    exit()

engine = create_engine(DB_URL)

# --- MAPA DE OBJETIVOS ---
def buscar_mapa_objetivos():
    print("🔎 Mapeando objetivos das etapas...")
    try:
        url = f"{RD_URL}/deal_pipelines?token={RD_TOKEN}"
        resp = requests.get(url)
        if resp.status_code != 200: return {}
        
        mapa = {}
        for pipe in resp.json():
            for stage in pipe.get('deal_stages', []):
                mapa[stage['id']] = stage.get('objective', '')
        return mapa
    except Exception as e:
        print(f"⚠️ Erro ao buscar pipelines: {e}")
        return {}

MAPA_OBJETIVOS = buscar_mapa_objetivos()

def limpar_uc(valor):
    if not valor: return None
    v = str(valor).replace('.', '').replace('-', '').replace('/', '').replace(' ', '').strip()
    return v if v else None

def tratar_data_rd(val):
    if not val: return None
    val_str = str(val).strip()
    try:
        if 'T' in val_str: return val_str.split('T')[0]
        if '/' in val_str:
            partes = val_str.split('/')
            if len(partes) == 3: return f"{partes[2]}-{partes[1]}-{partes[0]}"
        return val_str
    except: return None

def limpar_decimal(val):
    if val is None or val == "": return 0.0
    try:
        if isinstance(val, (int, float)): return float(val)
        return float(str(val).replace('.', '').replace(',', '.').strip())
    except: return 0.0

def limpar_inteiro(val):
    if not val: return None
    try:
        return int(float(str(val).replace(',', '.')))
    except: return None

def processar_negocio(deal):
    custom_fields = deal.get('deal_custom_fields', [])
    campos = {f['custom_field']['label']: f['value'] for f in custom_fields if f.get('custom_field')}
    
    concessionaria = campos.get('Concessionária') or campos.get('Distribuidora')
    uc = limpar_uc(campos.get('Unidade Consumidora') or campos.get('UC'))
    consumo_mwh = limpar_decimal(campos.get('Consumo Médio na Venda (MWh)'))
    dia_leitura = limpar_inteiro(campos.get('Data de leitura estimada (Dia)'))

    stage_id = deal.get('deal_stage', {}).get('id')
    objetivo_etapa = MAPA_OBJETIVOS.get(stage_id, '')

    # Usando a data do RD Station para manter a fidelidade
    data_atualizacao = tratar_data_rd(deal.get('updated_at'))
    if not data_atualizacao:
        data_atualizacao = datetime.now()

    return {
        "id_negocio": deal.get('id'),
        "uc": uc,
        "nome_negocio": deal.get('name'),
        "concessionaria": concessionaria, 
        "area_de_gestao": campos.get('Área de Gestão') or campos.get('Geração Compartilhada'),
        "status_rd": deal.get('deal_stage', {}).get('name'),
        "objetivo_etapa": objetivo_etapa,
        "data_ganho": tratar_data_rd(deal.get('closed_at')),
        "data_protocolo": tratar_data_rd(campos.get('Data do 1º protocolo')), 
        "data_cancelamento": tratar_data_rd(campos.get('Data de pedido de cancelamento')),
        "consumo_medio_mwh": consumo_mwh,
        "dia_leitura": dia_leitura,
        "json_completo": json.dumps(deal), 
        "updated_at": data_atualizacao
    }

def atualizar_negocio_especifico(id_negocio):
    print(f"🚀 Buscando o negócio ID: {id_negocio}...")
    
    # Endpoint específico para buscar 1 negócio pelo ID
    url = f"{RD_URL}/deals/{id_negocio}?token={RD_TOKEN}"
    resp = requests.get(url)
    
    if resp.status_code == 404:
        print("❌ Negócio não encontrado na RD Station. Verifique se o ID está correto.")
        return
    elif resp.status_code != 200:
        print(f"❌ Erro na API da RD: Código {resp.status_code} - {resp.text}")
        return

    deal = resp.json()
    dado = processar_negocio(deal)
    
    # O mesmo SQL seguro (com nome e json) que corrigimos no arquivo principal
    stmt = text("""
        INSERT INTO raw_rd_station (
            id_negocio, uc, nome_negocio, concessionaria, area_de_gestao, 
            status_rd, objetivo_etapa, data_ganho, data_protocolo, data_cancelamento, 
            consumo_medio_mwh, dia_leitura, json_completo, updated_at
        )
        VALUES (
            :id_negocio, :uc, :nome_negocio, :concessionaria, :area_de_gestao, 
            :status_rd, :objetivo_etapa, :data_ganho, :data_protocolo, :data_cancelamento, 
            :consumo_medio_mwh, :dia_leitura, :json_completo, :updated_at
        )
        ON CONFLICT (id_negocio) DO UPDATE SET
            uc = EXCLUDED.uc,
            concessionaria = EXCLUDED.concessionaria,
            status_rd = EXCLUDED.status_rd,
            objetivo_etapa = EXCLUDED.objetivo_etapa,
            area_de_gestao = EXCLUDED.area_de_gestao,
            data_protocolo = EXCLUDED.data_protocolo,
            data_ganho = EXCLUDED.data_ganho,
            data_cancelamento = EXCLUDED.data_cancelamento,
            consumo_medio_mwh = EXCLUDED.consumo_medio_mwh,
            dia_leitura = EXCLUDED.dia_leitura,
            nome_negocio = EXCLUDED.nome_negocio,
            json_completo = EXCLUDED.json_completo,
            updated_at = EXCLUDED.updated_at;
    """)
    
    try:
        with engine.begin() as conn:
            # Passamos o dado dentro de uma lista [dado] porque o SQLAlchemy espera uma lista de dicionários
            conn.execute(stmt, [dado])
        print(f"✅ Sucesso! O negócio '{dado['nome_negocio']}' foi atualizado no Supabase.")
    except Exception as e:
        print(f"❌ Erro ao tentar salvar no banco de dados: {e}")

if __name__ == "__main__":
    # --- INSIRA O ID DA NEGOCIAÇÃO AQUI ---
    ID_ALVO = "695bbb4297c4080001825afe"
    
    atualizar_negocio_especifico(ID_ALVO)