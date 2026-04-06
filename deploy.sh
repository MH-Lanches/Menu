#!/bin/bash
# ============================================
# 🚀 Script de Deploy - Delivery Digital
# ============================================
# Este script faz o build e prepara os arquivos
# para deploy no GitHub Pages.
#
# USO: bash deploy.sh
# ============================================

echo "📦 Instalando dependências..."
npm install

echo ""
echo "🔨 Fazendo build do projeto..."
npm run build

echo ""
echo "✅ Build concluído!"
echo ""
echo "📁 Arquivo gerado: dist/index.html"
echo ""
echo "🔧 Para publicar no GitHub Pages:"
echo ""
echo "   OPÇÃO 1 - Workflow automático (recomendado):"
echo "   1. Faça push deste repositório para o GitHub"
echo "   2. Vá em Settings > Pages"
echo "   3. Em 'Source', selecione 'GitHub Actions'"
echo "   4. O deploy acontece automaticamente!"
echo ""
echo "   OPÇÃO 2 - Deploy manual:"
echo "   1. Faça push do código fonte para a branch 'main'"
echo "   2. O GitHub Actions fará o build e deploy"
echo ""
echo "   OPÇÃO 3 - Subir o dist/ manualmente:"
echo "   1. git add dist/"
echo "   2. git commit -m 'deploy'"
echo "   3. git push"
echo "   4. Vá em Settings > Pages > Source: Deploy from branch > pasta /dist"
echo ""
echo "🔑 PIN Admin padrão: 1234"
echo ""
