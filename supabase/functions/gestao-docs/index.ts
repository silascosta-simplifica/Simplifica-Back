import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { uc, mes_ref, tipo } = await req.json()

    // Token fixo da Plataforma de Gestão
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZGQydDk4dTAwMDB6aDBsNmN5cnlyeDciLCJuYW1lIjoiUmFmYWVsIFNhcGlhIiwiZW1haWwiOiJyYWZhZWwuc2FwaWFAc2ltcGxpZmljYWVuZXJnaWEuY29tLmJyIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzYzMzg4MjYzfQ.ZtyVeSKBnau5IAUa72RSon2OdNRoo8Kkf66XlNvJf40';
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

    // 1. Busca a fatura
    const urlBusca = `https://plataforma-gestao-backend-34bd8753b111.herokuapp.com/dealership-bill/invoice-and-billing/captured-bills?uc=${uc}&date_ref=${mes_ref}`
    const resBusca = await fetch(urlBusca, { headers })
    const dataBusca = await resBusca.json()

    if (!dataBusca?.data || dataBusca.data.length === 0) {
        return new Response(JSON.stringify({ error: 'Fatura não encontrada na Plataforma de Gestão.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    const bill = dataBusca.data[0]
    let fileKey = ''

    if (tipo === 'BOLETO') {
        fileKey = bill.invoice?.billing?.props?.file_key
        if (!fileKey) return new Response(JSON.stringify({ error: 'Boleto Simplifica não gerado.' }), { headers: { ...corsHeaders }, status: 200 })
    } else {
        fileKey = bill.props?.file_key
        if (!fileKey) return new Response(JSON.stringify({ error: 'Fatura da Concessionária não capturada.' }), { headers: { ...corsHeaders }, status: 200 })
    }

    // 2. Busca a URL assinada AWS
    const urlAws = `https://plataforma-gestao-backend-34bd8753b111.herokuapp.com/aws/get-file-url/${encodeURIComponent(fileKey)}`
    const resAws = await fetch(urlAws, { headers })
    const dataAws = await resAws.json()

    const finalUrl = dataAws?.data?.url || dataAws?.url
    if (!finalUrl) return new Response(JSON.stringify({ error: 'Não foi possível assinar a URL da AWS.' }), { headers: { ...corsHeaders }, status: 200 })

    return new Response(JSON.stringify({ url: finalUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: `Erro na Função: ${error.message}` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  }
})