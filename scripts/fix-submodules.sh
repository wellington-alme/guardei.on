#!/usr/bin/env bash
set -euo pipefail

RETRY=${RETRY:-3}
GIT_TOKEN=${GIT_TOKEN:-}

echo "fix-submodules: iniciando (RETRY=$RETRY)"
ROOT=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [ -z "$ROOT" ]; then
  echo "Não parece ser um repositório git. Saindo." >&2
  exit 2
fi
cd "$ROOT"
echo "Repo root: $ROOT"

git submodule sync --recursive || true

if [ -n "$GIT_TOKEN" ]; then
  if [ -f .gitmodules ]; then
    while read -r key val; do
      if [[ $val =~ ^git@github.com: ]]; then
        new=${val/git@github.com:/https://}
        new=${new/https:*/https://$GIT_TOKEN@${new#https://}}
        echo "Convertendo $key: $val -> $new"
        git config -f .gitmodules "$key" "$new"
        name=$(echo $key | sed -E "s/submodule\.([^.]+)\.url/\1/")
        git config "submodule.$name.url" "$new"
      fi
    done < <(git config -f .gitmodules --get-regexp 'submodule\..*\.url' || true)
    git submodule sync --recursive || true
  fi
fi

for i in $(seq 1 $RETRY); do
  echo "Tentativa $i de $RETRY: atualizando submódulos..."
  if git submodule update --init --recursive --force --progress; then
    echo "Submódulos atualizados com sucesso."
    exit 0
  fi
  echo "Falha na tentativa $i. Limpando e buscando..."
  git submodule foreach --recursive 'git reset --hard || true; git clean -ffd || true' || true
  git submodule foreach --recursive 'git fetch --all --tags || true' || true
  sleep 2
done

echo "Falha ao atualizar submódulos após $RETRY tentativas." >&2
exit 1
