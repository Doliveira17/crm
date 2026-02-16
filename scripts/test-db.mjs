// Teste de conexão com Supabase (SEM credenciais hardcoded)
// Uso:
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/test-db.mjs
// ou (para tarefas administrativas):
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/test-db.mjs

import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Variáveis ausentes. Defina SUPABASE_URL e SUPABASE_ANON_KEY (ou SUPABASE_SERVICE_ROLE_KEY)."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("🔍 Testando conexão com Supabase...");

  const { count: clientesCount, error: clientesError } = await supabase
    .from("crm_clientes")
    .select("*", { count: "exact", head: true });

  if (clientesError) {
    console.error("❌ Erro ao acessar crm_clientes:", clientesError.message);
    process.exit(1);
  }

  console.log("✅ Conexão OK. Total de clientes:", clientesCount ?? 0);

  const { data: amostra, error: amostraError } = await supabase
    .from("crm_clientes")
    .select("id, razao_social, documento, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (amostraError) {
    console.error("⚠️ Erro ao buscar amostra:", amostraError.message);
    process.exit(1);
  }

  console.log("📋 Amostra (1):", amostra?.[0] ?? null);
}

main().catch((err) => {
  console.error("❌ Erro:", err?.message ?? err);
  process.exit(1);
});

