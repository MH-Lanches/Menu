# Deploy Manual - Delivery Pro

## 🚀 Método mais simples (sem GitHub Actions)

### Passos:

1. **Gere a build**
   ```bash
   npm run build
   ```

2. **Acesse seu repositório no GitHub**
   - Vá em: https://github.com/SEU-USUARIO/SEU-REPO

3. **Vá para a branch gh-pages**
   - Clique em: **main** (botão de branch)
   - Digite: `gh-pages` e selecione "Create branch: gh-pages"

4. **Faça upload dos arquivos**
   - Vá na pasta `dist/` do seu projeto
   - Arraste TODOS os arquivos para o GitHub
   - Commit com mensagem: "Deploy"

5. **Configure o Pages**
   - Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `gh-pages` → pasta: `/ (root)`
   - Save

6. **Aguarde 1-2 minutos** e acessa o link!

---

## 📝 Método alternativo (se o acima não funcionar)

1. **Baixe o arquivo `dist/index.html`**
2. **Crie um repositório novo no GitHub**
3. **Vá em Settings → Pages**
4. **Selecione "Deploy from a branch"**
5. **Branch: main, pasta: /(root)**
6. **Faça upload do index.html na branch main**

---

## ✅ Problemas comuns

| Problema | Solução |
|----------|---------|
| Página branca | Verifique a aba Console do navegador (F12) |
| Imagens não carregam | Verifique se as URLs das imagens estão HTTPS |
| WhatsApp não abre | Confirme o número está com DDD sem espaços |
| Admin não abre | Acesse com `/admin` ou `#admin` no final da URL |

---

## 🔧 PIN Admin
**1234**

---

Divirta-se com seu delivery digital! 🚀