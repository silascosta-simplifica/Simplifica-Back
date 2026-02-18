import { createClient } from '@supabase/supabase-js';

// ================= CONFIGURAÇÃO =================
const SUPABASE_URL = 'https://tbmahofpakppsizivrgc.supabase.co';
// Use a chave service_role (secret) – NÃO use a anon key
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRibWFob2ZwYWtwcHNpeml2cmdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk4ODcyMiwiZXhwIjoyMDg2NTY0NzIyfQ.GKI1BTC7f-PEOKzKDGF4BjoToJ0_d3LrtVIRxxZwDP0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DELAY_MS = 150; // seguro para não sobrecarregar a BrasilAPI
// =================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function buscarCEPsFaltantes() {
  console.log('🚀 Iniciando busca de CEPs faltantes...');

  // 1. Obter todos os CEPs distintos da view (usando a coluna cep_uc)
  console.log('📦 Buscando CEPs únicos da view_crm_dashboard...');
  const { data: cepsFromView, error: errView } = await supabase
    .from('view_crm_dashboard')
    .select('cep_uc');

  if (errView) {
    console.error('❌ Erro ao buscar CEPs da view:', errView);
    return;
  }

  const todosCeps = new Set();
  cepsFromView.forEach(row => {
    if (row.cep_uc) {
      const limpo = row.cep_uc.replace(/\D/g, '');
      if (limpo.length === 8) todosCeps.add(limpo);
    }
  });

  console.log(`📍 Total de CEPs distintos no CRM: ${todosCeps.size}`);

  // 2. Obter CEPs já cacheados
  const { data: cacheAtual, error: errCache } = await supabase
    .from('cache_ceps')
    .select('cep');

  if (errCache) {
    console.error('❌ Erro ao buscar cache atual:', errCache);
    return;
  }

  const cacheSet = new Set(cacheAtual.map(item => item.cep));
  console.log(`✅ CEPs já em cache: ${cacheSet.size}`);

  // 3. Filtrar os que faltam
  const faltantes = [...todosCeps].filter(cep => !cacheSet.has(cep));
  console.log(`🛑 CEPs faltando: ${faltantes.length}`);

  if (faltantes.length === 0) {
    console.log('🎉 Nenhum CEP faltante. Tudo ok!');
    return;
  }

  // 4. Processar cada CEP faltante
  console.log('🌐 Iniciando consultas à BrasilAPI...');
  let processados = 0;
  let sucessos = 0;
  let falhas = 0;

  for (const cep of faltantes) {
    processados++;
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);

      if (response.ok) {
        const data = await response.json();

        if (data.location && data.location.coordinates) {
          // Inserir/atualizar no cache
          const { error: insertError } = await supabase
            .from('cache_ceps')
            .upsert({
              cep: cep,
              latitude: parseFloat(data.location.coordinates.latitude),
              longitude: parseFloat(data.location.coordinates.longitude),
              cidade: data.city,
              uf: data.state
            });

          if (insertError) {
            console.error(`❌ [${processados}/${faltantes.length}] Erro ao salvar CEP ${cep}:`, insertError.message);
            falhas++;
          } else {
            console.log(`✅ [${processados}/${faltantes.length}] Salvo: ${cep} - ${data.city}/${data.state} (${data.location.coordinates.latitude}, ${data.location.coordinates.longitude})`);
            sucessos++;
          }
        } else {
          // CEP válido mas sem coordenadas (raro) – marca como nulo para não tentar de novo
          console.warn(`⚠️ [${processados}/${faltantes.length}] CEP ${cep} não possui coordenadas.`);
          await supabase.from('cache_ceps').upsert({
            cep: cep,
            latitude: null,
            longitude: null,
            cidade: data.city || null,
            uf: data.state || null
          });
          falhas++;
        }
      } else {
        console.warn(`⚠️ [${processados}/${faltantes.length}] Erro HTTP ${response.status} para CEP ${cep}`);
        // Não insere nada – na próxima execução ele tentará novamente
        falhas++;
      }
    } catch (error) {
      console.error(`❌ [${processados}/${faltantes.length}] Exceção ao processar CEP ${cep}:`, error.message);
      falhas++;
    }

    await sleep(DELAY_MS);
  }

  console.log('\n📊 RESUMO FINAL');
  console.log(`Total processados: ${processados}`);
  console.log(`Sucessos (inseridos com coordenadas): ${sucessos}`);
  console.log(`Falhas (sem coordenadas ou erro): ${falhas}`);
  console.log('🏁 Processo concluído!');
}

buscarCEPsFaltantes();