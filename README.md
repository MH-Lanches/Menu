# 🍔 ChefExpress Delivery

Um ecossistema de delivery digital profissional, de baixo custo e totalmente controlável por você. Hospedado gratuitamente no GitHub Pages, comporta-se como um aplicativo pago mas é 100% front-end.

## ✨ Recursos

### Para o Cliente
- 📱 **Mobile-first**: Design otimizado para celulares
- 🔍 **Busca e filtros**: Encontre produtos rapidamente por categoria
- 🛒 **Carrinho inteligente**: Cálculo automático de subtotal e total
- 🚚 **Entrega ou retirada**: Opção com taxa diferenciada
- 📲 **Pedido via WhatsApp**: Finalização direta no seu WhatsApp
- 💳 **Múltiplos pagamentos**: Pix, cartão e dinheiro

### Para o Dono (Admin)
- 🔐 **Painel protegido por PIN**: Controle total com segurança
- 📋 **Gerenciar produtos**: Adicionar, editar e remover itens do cardápio
- ⚙️ **Configurações completas**: Marca, slogan, WhatsApp, taxas, etc.
- 📊 **Histórico de pedidos**: Acompanhe os últimos 30 pedidos
- 💾 **Persistência local**: Tudo salvo no navegador do cliente

## 🚀 Começando

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no GitHub (para hospedagem gratuita)

### Instalação Local
```bash
# Clone o repositório
git clone https://github.com/SEU-USUARIO/chefexpress-delivery.git
cd chefexpress-delivery

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### Build para Produção
```bash
npm run build
```

### Deploy no GitHub Pages
1. Crie um repositório no GitHub
2. Faça push deste código
3. O workflow `.github/workflows/deploy.yml` vai deployar automaticamente
4. Acesse em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`

## 📖 Como Usar

### Primeiro Acesso (Admin)
1. Clique em **"Admin"** no canto superior direito
2. Digite o PIN padrão: **1234**
3. Configure sua loja:
   - Nome da marca
   - Seu WhatsApp (formato: 55+DDD+NUMERO)
   - Taxa de entrega
   - Valor mínimo do pedido
   - Altere o PIN de segurança

### Gerenciar Produtos
1. No painel Admin, preencha o formulário:
   - Nome do produto
   - Descrição
   - Categoria (ex: Burgers, Pizzas, Bebidas)
   - Preço
   - URL da imagem (sugestão: Unsplash)
2. Clique em **"Adicionar Produto"**
3. Para editar, clique no ícone ✏️
4. Para excluir, clique no ícone 🗑️

### Receber Pedidos
1. Clientes navegam e adicionam itens
2. No checkout, preenchem nome, endereço e pagamento
3. Ao clicar em **"Enviar Pedido no WhatsApp"**, abre uma conversa com o resumo completo
4. Você confirma o pedido diretamente no WhatsApp

## 🎨 Personalização

### Alterar Cores
Edite `src/App.tsx` e substitua as classes Tailwind:
- Principal: `emerald-500` → `blue-500`, `orange-500`, etc.
- Fundos: `zinc-900`, `zinc-950`

### Alterar Produtos Iniciais
Edite o array `defaultProducts` em `src/App.tsx`.

### Alterar PIN Padrão
No `src/App.tsx`, mude `accessPin: "1234"` no objeto `defaultSettings`.

## 🛠️ Tecnologias

- **React 18** - UI Library
- **Vite** - Build tool super rápida
- **Tailwind CSS 3** - Estilização utilitária
- **Framer Motion** - Animações suaves
- **TypeScript** - Tipagem estática
- **GitHub Pages** - Hospedagem gratuita

## 📱 Recursos Mobile

- Layout responsivo adaptável
- Botões com área de toque otimizada
- Bottom sheets para carrinho e checkout
- Barra flutuante do carrinho
- Navegação por categorias horizontal
- Scroll suave e animações

## 🔒 Segurança

- PIN de acesso ao admin (configurável)
- Dados salvos apenas no localStorage do cliente
- Nenhum backend necessário
- Pedido enviado via WhatsApp (canal seguro)

## 💡 Dicas de Uso

1. **Imagens**: Use imagens apetitosas de alta qualidade
2. **Descrições**: Seja detalhista nos ingredientes
3. **Categorias**: Organize bem para facilitar a navegação
4. **WhatsApp**: Use um número exclusivo para pedidos
5. **Teste**: Faça pedidos de teste antes de lançar

## 📄 Licença

Projeto open-source. Sinta-se livre para usar e modificar.

## 🤝 Contribuições

Sugestões e melhorias são bem-vindas! Abra uma issue ou PR.

---

**Desenvolvido com ❤️ para simplificar seu delivery digital**
