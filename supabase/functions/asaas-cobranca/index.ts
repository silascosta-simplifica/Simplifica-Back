import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { asaas_id } = await req.json()

    if (!asaas_id) {
      return new Response(JSON.stringify({ error: 'asaas_id não fornecido pelo painel.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, 
      })
    }

    const asaasKey = Deno.env.get('ASAAS_API_KEY')
    if (!asaasKey) {
      return new Response(JSON.stringify({ error: 'Chave secreta do Asaas não encontrada no servidor.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // ATENÇÃO: Se a sua chave for de TESTE (Sandbox), troque "api.asaas.com" por "sandbox.asaas.com" abaixo:
    const baseUrl = 'https://api.asaas.com/v3';

    const [pixRes, barcodeRes] = await Promise.all([
      fetch(`${baseUrl}/payments/${asaas_id}/pixQrCode`, {
        method: 'GET',
        headers: { 'access_token': asaasKey }
      }),
      fetch(`${baseUrl}/payments/${asaas_id}/identificationField`, {
        method: 'GET',
        headers: { 'access_token': asaasKey }
      })
    ]);

    const pixData = await pixRes.json();
    const barcodeData = await barcodeRes.json();

    // Se a chave for inválida ou o ambiente estiver errado, o Asaas avisa
    if (pixRes.status === 401) {
        return new Response(JSON.stringify({ error: 'Erro 401: Chave do Asaas inválida ou ambiente errado (Sandbox vs Prod).' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }

    // Se o Asaas não achar a cobrança
    if (pixRes.status === 404) {
        return new Response(JSON.stringify({ error: `Cobrança ID ${asaas_id} não encontrada na conta do Asaas configurada.` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }

    return new Response(JSON.stringify({
      pix: pixData.payload || null,
      barcode: barcodeData.identificationField || null,
      error_pix: pixData.errors ? pixData.errors[0]?.description : null,
      error_barcode: barcodeData.errors ? barcodeData.errors[0]?.description : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: `Erro na Função: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Retornamos 200 pro front-end ler a mensagem real de erro
    })
  }
})