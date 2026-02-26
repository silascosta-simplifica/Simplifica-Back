import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { action, payload } = await req.json();

    // --- ROTA 1: PLATAFORMA GESTÃO (UNIFICA) ---
    if (action === 'GESTAO_DOC') {
        const { uc, refYm, tipoDoc } = payload;
        // Puxa o Token das secrets do Supabase
        const token = Deno.env.get('GESTAO_TOKEN'); 

        const resBusca = await fetch(`https://plataforma-gestao-backend-34bd8753b111.herokuapp.com/dealership-bill/invoice-and-billing/captured-bills?uc=${uc}&date_ref=${refYm}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataBusca = await resBusca.json();

        if (!dataBusca?.data || dataBusca.data.length === 0) throw new Error("Documento não encontrado na plataforma de gestão.");

        const bill = dataBusca.data[0];
        let fileKey = tipoDoc === 'BOLETO' ? bill.invoice?.billing?.props?.file_key : bill.props?.file_key;

        if (!fileKey) throw new Error(`${tipoDoc} ainda não está disponível no sistema.`);

        const resUrl = await fetch(`https://plataforma-gestao-backend-34bd8753b111.herokuapp.com/aws/get-file-url/${encodeURIComponent(fileKey)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataUrl = await resUrl.json();

        const urlFinal = dataUrl?.data?.url || dataUrl?.url;
        return new Response(JSON.stringify({ url: urlFinal }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // --- ROTA 2: LUMI BOLETOS (Geração em PDF) ---
    if (action === 'LUMI_BOLETO') {
        const { uc, mesRef } = payload;
        const email = Deno.env.get('LUMI_EMAIL');
        const senha = Deno.env.get('LUMI_SENHA');

        const resLogin = await fetch('https://api.labs-lumi.com.br/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        const loginData = await resLogin.json();
        if (loginData.status !== 'sucesso') throw new Error("Falha de autenticação na Lumi.");

        const parts = mesRef.split('/');
        const driveId = `${uc}-${parts[0]}-${parts[1]}`;
        const resBoleto = await fetch('https://api.labs-lumi.com.br/pagamentos/preview-cobranca/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${loginData.token}` },
            body: JSON.stringify({ drive_id: driveId })
        });

        const boletoData = await resBoleto.json();
        if (boletoData.status !== 'successo' || !boletoData.data?.toRender?.data) throw new Error("A Lumi não gerou o boleto para este mês.");

        // Retornamos os bytes do PDF diretamente pro navegador
        return new Response(JSON.stringify({ buffer: boletoData.data.toRender.data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    throw new Error("Ação não reconhecida.");
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  }
})