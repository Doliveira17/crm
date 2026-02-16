// Teste simples de endpoints locais (SEM credenciais)
// Uso: node scripts/test-fetch.mjs

const url = process.env.METRICS_URL ?? "http://localhost:3000/api/faturas/metrics";

(async () => {
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log("URL", url);
    console.log("STATUS", res.status);
    console.log(text);
  } catch (e) {
    console.error("ERR", e?.message ?? e);
    process.exit(1);
  }
})();

