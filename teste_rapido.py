import requests
import os
from dotenv import load_dotenv

load_dotenv()
token = os.getenv("UNIFICA_TOKEN")
url = f"{os.getenv('UNIFICA_BASE_URL').rstrip('/')}/operacao/cobrancas?page=1&per_page=1"

headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
resp = requests.get(url, headers=headers).json()

print(f"\n🎯 A Unifica diz que tem exatamente: {resp['meta']['total']} faturas no sistema.")