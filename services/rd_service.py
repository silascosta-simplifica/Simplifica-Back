import os
import time
import requests
import json
import csv
import re
from io import StringIO
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

load_dotenv()

RD_TOKEN = os.getenv("RD_TOKEN")
DB_URL = os.getenv("DATABASE_URL")
RD_URL = "https://crm.rdstation.com/api/v1"

if not RD_TOKEN or not DB_URL:
    print("🛑 ERRO: Verifique .env")
    exit()

engine = create_engine(DB_URL)
session = requests.Session()
retry = Retry(total=5, backoff_factor=2, status_forcelist=[429, 500, 502, 503, 504], allowed_methods=["GET"])
adapter = HTTPAdapter(max_retries=retry)
session.mount("http://", adapter)
session.mount("https://", adapter)

def limpar_uc(valor):
    if not valor: return None
    v = str(valor).replace('.', '').replace('-', '').replace('/', '').replace(' ', '').strip()
    return v if v else None

def limpar_num_seguro(val):
    if not val or str(val).strip() == "": return 0.0
    try: return float(str(val).replace('%', '').replace(',', '.').strip())
    except ValueError: return 0.0 # Proteção contra textos como "Parceiros - Geral"

# =====================================================
# FUNÇÃO 1: MANTÉM O ADMIN VIVO (Planilha Antiga/Fixa)
# =====================================================
def sincronizar_regras_google_sheets():
    print("📊 Baixando regras de comissão ANTIGAS (Para o Admin)...")
    PLANILHA_ESPELHO_ID = "1plZVHD9w0gznHmvIzDo5kzutFrMSm6n770AfsiQcx44"
    url_csv = f"https://docs.google.com/spreadsheets/d/{PLANILHA_ESPELHO_ID}/export?format=csv&gid=0"
    
    try:
        resp = session.get(url_csv, timeout=30)
        resp.encoding = 'utf-8' 
        if resp.status_code != 200: return False
        arquivo_csv = StringIO(resp.text)
        leitor = csv.DictReader(arquivo_csv)
        lista_regras = []
        
        for linha in leitor:
            linha_limpa = {re.sub(r'\s+', ' ', str(k)).strip(): v for k, v in linha.items() if k is not None}
            razao_social = linha_limpa.get('Razão Social')
            if not razao_social or str(razao_social).strip() == "": continue
                
            def limpar_data(val):
                if not val or str(val).strip() == "": return None
                partes = str(val).split('/')
                if len(partes) == 3: return f"{partes[2]}-{partes[1]}-{partes[0]}"
                return None

            lista_regras.append({
                "razao_social": str(razao_social).strip(),
                "tipo": str(linha_limpa.get('Tipo', '')).strip().upper(),
                "perc_padrao": limpar_num_seguro(linha_limpa.get('% Padrão')),
                "perc_rge": limpar_num_seguro(linha_limpa.get('RGE')),
                "perc_celesc": limpar_num_seguro(linha_limpa.get('CELESC')),
                "perc_copel": limpar_num_seguro(linha_limpa.get('COPEL')),
                "perc_cemig": limpar_num_seguro(linha_limpa.get('CEMIG')),
                "perc_eqto_go": limpar_num_seguro(linha_limpa.get('EQTO-GO')),
                "perc_ceee": limpar_num_seguro(linha_limpa.get('CEEE')),
                "perc_personal": limpar_num_seguro(linha_limpa.get('% Personal')),
                "fixo_perc_assinatura": limpar_num_seguro(linha_limpa.get('Fixo - % Assinatura')),
                "fixo_perc_comp": limpar_num_seguro(linha_limpa.get('Fixo - % 1ª Comp.')), 
                "fixo_fidel_perc_assinatura": limpar_num_seguro(linha_limpa.get('Fixo FIDEL - % Assinatura')),
                "fixo_fidel_perc_comp": limpar_num_seguro(linha_limpa.get('Fixo FIDEL - % Comp.')),
                "estagio_1_ate": limpar_num_seguro(linha_limpa.get('Estágio 1 (Até kWh)')),
                "estagio_1_perc": limpar_num_seguro(linha_limpa.get('Estágio 1 (%)')),
                "estagio_2_ate": limpar_num_seguro(linha_limpa.get('Estágio 2 (Até kWh)')),
                "estagio_2_perc": limpar_num_seguro(linha_limpa.get('Estágio 2 (%)')),
                "estagio_3_acima": limpar_num_seguro(linha_limpa.get('Estágio 3 (Acima)')),
                "estagio_3_perc": limpar_num_seguro(linha_limpa.get('Estágio 3 (%)')),
                "regra_antiga_ate": limpar_data(linha_limpa.get('Regra Antiga (Até)')),
                "regra_antiga_perc": limpar_num_seguro(linha_limpa.get('Regra Antiga (%)'))
            })

        if lista_regras:
            with engine.begin() as conn:
                conn.execute(text("TRUNCATE TABLE regras_comissao;"))
                stmt = text("""
                    INSERT INTO regras_comissao (razao_social, tipo, perc_padrao, perc_rge, perc_celesc, perc_copel, perc_cemig, perc_eqto_go, perc_ceee, perc_personal, fixo_perc_assinatura, fixo_perc_comp, fixo_fidel_perc_assinatura, fixo_fidel_perc_comp, estagio_1_ate, estagio_1_perc, estagio_2_ate, estagio_2_perc, estagio_3_acima, estagio_3_perc, regra_antiga_ate, regra_antiga_perc) 
                    VALUES (:razao_social, :tipo, :perc_padrao, :perc_rge, :perc_celesc, :perc_copel, :perc_cemig, :perc_eqto_go, :perc_ceee, :perc_personal, :fixo_perc_assinatura, :fixo_perc_comp, :fixo_fidel_perc_assinatura, :fixo_fidel_perc_comp, :estagio_1_ate, :estagio_1_perc, :estagio_2_ate, :estagio_2_perc, :estagio_3_acima, :estagio_3_perc, :regra_antiga_ate, :regra_antiga_perc)
                """)
                conn.execute(stmt, lista_regras)
            print(f"✅ Regras Antigas salvas: {len(lista_regras)} linhas.")
    except Exception as e: print(f"❌ Erro Aba Antiga: {e}")

