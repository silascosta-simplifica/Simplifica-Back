import pandas as pd
import os
from sqlalchemy import create_engine
from dotenv import load_dotenv
from datetime import datetime

# Carrega configurações
load_dotenv()
DB_URL = os.getenv("DATABASE_URL")

if not DB_URL:
    print("🛑 ERRO: DATABASE_URL não encontrada.")
    exit()

def exportar_tabelao():
    print("🚀 Iniciando extração do Tabelão Completo...")
    
    engine = create_engine(DB_URL)
    
    try:
        # Busca direta da VIEW consolidada (que carrega as novas colunas)
        query = """
        SELECT * FROM analytics_completo 
        ORDER BY mes_referencia DESC, nome_cliente ASC
        """
        
        print("⏳ Baixando dados do Supabase (isso pode levar alguns segundos)...")
        df = pd.read_sql(query, engine)
        
        if df.empty:
            print("⚠️ A tabela está vazia.")
            return

        print("🎨 Formatando planilha para auditoria...")
        
        # Traduzindo as colunas do banco para nomes de fácil leitura no Excel
        df = df.rename(columns={
            "uc": "UC",
            "mes_referencia": "Mês Ref",
            "nome_cliente": "Cliente",
            "concessionaria": "Concessionária",
            "area_de_gestao": "Área de Gestão",
            "objetivo_etapa": "Etapa (RD)",
            "fonte_dados": "Origem do Dado",
            "status": "Status Pagamento",
            "consumo_crm_mwh": "Consumo RD (MWh)",
            "consumo_kwh": "Consumo Fatura (kWh)",
            "compensacao_kwh": "Compensação Fatura (kWh)",
            "eficiencia_compensacao": "Eficiência (%)",
            "tarifa_estimada": "Tarifa Estimada (RD)",
            "tarifa_real": "Tarifa Real (Fatura)",
            "valor_estimado": "Valor Estimado (R$)",
            "valor_real_cobranca": "Valor Realizado (R$)",
            "total_cobranca": "Total Final (R$)",
            "economia_rs": "Economia (R$)",
            "data_ganho": "Data de Ganho",
            "data_protocolo": "Data do 1º Protocolo",
            "data_cancelamento": "Data de Cancelamento",
            "dia_leitura": "Dia Leitura Base",
            "data_emissao_prevista": "Data Emissão Prevista",
            "data_emissao": "Data Emissão Real",
            "vencimento": "Vencimento"
        })

        # Nova Ordem Estratégica das Colunas no Excel
        colunas_finais = [
            "UC", "Cliente", "Mês Ref", "Concessionária", "Área de Gestão", 
            "Etapa (RD)", "Origem do Dado", "Status Pagamento", 
            "Consumo RD (MWh)", "Consumo Fatura (kWh)", "Compensação Fatura (kWh)", "Eficiência (%)",
            "Tarifa Estimada (RD)", "Tarifa Real (Fatura)",
            "Valor Estimado (R$)", "Valor Realizado (R$)", "Total Final (R$)", "Economia (R$)",
            "Data de Ganho", "Data do 1º Protocolo", "Data de Cancelamento",
            "Dia Leitura Base", "Data Emissão Prevista", "Data Emissão Real", "Vencimento"
        ]
        
        # Filtra apenas as colunas existentes garantindo a nova ordem
        cols_existentes = [c for c in colunas_finais if c in df.columns]
        df = df[cols_existentes]

        # Multiplica a eficiência por 100 para o Excel ler mais fácil (se existir)
        if "Eficiência (%)" in df.columns:
            df["Eficiência (%)"] = df["Eficiência (%)"] * 100

        # Gera nome com data e hora
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
        arquivo_saida = f"Tabelao_Auditoria_{timestamp}.xlsx"
        
        df.to_excel(arquivo_saida, index=False)
        
        print(f"\n✅ SUCESSO! Arquivo gerado na pasta raiz:")
        print(f"📂 {os.path.abspath(arquivo_saida)}")
        print(f"📊 Total de linhas: {len(df)}")

    except Exception as e:
        print(f"❌ Erro ao exportar: {e}")

if __name__ == "__main__":
    exportar_tabelao()