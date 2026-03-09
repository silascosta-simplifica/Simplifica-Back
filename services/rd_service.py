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

# 1. IMPORTS NECESSÁRIOS PARA O RETRY
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

# --- 2. CONFIGURANDO A SESSÃO COM RETRY AUTOMÁTICO ---
session = requests.Session()
retry = Retry(
    total=5,             # Tenta até 5 vezes antes de falhar
    backoff_factor=2,    # Espera 2s, 4s, 8s entre as tentativas (evita sobrecarregar a API)
    status_forcelist=[429, 500, 502, 503, 504], # Erros de servidor que disparam o retry
    allowed_methods=["GET"]
)
adapter = HTTPAdapter(max_retries=retry)
session.mount("http://", adapter)
session.mount("https://", adapter)
# -----------------------------------------------------

# =====================================================
# SINCRONIZAR REGRAS DO GOOGLE SHEETS
# =====================================================
def sincronizar_regras_google_sheets():
    print("📊 Baixando regras de comissão do Google Sheets (Espelho)...")
    
    PLANILHA_ESPELHO_ID = "1plZVHD9w0gznHmvIzDo5kzutFrMSm6n770AfsiQcx44"
    url_csv = f"https://docs.google.com/spreadsheets/d/{PLANILHA_ESPELHO_ID}/export?format=csv&gid=0"
    
    try:
        resp = session.get(url_csv, timeout=30)
        resp.encoding = 'utf-8' 
        
        if resp.status_code != 200:
            print(f"❌ Erro ao baixar o Sheets: HTTP {resp.status_code}")
            return False
            
        if "<html" in resp.text[:50].lower() or "<!doctype html>" in resp.text[:50].lower():
            print("❌ ERRO DE PERMISSÃO: A planilha não está pública!")
            return False
            
        arquivo_csv = StringIO(resp.text)
        leitor = csv.DictReader(arquivo_csv)
        
        lista_regras = []
        
        for linha in leitor:
            linha_limpa = {}
            for k, v in linha.items():
                if k is not None:
                    chave_limpa = re.sub(r'\s+', ' ', str(k)).strip()
                    linha_limpa[chave_limpa] = v
            
            razao_social = linha_limpa.get('Razão Social')
            
            if not razao_social or str(razao_social).strip() == "":
                continue
                
            def limpar_num(val):
                if not val or str(val).strip() == "": return None
                return float(str(val).replace('%', '').replace(',', '.').strip())
                
            def limpar_data(val):
                if not val or str(val).strip() == "": return None
                partes = str(val).split('/')
                if len(partes) == 3: return f"{partes[2]}-{partes[1]}-{partes[0]}"
                return None

            lista_regras.append({
                "razao_social": str(razao_social).strip(),
                "tipo": str(linha_limpa.get('Tipo', '')).strip().upper(),
                "perc_padrao": limpar_num(linha_limpa.get('% Padrão')),
                "perc_rge": limpar_num(linha_limpa.get('RGE')),
                "perc_celesc": limpar_num(linha_limpa.get('CELESC')),
                "perc_copel": limpar_num(linha_limpa.get('COPEL')),
                "perc_cemig": limpar_num(linha_limpa.get('CEMIG')),
                "perc_eqto_go": limpar_num(linha_limpa.get('EQTO-GO')),
                "perc_ceee": limpar_num(linha_limpa.get('CEEE')),
                "perc_personal": limpar_num(linha_limpa.get('% Personal')),
                "fixo_perc_assinatura": limpar_num(linha_limpa.get('Fixo - % Assinatura')),
                "fixo_perc_comp": limpar_num(linha_limpa.get('Fixo - % 1ª Comp.')), 
                "fixo_fidel_perc_assinatura": limpar_num(linha_limpa.get('Fixo FIDEL - % Assinatura')),
                "fixo_fidel_perc_comp": limpar_num(linha_limpa.get('Fixo FIDEL - % Comp.')),
                "estagio_1_ate": limpar_num(linha_limpa.get('Estágio 1 (Até kWh)')),
                "estagio_1_perc": limpar_num(linha_limpa.get('Estágio 1 (%)')),
                "estagio_2_ate": limpar_num(linha_limpa.get('Estágio 2 (Até kWh)')),
                "estagio_2_perc": limpar_num(linha_limpa.get('Estágio 2 (%)')),
                "estagio_3_acima": limpar_num(linha_limpa.get('Estágio 3 (Acima)')),
                "estagio_3_perc": limpar_num(linha_limpa.get('Estágio 3 (%)')),
                "regra_antiga_ate": limpar_data(linha_limpa.get('Regra Antiga (Até)')),
                "regra_antiga_perc": limpar_num(linha_limpa.get('Regra Antiga (%)'))
            })

        if len(lista_regras) > 0:
            with engine.begin() as conn:
                conn.execute(text("TRUNCATE TABLE regras_comissao;"))
                
                stmt = text("""
                    INSERT INTO regras_comissao (
                        razao_social, tipo, perc_padrao, perc_rge, perc_celesc, perc_copel, 
                        perc_cemig, perc_eqto_go, perc_ceee, perc_personal, fixo_perc_assinatura, fixo_perc_comp, 
                        fixo_fidel_perc_assinatura, fixo_fidel_perc_comp, estagio_1_ate, estagio_1_perc, 
                        estagio_2_ate, estagio_2_perc, estagio_3_acima, estagio_3_perc, 
                        regra_antiga_ate, regra_antiga_perc
                    ) VALUES (
                        :razao_social, :tipo, :perc_padrao, :perc_rge, :perc_celesc, :perc_copel, 
                        :perc_cemig, :perc_eqto_go, :perc_ceee, :perc_personal, :fixo_perc_assinatura, :fixo_perc_comp, 
                        :fixo_fidel_perc_assinatura, :fixo_fidel_perc_comp, :estagio_1_ate, :estagio_1_perc, 
                        :estagio_2_ate, :estagio_2_perc, :estagio_3_acima, :estagio_3_perc, 
                        :regra_antiga_ate, :regra_antiga_perc
                    )
                """)
                conn.execute(stmt, lista_regras)
            print(f"✅ Tabela de regras atualizada! {len(lista_regras)} parceiros lidos da planilha.")
            return True
        else:
            print("⚠️ AVISO: O código não encontrou linhas válidas com 'Razão Social'.")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao processar Google Sheets: {e}")
        return False
