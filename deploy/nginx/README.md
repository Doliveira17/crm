# Nginx fallback para inicializacao

Este setup evita a tela `ERR_CONNECTION_REFUSED` quando o Next.js ainda nao subiu.

## Como funciona
- O Nginx fica sempre no ar na porta `3000`.
- Ele tenta encaminhar para o Next em `127.0.0.1:3001`.
- Se o Next estiver offline (`502/503/504`), entrega `fallback.html`.

## Passos (Ubuntu/Debian)
1. Instale o Nginx:
   - `sudo apt update && sudo apt install -y nginx`
2. Copie a pagina de fallback:
   - `sudo mkdir -p /var/www/solarcrm-fallback`
   - `sudo cp deploy/nginx/fallback.html /var/www/solarcrm-fallback/fallback.html`
3. Copie a config:
   - `sudo cp deploy/nginx/nginx.conf /etc/nginx/sites-available/solarcrm`
4. Ative o site e desative o default:
   - `sudo ln -sf /etc/nginx/sites-available/solarcrm /etc/nginx/sites-enabled/solarcrm`
   - `sudo rm -f /etc/nginx/sites-enabled/default`
5. Valide e reinicie:
   - `sudo nginx -t`
   - `sudo systemctl restart nginx`

## Next.js em producao
- Suba o app na porta `3001`:
  - `npm run build`
  - `npm run start -- -p 3001`

## Teste rapido
- Abra `http://localhost:3000` com o Next desligado: deve aparecer a tela de inicializacao.
- Ligue o Next em `3001`: o Nginx passa a mostrar a aplicacao automaticamente.

## Com SSL (recomendado)
- Use Certbot:
  - `sudo apt install -y certbot python3-certbot-nginx`
  - `sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com`

## Windows (sem Nginx)
Se voce esta no Windows, use o comando unico abaixo:

1. Rode:
   - `npm run dev:3000`
2. Abra:
   - `http://localhost:3000`

Enquanto o Next nao estiver de pe, aparece `fallback.html`. Assim que subir, o proxy mostra a aplicacao automaticamente.
