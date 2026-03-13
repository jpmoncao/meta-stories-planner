#!/usr/bin/env python3
"""
Lista as URLs públicas das imagens no Firebase Storage (pasta images/).

Requer:
  - firebase-admin: pip install firebase-admin
  - Arquivo de credenciais (service account) em GOOGLE_APPLICATION_CREDENTIALS
  - Ou variável FIREBASE_SERVICE_ACCOUNT_PATH apontando para o JSON

Uso:
  python listar_urls_firebase.py              # imprime URLs no stdout
  python listar_urls_firebase.py -o urls.txt  # salva em arquivo
"""

import argparse
import os
import sys

try:
    import firebase_admin
    from firebase_admin import credentials, storage
except ImportError:
    print("Erro: instale firebase-admin com: pip install firebase-admin")
    sys.exit(1)


def listar_urls(bucket_name: str, prefix: str = "images/") -> list[str]:
    """Lista URLs de download dos arquivos no bucket."""
    bucket = storage.bucket(bucket_name)
    blobs = bucket.list_blobs(prefix=prefix)

    urls = []
    for blob in blobs:
        if blob.name.endswith("/"):
            continue
        # Gera URL com token (válida por 1 hora por padrão)
        url = blob.generate_signed_url(
            version="v4",
            expiration=3600,  # 1 hora
            method="GET",
        )
        urls.append(url)
    return urls


def main():
    parser = argparse.ArgumentParser(
        description="Lista URLs das imagens no Firebase Storage"
    )
    parser.add_argument(
        "-o",
        "--output",
        metavar="FILE",
        help="Salvar URLs em arquivo (uma por linha)",
    )
    parser.add_argument(
        "--bucket",
        default="meta-stories-planner-storage.firebasestorage.app",
        help="Nome do bucket do Firebase Storage",
    )
    args = parser.parse_args()

    # Inicializar Firebase Admin
    cred_path = os.environ.get(
        "GOOGLE_APPLICATION_CREDENTIALS",
        os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH"),
    )
    if not cred_path or not os.path.isfile(cred_path):
        print(
            "Erro: defina GOOGLE_APPLICATION_CREDENTIALS ou "
            "FIREBASE_SERVICE_ACCOUNT_PATH com o caminho do JSON da service account"
        )
        print("Obtenha em: Firebase Console > Configurações > Contas de serviço")
        sys.exit(1)

    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, {"storageBucket": args.bucket})

    urls = listar_urls(args.bucket)
    if not urls:
        print("Nenhuma imagem encontrada em images/")
        sys.exit(0)

    text = "\n".join(urls)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"{len(urls)} URL(s) salvas em {args.output}")
    else:
        print(text)


if __name__ == "__main__":
    main()
