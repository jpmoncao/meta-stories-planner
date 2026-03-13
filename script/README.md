# Scripts do Meta Stories Planner

## 1. Gerar moldura (gerar_story_moldura.py)

Gera imagens no formato de story do Instagram com fundo verde UK Imóveis.

```bash
python gerar_story_moldura.py
```

## 2. Publicar Stories no Instagram (postar_stories.py)

Publica imagens como Stories no Instagram via Graph API. Usa o fluxo em duas etapas:

1. **Criar container**: `POST /{ig-user-id}/media` com `image_url` e `media_type: "STORIES"`
2. **Publicar**: `POST /{ig-user-id}/media_publish` com `creation_id`

### Configuração

```bash
export IG_BUSINESS_ACCOUNT_ID="seu-id"
export INSTAGRAM_ACCESS_TOKEN="seu-token"
```

### Uso

```bash
# Buscar do Firebase, gerar urls.txt automaticamente e publicar (recomendado)
python postar_stories.py --from-firebase

# Com URLs como argumentos
python postar_stories.py --urls "https://firebasestorage.../55.129.jpg?alt=media&token=..." "https://..."

# Com arquivo de URLs (uma por linha)
python postar_stories.py --url-file urls.txt

# Delay customizado entre posts (default: 5 segundos)
python postar_stories.py --url-file urls.txt --delay 10

# Simular sem publicar
python postar_stories.py --url-file urls.txt --dry-run
```

### Como obter as URLs

**Opção A – Firebase automático (recomendado):** Use `--from-firebase` para buscar as imagens do bucket, gerar `urls.txt` e publicar em um comando. Requer `GOOGLE_APPLICATION_CREDENTIALS` no `.env`.

**Opção B – Frontend:** Na galeria do app, clique em **"Exportar URLs"**. Cole em `urls.txt` e use `--url-file urls.txt`.

**Opção C – Script listar_urls_firebase.py:** Para apenas listar sem publicar.

### Dependências

```bash
pip install -r requirements.txt
```

## 3. Listar URLs do Firebase (listar_urls_firebase.py)

Lista as URLs das imagens no Firebase Storage. Requer `firebase-admin` e credenciais de service account.

```bash
pip install firebase-admin
export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
python listar_urls_firebase.py -o urls.txt
```
