#!/usr/bin/env node

/**
 * Script para verificar a configuração do Supabase e debug de autenticação
 * Uso: node scripts/check-auth.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\n🔍 Verificador de Autenticação Supabase\n');

  // Verificar variáveis de ambiente
  console.log('📋 Verificando variáveis de ambiente...');
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '❌ Variáveis de ambiente não configuradas!\n' +
      'Crie um arquivo .env.local com:\n' +
      '  NEXT_PUBLIC_SUPABASE_URL=sua-url\n' +
      '  NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave'
    );
    process.exit(1);
  }
  console.log('✅ Variáveis de ambiente OK');
  console.log(`   URL: ${supabaseUrl}\n`);

  // Criar cliente
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Tentar fazer login
  console.log('🔑 Testando credenciais de login...\n');
  const email = await question('E-mail: ');
  const password = await question('Senha: ');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('\n❌ Erro de autenticação:', error.message);
      console.error('   Código:', error.status);
      
      if (error.message.includes('Invalid login credentials')) {
        console.log('\n💡 Dicas:');
        console.log('   1. Verifique se o usuario foi criado no Supabase');
        console.log('   2. Abra: https://app.supabase.com → Authentication → Users');
        console.log('   3. Se não houver usuarios, clique em "Add User"');
        console.log('   4. Crie um usuario com email e senha');
      }
      process.exit(1);
    }

    console.log('\n✅ Login bem-sucedido!');
    console.log('\n📊 Informações do usuário:');
    console.log(`   UID: ${data.user?.id}`);
    console.log(`   Email: ${data.user?.email}`);
    console.log(`   Criado em: ${new Date(data.user?.created_at || '').toLocaleString('pt-BR')}`);
    console.log(`   Token: ${data.session?.access_token.substring(0, 20)}...`);
  } catch (err) {
    console.error('\n⚠️  Erro inesperado:', err);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