# =====================================================
# FUNÇÃO 2: O MOTOR NOVO (Aba Recorrência por UC)
# =====================================================
def sincronizar_regras_recorrencia_uc():
    print("📊 Baixando regras NOVAS de RECORRÊNCIA (Aba Insights)...")
    PLANILHA_ID = "1W8Eoo69fePMvKhNObK8omcliEMOdGPaoeYGmpZQNCb0"
    GID = "361851709"
    url_csv = f"https://docs.google.com/spreadsheets/d/{PLANILHA_ID}/export?format=csv&gid={GID}"
    
    try:
        resp = session.get(url_csv, timeout=30)
        resp.encoding = 'utf-8' 
        if resp.status_code != 200: return False
        arquivo_csv = StringIO(resp.text)
        leitor = csv.DictReader(arquivo_csv)
        lista_regras_uc = []
        
        for linha in leitor:
            linha_limpa = {re.sub(r'\s+', ' ', str(k)).strip().lower(): v for k, v in linha.items() if k is not None}
            
            tipo = str(linha_limpa.get('tipo', '')).strip().upper()
            if tipo != 'RECORRENTE': continue
            
            uc_limpa = limpar_uc(linha_limpa.get('negócio - uc - unidade consumidora'))
            if not uc_limpa: continue

            lista_regras_uc.append({
                "uc": uc_limpa,
                "parceiro_nome": str(linha_limpa.get('negócio - quem indicou', '')).strip(),
                "perc_parceiro": limpar_num_seguro(linha_limpa.get('recorrente parceiro %')),
                "indicador_nome": str(linha_limpa.get('negócio - nome de quem indicou', '')).strip(),
                "perc_indicador": limpar_num_seguro(linha_limpa.get('recorrente indicador %')),
                "perc_total": limpar_num_seguro(linha_limpa.get('recorrente total %'))
            })

        if lista_regras_uc:
            with engine.begin() as conn:
                conn.execute(text("TRUNCATE TABLE regras_recorrencia_uc;"))
                stmt = text("""
                    INSERT INTO regras_recorrencia_uc (uc, parceiro_nome, perc_parceiro, indicador_nome, perc_indicador, perc_total) 
                    VALUES (:uc, :parceiro_nome, :perc_parceiro, :indicador_nome, :perc_indicador, :perc_total)
                    ON CONFLICT (uc) DO UPDATE SET parceiro_nome = EXCLUDED.parceiro_nome, perc_parceiro = EXCLUDED.perc_parceiro, indicador_nome = EXCLUDED.indicador_nome, perc_indicador = EXCLUDED.perc_indicador, perc_total = EXCLUDED.perc_total;
                """)
                conn.execute(stmt, lista_regras_uc)
            print(f"✅ Tabela Nova de Recorrência atualizada! {len(lista_regras_uc)} UCs lidas.")
    except Exception as e: print(f"❌ Erro Aba Nova: {e}")

# =====================================================
# FUNÇÕES RD STATION
# =====================================================
def buscar_mapa_objetivos():
    try:
        resp = session.get(f"{RD_URL}/deal_pipelines?token={RD_TOKEN}", timeout=30) 
        if resp.status_code != 200: return {}
        mapa = {}
        for pipe in resp.json():
            for stage in pipe.get('deal_stages', []):
                mapa[stage['id']] = {'objetivo': stage.get('objective', ''), 'funil': pipe.get('name', '')}
        return mapa
    except: return {}

MAPA_OBJETIVOS = buscar_mapa_objetivos()

def tratar_data_rd(val):
    if not val: return None
    val_str = str(val).strip()
    try:
        if 'T' in val_str: return val_str.split('T')[0]
        if '/' in val_str:
            p = val_str.split('/')
            if len(p) == 3: return f"{p[2]}-{p[1]}-{p[0]}"
        return val_str
    except: return None

