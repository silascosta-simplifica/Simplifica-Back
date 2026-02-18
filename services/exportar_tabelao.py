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
        # Busca direta da VIEW consolidada
        query = """
        SELECT * FROM analytics_completo 
        ORDER BY mes_referencia DESC, nome_cliente ASC
        """
        
        print("⏳ Baixando dados do Supabase (isso pode levar alguns segundos)...")
        df = pd.read_sql(query, engine)
        
        if df.empty:
            print("⚠️ A tabela está vazia.")
            return

        # Ajustes estéticos para o Excel
        print("🎨 Formatando planilha...")
        
        # Renomear colunas para ficar bonito no Excel
        df = df.rename(columns={
            "uc": "UC",
            "mes_referencia": "Mês Ref",
            "nome_cliente": "Cliente",
            "concessionaria": "Concessionária (RD)",
            "area_de_gestao": "Área de Gestão",
            "objetivo_etapa": "Etapa (RD)",          # <--- NOVA COLUNA
            "total_cobranca": "Valor Cobrança (R$)", # <--- Agora contém Real OU Estimado RD
            "consumo_kwh": "Consumo (kWh)",
            "compensacao_kwh": "Compensação (kWh)",
            "economia_rs": "Economia (R$)",
            "status": "Status Pagamento",
            "vencimento": "Vencimento",
            "data_ganho": "Data Ganho (RD)",
            "fonte_dados": "Origem do Dado Financeiro"
        })

        # Colunas que queremos exportar (nessa ordem)
        colunas_finais = [
            "UC", "Mês Ref", "Cliente", "Concessionária (RD)", "Área de Gestão", 
            "Etapa (RD)", "Valor Cobrança (R$)", "Consumo (kWh)", 
            "Compensação (kWh)", "Economia (R$)", "Status Pagamento", 
            "Vencimento", "Origem do Dado Financeiro"
        ]
        
        # Filtra apenas as colunas existentes para evitar erro
        cols_existentes = [c for c in colunas_finais if c in df.columns]
        df = df[cols_existentes]

        # Gera nome com data e hora
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
        arquivo_saida = f"Tabelao_Completo_{timestamp}.xlsx"
        
        df.to_excel(arquivo_saida, index=False)
        
        print(f"\n✅ SUCESSO! Arquivo gerado na pasta raiz:")
        print(f"📂 {os.path.abspath(arquivo_saida)}")
        print(f"📊 Total de linhas: {len(df)}")

    except Exception as e:
        print(f"❌ Erro ao exportar: {e}")

if __name__ == "__main__":
    exportar_tabelao()