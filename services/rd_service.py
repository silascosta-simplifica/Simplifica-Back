import os
import time
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
    print("🛑 ERRO: Verifique .env")
    exit()

engine = create_engine(DB_URL)

# --- MAPA DE OBJETIVOS (Igual ao seu Google Script) ---
def buscar_mapa_objetivos():
    """Busca todos os funis e cria um mapa {stage_id: objective}"""
    print("🔎 Mapeando objetivos das etapas...")
    try:
        url = f"{RD_URL}/deal_pipelines?token={RD_TOKEN}"
        resp = requests.get(url)
        if resp.status_code != 200: return {}
        
        mapa = {}
        pipelines = resp.json()
        for pipe in pipelines:
            for stage in pipe.get('deal_stages', []):
                # Guarda o objetivo usando o ID da etapa como chave
                mapa[stage['id']] = stage.get('objective', '')
        return mapa
    except Exception as e:
        print(f"⚠️ Erro ao buscar pipelines: {e}")
        return {}

# Cache global dos objetivos
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

    # Pega o ID da etapa atual do negócio
    stage_id = deal.get('deal_stage', {}).get('id')
    # Busca o objetivo no nosso mapa
    objetivo_etapa = MAPA_OBJETIVOS.get(stage_id, '')

    return {
        "id_negocio": deal.get('id'),
        "uc": uc,
        "nome_negocio": deal.get('name'),
        "concessionaria": concessionaria, 
        "area_de_gestao": campos.get('Área de Gestão') or campos.get('Geração Compartilhada'),
        "status_rd": deal.get('deal_stage', {}).get('name'),
        "objetivo_etapa": objetivo_etapa, # NOVO CAMPO
        "data_ganho": tratar_data_rd(deal.get('closed_at')),
        "data_protocolo": tratar_data_rd(campos.get('Data do 1º protocolo')), 
        "data_cancelamento": tratar_data_rd(campos.get('Data de pedido de cancelamento')),
        "consumo_medio_mwh": consumo_mwh,
        "dia_leitura": dia_leitura,
        "json_completo": json.dumps(deal), 
        "updated_at": datetime.now()
    }

def executar_sync_rd():
    print("🚀 Iniciando Sync RD (Com Objetivos)...")
    
    page = 1
    has_more = True
    total_salvos = 0
    
    while has_more:
        print(f"🔄 Baixando pág {page}...", end='\r')
        try:
            url = f"{RD_URL}/deals?token={RD_TOKEN}&page={page}&limit=200&sort=updated_at&direction=desc"
            resp = requests.get(url)
            if resp.status_code != 200: break
                
            data = resp.json()
            deals = data.get('deals', [])
            has_more = data.get('has_more', False)
            if not deals: break
                
            lista = []
            for deal in deals:
                dado = processar_negocio(deal)
                if dado['uc']: lista.append(dado)
            
            if lista:
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
                        updated_at = EXCLUDED.updated_at;
                """)
                with engine.begin() as conn: conn.execute(stmt, lista)
                total_salvos += len(lista)
                print(f"✅ Pág {page}: +{len(lista)} negócios.")

            page += 1
            time.sleep(0.2)
            
        except Exception as e:
            print(f"\n❌ Erro: {e}")
            time.sleep(5) 
            
    print(f"\n🏁 Fim! Total: {total_salvos}")

if __name__ == "__main__":
    executar_sync_rd()