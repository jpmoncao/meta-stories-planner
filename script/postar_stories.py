#!/usr/bin/env python3
"""
Script para publicar imagens como Stories no Instagram via Graph API.

Fluxo:
1. Para cada imagem: cria container (POST /media) com image_url e media_type=STORIES
2. Publica o container (POST /media_publish) com creation_id
3. Aguarda delay entre publicações para evitar rate limit

Uso:
  python postar_stories.py --urls "url1" "url2" "url3"
  python postar_stories.py --url-file urls.txt
  python postar_stories.py --url-file urls.txt --dry-run
"""

import argparse
import os
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    print("Erro: instale requests com: pip install requests")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
except ImportError:
    pass  # python-dotenv opcional

SCRIPT_DIR = Path(__file__).parent

# Configuração da API
API_VERSION = "v25.0"
BASE_URL = f"https://graph.facebook.com/{API_VERSION}"


def criar_container(ig_account_id: str, image_url: str, access_token: str) -> str | None:
    """Cria o container de mídia para o story. Retorna o creation_id ou None."""
    url = f"{BASE_URL}/{ig_account_id}/media"
    payload = {
        "image_url": image_url,
        "media_type": "STORIES",
        "access_token": access_token,
    }
    resp = requests.post(url, json=payload, timeout=30)
    data = resp.json()

    if "id" in data:
        return data["id"]

    error = data.get("error", {})
    print(f"  ❌ Erro ao criar container: {error.get('message', data)}")
    return None


def aguardar_container_pronto(container_id: str, access_token: str, max_tentativas: int = 30) -> bool:
    """Aguarda o container ficar FINISHED. Retorna True se pronto, False se erro/expirou."""
    for _ in range(max_tentativas):
        url = f"{BASE_URL}/{container_id}"
        resp = requests.get(url, params={"fields": "status_code", "access_token": access_token}, timeout=30)
        data = resp.json()
        status = data.get("status_code", "")
        if status == "FINISHED":
            return True
        if status in ("ERROR", "EXPIRED"):
            print(f"  ❌ Container {status}: {data.get('status', data)}")
            return False
        time.sleep(2)
    print("  ❌ Timeout aguardando container processar")
    return False


def publicar_story(ig_account_id: str, creation_id: str, access_token: str) -> bool:
    """Publica o container como story. Retorna True se sucesso."""
    url = f"{BASE_URL}/{ig_account_id}/media_publish"
    payload = {
        "creation_id": creation_id,
        "access_token": access_token,
    }
    resp = requests.post(url, json=payload, timeout=30)
    data = resp.json()

    if "id" in data:
        return True

    error = data.get("error", {})
    print(f"  ❌ Erro ao publicar: {error.get('message', data)}")
    return False


def buscar_urls_firebase(
    bucket_name: str,
    prefix: str = "images/",
    cred_path: str | None = None,
) -> list[str]:
    """Busca URLs das imagens no Firebase Storage. Requer firebase-admin."""
    try:
        import firebase_admin
        from firebase_admin import credentials, storage
    except ImportError:
        print("Erro: instale firebase-admin com: pip install firebase-admin")
        sys.exit(1)

    # Resolver path relativo a partir do diretório do script
    if cred_path and not os.path.isabs(cred_path):
        cred_path = str(SCRIPT_DIR / cred_path)

    if not cred_path or not os.path.isfile(cred_path):
        print(
            "Erro: defina GOOGLE_APPLICATION_CREDENTIALS ou "
            "FIREBASE_SERVICE_ACCOUNT_PATH no .env com o caminho do JSON da service account"
        )
        print("Obtenha em: Firebase Console > Configurações > Contas de serviço")
        sys.exit(1)

    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, {"storageBucket": bucket_name})

    bucket = storage.bucket(bucket_name)
    blobs = bucket.list_blobs(prefix=prefix)
    urls = []
    for blob in blobs:
        if blob.name.endswith("/"):
            continue
        url = blob.generate_signed_url(
            version="v4",
            expiration=7200,  # 2 horas (tempo para publicar)
            method="GET",
        )
        urls.append(url)
    return urls


def postar_story(
    ig_account_id: str,
    image_url: str,
    access_token: str,
    dry_run: bool = False,
) -> bool:
    """Prepara e publica um story. Retorna True se sucesso."""
    if dry_run:
        print(f"  [DRY-RUN] Criaria container para: {image_url[:60]}...")
        print(f"  [DRY-RUN] Publicaria o story")
        return True

    creation_id = criar_container(ig_account_id, image_url, access_token)
    if not creation_id:
        return False

    if not aguardar_container_pronto(creation_id, access_token):
        return False

    return publicar_story(ig_account_id, creation_id, access_token)


