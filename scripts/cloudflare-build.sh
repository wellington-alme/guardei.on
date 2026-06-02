#!/usr/bin/env bash
set -euo pipefail

# Script de build para ambientes CI que começam na raiz do repositório.
# Ele instala dependências nos subprojetos e cria o frontend.

cd "$(git rev-parse --show-toplevel)"

echo "Instalando dependências do backend..."
npm --prefix backend install

echo "Instalando dependências do frontend..."
npm --prefix frontend install

echo "Gerando build do frontend..."
npm --prefix frontend run build

echo "Build concluído: frontend/dist"
