export interface Product {
  id: string | number;
  nome: string;
  preco: number;
  descricao: string;
  categoria: string;
  imagem: string;
  galeria?: string[];
  tipo?: 'simples' | 'pizza' | 'pastel' | 'especial';
  pausado?: boolean;
  destaque?: boolean;
  promocao?: boolean;
  precoOriginal?: number;
  desconto?: number;
  opcionais?: Addon[];
  adicionais?: Addon[];
  sabores?: { nome: string }[];
  gratisLimit?: number;
  tempoPreparo?: number;
}

export interface Addon {
  nome: string;
  preco: number;
  pausado?: boolean;
}

export interface Category {
  id: string;
  nome: string;
  icone?: string;
}

export interface Order {
  id: string;
  tipo: 'delivery' | 'mesa' | 'balcao';
  cliente: {
    nome: string;
    telefone: string;
    endereco?: string;
    complemento?: string;
  };
  mesa?: string;
  itens: OrderItem[];
  pagamento: string;
  troco?: string;
  subtotal: number;
  desconto: number;
  taxa: number;
  total: number;
  status: 'novo' | 'producao' | 'pronto' | 'saiu-entrega' | 'entregue' | 'pago' | 'finalizado';
  data: string;
  agendado?: {
    date: string;
    time: string;
  } | null;
}

export interface OrderItem {
  id: string;
  produtoId: string | number;
  nome: string;
  preco: number;
  qtd: number;
  observacao?: string;
  adicionais?: Addon[];
}

export interface SiteConfig {
  logoUrl: string;
  favicon: string;
  corPrimaria: string;
  corSecundaria: string;
  tituloPrincipal: string;
  slogan: string;
  sobreTitulo: string;
  sobreTexto1: string;
  sobreTexto2: string;
  sobreImagem: string;
  rodapeEsquerda: string;
  rodapeDireita: string;
  copyright: string;
  mensagemBoasVindas: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  twitter: string;
  youtube: string;
  tiktok: string;
  website: string;
  lojaNome: string;
  lojaTelefone: string;
  lojaEndereco: string;
  lojaCidade: string;
  taxaEntrega: number;
  valorMinimo: number;
  tempoEntrega: number;
  raioEntrega: number;
  horarios: BusinessHour[];
  fechamentoAtivo: boolean;
  fechamentoInicio: string;
  fechamentoFim: string;
  fechamentoMotivo: string;
  fechamentoMensagem: string;
  anuncios: Announcement[];
}

export interface BusinessHour {
  dia: string;
  aberto: boolean;
  abertura: string;
  fechamento: string;
}

export interface Announcement {
  id: number | string;
  titulo: string;
  texto: string;
  link: string;
  ativo: boolean;
}

export interface Coupon {
  id: string;
  codigo: string;
  tipo: 'percentual' | 'fixo' | 'frete';
  valor: number;
  quantidadeTotal: number;
  minimoCompra: number;
  validade: string;
  usos: number;
  ativo: boolean;
}
