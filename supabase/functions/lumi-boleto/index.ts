import "@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Tratamento de CORS para o navegador não bloquear
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { uc, mes_referencia } = await req.json()

    // 1. Pega as credenciais guardadas nas variáveis de ambiente do Supabase
    const email = Deno.env.get('LUMI_EMAIL')
    const senha = Deno.env.get('LUMI_SENHA')

    if (!email || !senha) {
      throw new Error("Credenciais da Lumi não configuradas no Supabase.")
    }

    // 2. Extrai o Mês e Ano (Ex: "01/2025" ou "2025-01" -> 01 e 2025)
    let month = "", year = "";
    if (mes_referencia.includes('-')) {
      [year, month] = mes_referencia.split('-');
    } else if (mes_referencia.includes('/')) {
      [month, year] = mes_referencia.split('/');
    }

    if (!month || !year) throw new Error("Mês de referência inválido.");

    // 3. Fazer Login na Lumi
    const loginRes = await fetch("https://api.labs-lumi.com.br/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha })
    });
    
    const loginData = await loginRes.json();
    if (loginData.status !== 'sucesso') {
      throw new Error("Falha ao logar na Lumi.");
    }
    const token = loginData.token;

    // 4. Buscar o Buffer do Boleto
    const driveId = `${uc}-${month}-${year}`;
    const boletoRes = await fetch("https://api.labs-lumi.com.br/pagamentos/preview-cobranca/location", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ drive_id: driveId })
    });

    const boletoData = await boletoRes.json();
    if (boletoData.status !== 'successo' || !boletoData.data?.toRender?.data) {
      throw new Error("Boleto não encontrado na Lumi para este período.");
    }

    // 5. Converter Buffer (Array de Bytes) para Base64 para mandar pro React
    const byteArray = new Uint8Array(boletoData.data.toRender.data);
    let binaryString = "";
    for (let i = 0; i < byteArray.byteLength; i++) {
        binaryString += String.fromCharCode(byteArray[i]);
    }
    const base64Pdf = btoa(binaryString);

    return new Response(
      JSON.stringify({ success: true, pdfBase64: base64Pdf }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})