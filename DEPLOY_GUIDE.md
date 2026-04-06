# 🚀 Deploy - Delivery Pro no GitHub Pages

## Opção 1: Deploy Automático com GitHub Actions (Recomendado)

### Passos:

1. **Crie o repositório no GitHub**
   - Vá em: https://github.com/new
   - Nome: `delivery-pro` (ou outro nome)
   - Marque como "Público"
   - Não初始化 com README

2. **Configure o remote e faça push**
   ```bash
   cd seu-projeto
   git init
   git add .
   git commit -m "Entrega inicial do delivery"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/delivery-pro.git
   git push -u origin main
   ```

3. **Configure o GitHub Pages**
   - Vá em: **Settings** → **Pages** (na barra lateral)
   - Em "Build and deployment":
     - **Source**: Selecione "GitHub Actions"
   - Não precisa criar workflow manualmente - o código já inclui!

4. **Aguarde 1-3 minutos**
   - Vá na aba "Actions" do seu repositório
   - Veja o deploy em progresso
   - Quando verde ✅, seu site está no ar!

5. **Acesse seu delivery**
   - O link será algo como: `https://SEU-USUARIO.github.io/delivery-pro/`

---

## Opção 2: Deploy Manual (Sem GitHub Actions)

### Passos:

1. **Gere a build localmente**
   ```bash
   npm run build
   ```

2. ** Faça push apenas da pasta `dist/`**
   - Crie uma branch chamada `gh-pages`
   - Faça upload do conteúdo de `dist/` na raiz dessa branch

3. **Configure no GitHub**
   - Settings → Pages → Source: "Deploy from a branch"
   - Branch: `gh-pages` → pasta: `/ (root)`
   - Salve e aguarde 1-2 minutos

---

## 🔧 Funcionalidades do Painel Admin

### Acesse pelo link:
- `https://seu-link.github.io/repo/#admin`
- Ou simplesmente adicione `/admin` no final da URL

### PIN de Acesso:
- **Padrão:** `1234`
- Altere no painel em "Segurança"

---

## 📱 Customizações Disponíveis no Admin

### 🏪 Dados da Marca
- Nome da loja
- Slogan
- Endereço

### 📱 WhatsApp
- Número com DDD (apenas números)

### 🚚 Entrega
- Taxa de entrega (R$)
- Pedido mínimo (R$)
- Tempo de entrega
- Tempo de retirada

### ⏰ Horário
- Horário de funcionamento

### 🔐 Segurança
- PIN de acesso admin (4 dígitos)

### 🎨 Paleta de Cores
- Cor primária (botões, destaque)
- Cor de fundo
- Cor da superfície (cards)
- Cor do texto
- Cor de sucesso (verde)
- Cor de erro (vermelho)
- Botão para resetar cores padrão

---

## 📦 Estrutura do Projeto

```
delivery-pro/
├── dist/
│   └── index.html (único arquivo com tudo)
├── src/
│   ├── App.tsx (código completo)
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

---

## ✅ Checklist de Funcionamento

- [ ] Build gera 1 arquivo HTML único
- [ ] Carrega sem erros no navegador
- [ ] Carrinho funciona (add, remover, atualizar)
- [ ] Cálculo de subtotal correto
- [ ] Checkout redireciona para WhatsApp
- [ ] Painel admin abre via URL `/admin`
- [ ] Personalização de cores funciona
- [ ] Produtos podem ser adicionados/editados
- [ ] Pedidos são salvos no histórico
- [ ] Dados persistem no localStorage

---

## 📞 Suporte

Se tiver problemas:
1. Verifique a aba "Actions" do GitHub
2. Abra o console do navegador (F12)
3. Tire um print do erro e mande mensagem

---

**Delivery Pro** - Sua delivery digital profissional 🚀