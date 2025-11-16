#!/bin/bash

# Script de Deploy Automático para GitHub Pages
# Use este script para automatizar o deployment do Sudoku Game
# 
# Recurso: Sincroniza automaticamente o código para GitHub e ativa Pages
#
# Uso:
#   chmod +x deploy.sh
#   ./deploy.sh

# Configurações
REPO_URL="https://github.com/SEU-USUARIO/Sudoku.git"  # Atualize com seu repositório
BRANCH="main"
COMMIT_MESSAGE="Update Sudoku game - $(date '+%Y-%m-%d %H:%M:%S')"

echo "🚀 Iniciando deploy automático para GitHub Pages..."

# Verificar se está em um repositório git
if [ ! -d ".git" ]; then
    echo "❌ Erro: Não está em um repositório Git!"
    echo "Para inicializar um novo repositório, execute:"
    echo "  git init"
    echo "  git add ."
    echo "  git commit -m 'Initial commit: Sudoku Game'"
    echo "  git branch -M main"
    echo "  git remote add origin $REPO_URL"
    echo ""
    echo "Depois execute este script novamente:"
    echo "  chmod +x deploy.sh"
    echo "  ./deploy.sh"
    exit 1
fi

# Verificar se há mudanças
if git diff-index --quiet HEAD --; then
    echo "✅ Sem mudanças para fazer commit"
    echo "⬆️  Enviando de qualquer forma..."
else
    echo "📝 Detectadas mudanças no repositório"
fi

# Adicionar todos os arquivos
echo "📝 Adicionando arquivos..."
git add .

# Fazer commit
echo "💾 Fazendo commit..."
git commit -m "$COMMIT_MESSAGE" || echo "ℹ️  Nada novo para fazer commit"

# Fazer push para GitHub
echo "⬆️  Enviando para GitHub..."
git push origin $BRANCH

if [ $? -eq 0 ]; then
    echo "✅ Deploy concluído com sucesso!"
    echo "🌐 Seu jogo estará disponível em:"
    echo "   https://seu-usuario.github.io/Sudoku"
    echo "   (Pode levar 1-2 minutos para atualizar)"
    echo ""
    echo "💡 Dica: Se for a primeira vez, vá para:"
    echo "   Settings > Pages > Source > Deploy from a branch (main)"
else
    echo "❌ Erro ao fazer push!"
    echo "Verifique sua conexão com GitHub e tente novamente."
    exit 1
fi