def main():
    parser = argparse.ArgumentParser(
        description="Publica imagens como Stories no Instagram",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  python postar_stories.py --from-firebase          # Busca do Firebase, gera urls.txt e publica
  python postar_stories.py --urls "https://..." "https://..."
  python postar_stories.py --url-file urls.txt
  python postar_stories.py --url-file urls.txt --delay 10 --dry-run

Variáveis de ambiente:
  IG_BUSINESS_ACCOUNT_ID       - ID da conta de negócios do Instagram
  INSTAGRAM_ACCESS_TOKEN      - Token de acesso da API do Instagram
  GOOGLE_APPLICATION_CREDENTIALS - Caminho do JSON da service account (para --from-firebase)
  FIREBASE_STORAGE_BUCKET     - Bucket do Firebase (default: meta-stories-planner-storage...)
        """,
    )
    parser.add_argument(
        "--urls",
        nargs="+",
        help="URLs das imagens (uma ou mais)",
    )
    parser.add_argument(
        "--url-file",
        metavar="FILE",
        help="Arquivo com uma URL por linha",
    )
    parser.add_argument(
        "--from-firebase",
        action="store_true",
        help="Buscar imagens do Firebase Storage e gerar urls.txt automaticamente",
    )
    parser.add_argument(
        "--firebase-prefix",
        default="images/",
        help="Prefixo/pasta no bucket (default: images/)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=5.0,
        metavar="SECONDS",
        help="Segundos de espera entre cada publicação (default: 5)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simular sem publicar de verdade",
    )
    args = parser.parse_args()

    # Coletar URLs
    urls: list[str] = []
    if args.urls:
        urls = [u.strip() for u in args.urls if u.strip()]
    elif args.url_file:
        path = args.url_file
        if not os.path.isfile(path):
            print(f"Erro: arquivo não encontrado: {path}")
            sys.exit(1)
        with open(path, encoding="utf-8") as f:
            urls = [line.strip() for line in f if line.strip()]
    elif args.from_firebase:
        bucket = os.environ.get(
            "FIREBASE_STORAGE_BUCKET",
            "meta-stories-planner-storage.firebasestorage.app",
        )
        cred_path = os.environ.get(
            "GOOGLE_APPLICATION_CREDENTIALS",
            os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH"),
        )
        print(f"Buscando imagens no Firebase ({bucket}/{args.firebase_prefix})...")
        urls = buscar_urls_firebase(bucket, args.firebase_prefix, cred_path)
        if not urls:
            print("Nenhuma imagem encontrada no bucket.")
            sys.exit(1)
        # Salvar em urls.txt
        urls_path = SCRIPT_DIR / "urls.txt"
        urls_path.write_text("\n".join(urls), encoding="utf-8")
        print(f"{len(urls)} URL(s) salvas em {urls_path}")
        print()
    else:
        parser.print_help()
        print("\nErro: informe --urls, --url-file ou --from-firebase")
        sys.exit(1)

    if not urls:
        print("Nenhuma URL fornecida.")
        sys.exit(1)

    # Credenciais
    ig_account_id = os.environ.get("IG_BUSINESS_ACCOUNT_ID")
    access_token = os.environ.get("INSTAGRAM_ACCESS_TOKEN")

    if not ig_account_id or not access_token:
        print("Erro: defina as variáveis de ambiente:")
        print("  export IG_BUSINESS_ACCOUNT_ID='seu-id'")
        print("  export INSTAGRAM_ACCESS_TOKEN='seu-token'")
        sys.exit(1)

    # Publicar
    total = len(urls)
    ok = 0
    fail = 0

    print(f"Publicando {total} story(s) no Instagram...")
    if args.dry_run:
        print("(modo dry-run - nenhuma publicação real)")
    print()

    for i, url in enumerate(urls, 1):
        print(f"[{i}/{total}] {url[:70]}{'...' if len(url) > 70 else ''}")
        success = postar_story(
            ig_account_id, url, access_token, dry_run=args.dry_run
        )
        if success:
            ok += 1
            if not args.dry_run:
                print(f"  ✅ Publicado")
        else:
            fail += 1

        # Delay entre publicações (exceto na última)
        if i < total and not args.dry_run:
            time.sleep(args.delay)

    print()
    print(f"Concluído: {ok} publicados, {fail} falhas")
    sys.exit(1 if fail else 0)


if __name__ == "__main__":
    main()
