# Guia de Deploy - Meta Stories Planner

## 1. Hospedar o frontend na Vercel

### Passo a passo

1. **Crie um repositório no GitHub** e faça push do projeto:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/SEU_USUARIO/meta-stories-planner.git
   git push -u origin main
   ```

2. **Conecte à Vercel**:
   - Acesse [vercel.com](https://vercel.com) e faça login
   - Clique em "Add New Project" e importe o repositório
   - **Root Directory**: selecione `frontend`
   - Clique em "Deploy"

3. **Configure as variáveis de ambiente** no painel da Vercel (Settings → Environment Variables):
   - `PUBLIC_FIREBASE_API_KEY`
   - `PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `PUBLIC_FIREBASE_PROJECT_ID`
   - `PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `PUBLIC_FIREBASE_APP_ID`

   Use os mesmos valores do seu `frontend/.env` local.

4. **Redeploy** após adicionar as variáveis para que o build use as credenciais.

---

## 2. GitHub Actions – Script diário às 7:30

O workflow em `.github/workflows/daily-post-stories.yml` roda o script `postar_stories.py --from-firebase` **todos os dias às 7:30 (horário de Brasília)**.

> **Nota:** GitHub Actions usa cron em **UTC**. 7:30 BRT = 10:30 UTC. Para outro fuso, ajuste o `cron` no arquivo.

### Secrets necessários

No repositório do GitHub: **Settings → Secrets and variables → Actions** → "New repository secret".

| Secret | Descrição |
|--------|-----------|
| `IG_BUSINESS_ACCOUNT_ID` | ID da conta de negócios do Instagram |
| `INSTAGRAM_ACCESS_TOKEN` | Token de acesso da API do Instagram |
| `FIREBASE_SERVICE_ACCOUNT` | Conteúdo completo do arquivo `service-account.json` (Firebase) |
| `FIREBASE_STORAGE_BUCKET` | (Opcional) Bucket do Firebase. Default: `meta-stories-planner-storage.firebasestorage.app` |

### Como adicionar o FIREBASE_SERVICE_ACCOUNT

1. Abra o arquivo `script/service-account.json`
2. Copie **todo** o conteúdo (incluindo `{` e `}`)
3. Cole no secret `FIREBASE_SERVICE_ACCOUNT`

### Execução manual

Você pode rodar o workflow manualmente em **Actions → Postar Stories Diário → Run workflow**.