# =====================================================

# --- MAPA DE OBJETIVOS E FUNIS ---
def buscar_mapa_objetivos():
    print("🔎 Mapeando objetivos e funis das etapas...")
    try:
        url = f"{RD_URL}/deal_pipelines?token={RD_TOKEN}"
        resp = session.get(url, timeout=30) 
        if resp.status_code != 200: return {}
        
        mapa = {}
        pipelines = resp.json()
        for pipe in pipelines:
            nome_funil = pipe.get('name', '')
            for stage in pipe.get('deal_stages', []):
                mapa[stage['id']] = {
                    'objetivo': stage.get('objective', ''),
                    'funil': nome_funil
                }
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
    info_etapa = MAPA_OBJETIVOS.get(stage_id, {})
    objetivo_etapa = info_etapa.get('objetivo', '')
    nome_funil = info_etapa.get('funil', '')

    return {
        "id_negocio": deal.get('id'),
        "uc": uc,
        "nome_negocio": deal.get('name'),
        "funil": nome_funil,
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
        "updated_at": tratar_data_rd(deal.get('updated_at')) or datetime.now()
    }

def executar_sync_rd():
    print("🚀 Iniciando Sync RD (Com Funil, Objetivos e Limpeza de Deletados)...")
    
    page = 1
    has_more = True
    total_salvos = 0
    
    # 1. SACOLA DE IDs ATIVOS
    ids_ativos_rd = set() 
    sucesso_total = True # Trava de segurança
    
    while has_more:
        print(f"🔄 Baixando pág {page}...", end='\r')
        try:
            url = f"{RD_URL}/deals?token={RD_TOKEN}&page={page}&limit=200&sort=updated_at&direction=desc"
            resp = session.get(url, timeout=30)
            
            if resp.status_code != 200: 
                print(f"\n❌ Erro HTTP {resp.status_code} na página {page}.")
                sucesso_total = False
                break
                
            data = resp.json()
            deals = data.get('deals', [])
            has_more = data.get('has_more', False)
            if not deals: break
                
            lista = []
            for deal in deals:
                ids_ativos_rd.add(deal.get('id'))
                lista.append(processar_negocio(deal))
            
            if lista:
                stmt = text("""
                    INSERT INTO raw_rd_station (
                        id_negocio, uc, nome_negocio, funil, concessionaria, area_de_gestao, 
                        status_rd, objetivo_etapa, data_ganho, data_protocolo, data_cancelamento, 
                        consumo_medio_mwh, dia_leitura, json_completo, updated_at
                    )
                    VALUES (
                        :id_negocio, :uc, :nome_negocio, :funil, :concessionaria, :area_de_gestao, 
                        :status_rd, :objetivo_etapa, :data_ganho, :data_protocolo, :data_cancelamento, 
                        :consumo_medio_mwh, :dia_leitura, :json_completo, :updated_at
                    )
                    ON CONFLICT (id_negocio) DO UPDATE SET
                        uc = EXCLUDED.uc,
                        funil = EXCLUDED.funil,
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
                with engine.begin() as conn: conn.execute(stmt, lista)
                total_salvos += len(lista)
                print(f"✅ Pág {page}: +{len(lista)} negócios atualizados/inseridos.")

            page += 1
            time.sleep(0.2)
            
        except Exception as e:
            print(f"\n❌ Falha fatal na página {page} mesmo após retentativas: {e}")
            sucesso_total = False
            break 
            
    print(f"\n🏁 Fim da leitura! Total processado da API: {total_salvos}")
    
    # --- 3. ROTINA DE LIMPEZA (DELETAR FANTASMAS) ---
    if sucesso_total and len(ids_ativos_rd) > 0:
        print("🧹 Iniciando limpeza de negócios deletados...")
        try:
            with engine.begin() as conn:
                result = conn.execute(text("SELECT id_negocio FROM raw_rd_station")).fetchall()
                ids_no_banco = {row[0] for row in result}
                
                ids_para_deletar = ids_no_banco - ids_ativos_rd
                
                if ids_para_deletar:
                    stmt_delete = text("DELETE FROM raw_rd_station WHERE id_negocio IN :ids_fantasmas")
                    conn.execute(stmt_delete, {"ids_fantasmas": tuple(ids_para_deletar)})
                    print(f"🗑️  Limpeza concluída! {len(ids_para_deletar)} registros deletados do banco.")
                else:
                    print("✨ Nenhum registro precisou ser deletado. A base já estava idêntica.")
        except Exception as e:
            print(f"❌ Erro ao tentar deletar registros: {e}")
    else:
        print("⚠️ A limpeza foi ignorada porque houve falha ao baixar os dados ou a lista veio vazia.")

if __name__ == "__main__":
    sincronizar_regras_google_sheets()
    executar_sync_rd()