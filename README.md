# 🚀 Delivery Pro - Ecossistema de Delivery Digital

Um sistema de delivery digital profissional, **100% front-end**, que se comporta como um aplicativo pago, mas é totalmente controlado por você através de um painel admin. Hospedado gratuitamente no GitHub Pages.

![Delivery Pro](https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=400&fit=crop)

---

## ✨ Funcionalidades Premium

### 🛒Para Clientes
- ✅ Interface mobile-first com UX de app nativo
- ✅ Busca e filtro por categorias
- ✅ Carrinho inteligente com cálculo de subtotal em tempo real
- ✅ Escolha entre entrega ou retirada
- ✅ multiple formas de pagamento (dinheiro, PIX, cartão)
- ✅ Checkout redireciona para WhatsApp com pedido formatado
- ✅ Desain responsivo que funciona em qualquer dispositivo

### 🎛️Painel Admin Profissional
- ✅ **Acesso via URL** (`/admin` ou `#admin`)
- ✅ **PIN de segurança** (padrão: 1234)
- ✅ **Personalização completa de cores** (paleta completa)
- ✅ **Configurações da marca** (nome, slogan, endereço)
- ✅ **WhatsApp** configurável
- ✅ **Taxa de entrega** e **pedido mínimo**
- ✅ **Horários** de funcionamento e tempo estimado
- ✅ **CRUD completo de produtos** (adicionar, editar, excluir)
- ✅ **Controle de disponibilidade** (ativar/desativar produtos)
- ✅ **Histórico de pedidos** com detalhes completos
- ✅ **Persistência de dados** no localStorage

---

## 🎨 Paleta de Cores Administrável

Personalize completamente a aparência da sua loja:

| Elemento | Descrição |
|----------|-----------|
| Cor Primária | Botões, links, destaque |
| Cor de Fundo | Background principal |
| Superfície | Cards, elementos elevados |
| Texto | Cor principal do texto |
| Sucesso | Mensagens positivas (verde) |
| Erro | Alertas e erros (vermelho) |

---

## 📱 Screenshots

### Loja (Mobile)
```
┌─────────────────────┐
│ 🔍 Buscar...        │
├─────────────────────┤
│ [Todos] [Lanches]   │
│ [Bebidas] [Sobrem.] │
├─────────────────────┤
│ ┌─────┐ ┌─────┐     │
│ │ 🍔  │ │ 🍟  │     │
│ │R$24 │ │R$18 │     │
│ │  +  │ │  +  │     │
│ └─────┘ └─────┘     │
├─────────────────────┤
│ 🛒 3 itens → R$67   │
└─────────────────────┘
```

### Checkout
```
┌─────────────────────┐
│ ← Checkout          │
├─────────────────────┤
│ [🚀 Entrega] [🏃]   │
│                     │
│ Nome: __________    │
│ Endereço: ______    │
│                     │
│ Pagamento:          │
│ [💵] [📱] [💳]      │
│                     │
│ Total: R$ 67,00     │
│                     │
│ [Finalizar pedido]  │
└─────────────────────┘
```

---

## 🚀 Como Publicar (Deploy)

### Deploy Automático (GitHub Actions)

1. Crie um repositório no GitHub
2. Faça push do código
3. Vá em **Settings → Pages**
4. Selecione **GitHub Actions** como source
5. Aguarde 1-3 minutos e pronto!

### Deploy Manual

```bash
npm run build
# Faça upload da pasta dist/ para o GitHub Pages
```

**Link do deploy:** `https://seu-usuario.github.io/seu-repo/`

---

## 🔐 Acesso ao Admin

**URL:** `https://seu-link.github.io/repo/#admin`

**PIN Padrão:** `1234`

Altere o PIN no painel em **Segurança → PIN de Acesso Admin**

---

## 💰 Custos

| Item | Custo |
|------|-------|
| Hospedagem | **R$ 0** (GitHub Pages) |
| Domínio | Opcional (pode usar o .github.io) |
| SSL | **Grátis** (incluído no GitHub) |
| Manutenção | **R$ 0** (sem servidor) |

---

## 🛠️ Tecnologias

- **React 19** - Framework UI
- **Vite** - Build tool
- **TypeScript** - Tipagem segura
- **Tailwind CSS** - Estilização
- **localStorage** - Persistência de dados

---

## 📋 Requisitos

- Node.js 18+
- NPM ou Yarn

---

## 🔧 Scripts Disponíveis

```bash
npm run dev      # Desenvolvimento local
npm run build    # Build de produção
npm run preview  # Preview da build
```

---

## 📝 Licença

MIT - Feel free to use and modify!

---

**Desenvolvido com ❤️ para deliveries de todos os tamanhos**

🌐 *100% Front-end | Sem Backend | Sem mensalidade*