# 🚀 Guia de Deploy — Delivery Digital no GitHub Pages

## Você tem 2 opções para publicar:

---

## ✅ OPÇÃO 1: Deploy Automático (Recomendado)

O GitHub Actions faz o build e deploy sozinho.

### Passo a passo:

1. **Crie um repositório no GitHub** (ex: `meu-delivery`)

2. **Suba o código fonte:**
```bash
git init
git add .
git commit -m "Delivery digital"
git remote add origin https://github.com/SEU-USUARIO/meu-delivery.git
git push -u origin main
```

3. **Ative o GitHub Pages com Actions:**
   - Vá no repositório → **Settings** → **Pages**
   - Em **Source**, selecione: **GitHub Actions**
   - Pronto! O deploy acontece automaticamente a cada push.

4. **Acesse seu site:**
   ```
   https://SEU-USUARIO.github.io/meu-delivery/
   ```

---

## ✅ OPÇÃO 2: Deploy Manual (Simples)

Se a Opção 1 não funcionar, suba o `dist/` manualmente.

### Passo a passo:

1. **Faça o build localmente:**
```bash
npm install
npm run build
```

2. **Suba a pasta dist para o GitHub:**
```bash
git init
git add .
git commit -m "Delivery digital"
git remote add origin https://github.com/SEU-USUARIO/meu-delivery.git
git push -u origin main
```

3. **Configure o GitHub Pages:**
   - Vá no repositório → **Settings** → **Pages**
   - Em **Source**, selecione: **Deploy from a branch**
   - Branch: **main** | Pasta: **/dist**
   - Clique em **Save**

4. **Acesse seu site:**
   ```
   https://SEU-USUARIO.github.io/meu-delivery/
   ```

---

## 🔧 Configuração para repositório na raiz (sem subpasta)

Se o seu site vai ficar em `https://SEU-USUARIO.github.io/` (sem nome de repo), 
deixe o `vite.config.ts` com `base: "/"` (padrão).

---

## 🔑 PIN Admin padrão: 1234

Após o primeiro acesso, altere no painel admin.

---

## ❓ Página branca? Verifique:

1. **Console do navegador** (F12 → Console) — procure erros em vermelho
2. **Settings → Pages** — confirme que está configurado
3. **Aguarde 2-3 minutos** após o push para o deploy completar
4. **Limpe o cache** do navegador (Ctrl+Shift+R)