def limpar_decimal(val):
    if not val: return 0.0
    try: return float(str(val).replace('.', '').replace(',', '.').strip())
    except: return 0.0

def processar_negocio(deal):
    campos = {f['custom_field']['label']: f['value'] for f in deal.get('deal_custom_fields', []) if f.get('custom_field')}
    stage_id = deal.get('deal_stage', {}).get('id')
    info_etapa = MAPA_OBJETIVOS.get(stage_id, {})
    try: dia_leitura = int(float(str(campos.get('Data de leitura estimada (Dia)')).replace(',', '.')))
    except: dia_leitura = None

    return {
        "id_negocio": deal.get('id'), "uc": limpar_uc(campos.get('Unidade Consumidora') or campos.get('UC')),
        "nome_negocio": deal.get('name'), "funil": info_etapa.get('funil', ''),
        "concessionaria": campos.get('Concessionária') or campos.get('Distribuidora'), 
        "area_de_gestao": campos.get('Área de Gestão') or campos.get('Geração Compartilhada'),
        "status_rd": deal.get('deal_stage', {}).get('name'), "objetivo_etapa": info_etapa.get('objetivo', ''),
        "data_ganho": tratar_data_rd(deal.get('closed_at')), "data_protocolo": tratar_data_rd(campos.get('Data do 1º protocolo')), 
        "data_cancelamento": tratar_data_rd(campos.get('Data de pedido de cancelamento')),
        "consumo_medio_mwh": limpar_decimal(campos.get('Consumo Médio na Venda (MWh)')),
        "dia_leitura": dia_leitura, "json_completo": json.dumps(deal), 
        "updated_at": tratar_data_rd(deal.get('updated_at')) or datetime.now()
    }

def executar_sync_rd():
    print("🚀 Iniciando Sync RD...")
    page = 1; has_more = True; total_salvos = 0; ids_ativos_rd = set(); sucesso_total = True 
    while has_more:
        print(f"🔄 Baixando pág {page}...", end='\r')
        try:
            resp = session.get(f"{RD_URL}/deals?token={RD_TOKEN}&page={page}&limit=200&sort=updated_at&direction=desc", timeout=30)
            if resp.status_code != 200: sucesso_total = False; break
            data = resp.json(); deals = data.get('deals', []); has_more = data.get('has_more', False)
            if not deals: break
            lista = [processar_negocio(deal) for deal in deals]
            for deal in deals: ids_ativos_rd.add(deal.get('id'))
            if lista:
                stmt = text("""
                    INSERT INTO raw_rd_station (id_negocio, uc, nome_negocio, funil, concessionaria, area_de_gestao, status_rd, objetivo_etapa, data_ganho, data_protocolo, data_cancelamento, consumo_medio_mwh, dia_leitura, json_completo, updated_at)
                    VALUES (:id_negocio, :uc, :nome_negocio, :funil, :concessionaria, :area_de_gestao, :status_rd, :objetivo_etapa, :data_ganho, :data_protocolo, :data_cancelamento, :consumo_medio_mwh, :dia_leitura, :json_completo, :updated_at)
                    ON CONFLICT (id_negocio) DO UPDATE SET uc = EXCLUDED.uc, funil = EXCLUDED.funil, concessionaria = EXCLUDED.concessionaria, status_rd = EXCLUDED.status_rd, objetivo_etapa = EXCLUDED.objetivo_etapa, area_de_gestao = EXCLUDED.area_de_gestao, data_protocolo = EXCLUDED.data_protocolo, data_ganho = EXCLUDED.data_ganho, data_cancelamento = EXCLUDED.data_cancelamento, consumo_medio_mwh = EXCLUDED.consumo_medio_mwh, dia_leitura = EXCLUDED.dia_leitura, nome_negocio = EXCLUDED.nome_negocio, json_completo = EXCLUDED.json_completo, updated_at = EXCLUDED.updated_at;
                """)
                with engine.begin() as conn: conn.execute(stmt, lista)
                total_salvos += len(lista)
            page += 1
            time.sleep(0.2)
        except Exception as e: sucesso_total = False; break 
            
    print(f"\n🏁 Fim da leitura! Total RD processado: {total_salvos}")
    if sucesso_total and len(ids_ativos_rd) > 0:
        try:
            with engine.begin() as conn:
                ids_no_banco = {row[0] for row in conn.execute(text("SELECT id_negocio FROM raw_rd_station")).fetchall()}
                ids_para_deletar = ids_no_banco - ids_ativos_rd
                if ids_para_deletar: conn.execute(text("DELETE FROM raw_rd_station WHERE id_negocio IN :ids"), {"ids": tuple(ids_para_deletar)})
        except: pass

if __name__ == "__main__":
    sincronizar_regras_google_sheets()
    sincronizar_regras_recorrencia_uc()
    executar_sync_rd()