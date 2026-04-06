import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cn } from "./utils/cn";

type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type AddOnOption = {
  id: string;
  name: string;
  price: number;
};

type AddOnGroup = {
  id: string;
  title: string;
  maxSelection: number;
  options: AddOnOption[];
};

type Category = {
  id: string;
  name: string;
  description: string;
  active: boolean;
};

type Product = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  active: boolean;
  featured: boolean;
  allowHalfAndHalf: boolean;
  groups: AddOnGroup[];
};

type ScheduleDay = {
  enabled: boolean;
  open: string;
  close: string;
};

type ThemeSettings = {
  storeName: string;
  slogan: string;
  footerText: string;
  logoEmoji: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  surfaceColor: string;
  whatsapp: string;
  deliveryFee: number;
  minOrder: number;
};

type StoreData = {
  version: number;
  updatedAt: string;
  theme: ThemeSettings;
  categories: Category[];
  products: Product[];
  schedule: Record<DayKey, ScheduleDay>;
};

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  notes: string;
  selectedAddOns: Record<string, string[]>;
  halfHalfProductId?: string;
};

type CheckoutForm = {
  customerName: string;
  phone: string;
  address: string;
  neighborhood: string;
  paymentMethod: string;
  changeFor: string;
  orderNotes: string;
  scheduleTime: string;
};

type StoreStatus = {
  isOpen: boolean;
  reason: string;
  nextOpenText: string;
};

type CustomizerState = {
  productId: string;
  quantity: number;
  notes: string;
  halfHalfProductId: string;
  selectedAddOns: Record<string, string[]>;
};

const STORAGE_KEY = "autonomo-delivery-brain-v1";
const FAVORITES_KEY = "autonomo-delivery-favorites-v1";
const CART_KEY = "autonomo-delivery-cart-v1";

const DAY_ORDER: DayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const DAY_LABELS: Record<DayKey, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

const DEFAULT_DATA: StoreData = {
  version: 1,
  updatedAt: "2026-01-01T00:00:00.000Z",
  theme: {
    storeName: "Autônomo Delivery",
    slogan: "Ecossistema enxuto, visual iFood e operação 100% GitHub-friendly.",
    footerText: "© 2026 Autônomo Delivery • Catálogo, operação e pedidos via WhatsApp.",
    logoEmoji: "🛵",
    primaryColor: "#ef4444",
    secondaryColor: "#f97316",
    accentColor: "#14b8a6",
    surfaceColor: "#fff7ed",
    whatsapp: "5511999999999",
    deliveryFee: 7,
    minOrder: 25,
  },
  categories: [
    {
      id: "cat_burgers",
      name: "Lanches",
      description: "Os mais vendidos da noite.",
      active: true,
    },
    {
      id: "cat_pizzas",
      name: "Pizzas",
      description: "Sabores que aceitam meio a meio.",
      active: true,
    },
    {
      id: "cat_drinks",
      name: "Bebidas",
      description: "Geladas para acompanhar.",
      active: true,
    },
    {
      id: "cat_desserts",
      name: "Sobremesas",
      description: "Fechamento com alta conversão.",
      active: true,
    },
  ],
  products: [
    {
      id: "prod_smash",
      categoryId: "cat_burgers",
      name: "Smash Supreme",
      description: "Pão brioche, 2 carnes smash, cheddar cremoso, cebola caramelizada e maionese da casa.",
      price: 29.9,
      image:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
      active: true,
      featured: true,
      allowHalfAndHalf: false,
      groups: [
        {
          id: "smash_group_1",
          title: "Extras do lanche",
          maxSelection: 3,
          options: [
            { id: "opt_bacon", name: "Bacon crocante", price: 6 },
            { id: "opt_cheddar", name: "Cheddar extra", price: 4 },
            { id: "opt_onion", name: "Cebola crispy", price: 3 },
            { id: "opt_salad", name: "Salada especial", price: 2.5 },
          ],
        },
        {
          id: "smash_group_2",
          title: "Molhos",
          maxSelection: 2,
          options: [
            { id: "opt_mayo", name: "Maionese verde", price: 0 },
            { id: "opt_bbq", name: "Barbecue defumado", price: 1.5 },
            { id: "opt_spicy", name: "Molho picante", price: 1.5 },
          ],
        },
      ],
    },
    {
      id: "prod_chicken",
      categoryId: "cat_burgers",
      name: "Chicken Crunch",
      description: "Frango crocante, alface, tomate, molho ranch e pão brioche tostado.",
      price: 27.5,
      image:
        "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=1200&q=80",
      active: true,
      featured: false,
      allowHalfAndHalf: false,
      groups: [
        {
          id: "chicken_group_1",
          title: "Turbine seu combo",
          maxSelection: 4,
          options: [
            { id: "opt_fries", name: "Batata extra", price: 8 },
            { id: "opt_bacon_ck", name: "Bacon", price: 5 },
            { id: "opt_cheese_ck", name: "Queijo extra", price: 4 },
          ],
        },
        {
          id: "chicken_group_2",
          title: "Escolha até 1 molho",
          maxSelection: 1,
          options: [
            { id: "opt_ranch", name: "Ranch", price: 0 },
            { id: "opt_honey", name: "Mostarda e mel", price: 0 },
            { id: "opt_garlic", name: "Alho cremoso", price: 0 },
          ],
        },
      ],
    },
    {
      id: "prod_pizza_calabresa",
      categoryId: "cat_pizzas",
      name: "Pizza Calabresa Prime",
      description: "Molho artesanal, mussarela premium, calabresa fatiada e cebola roxa.",
      price: 62,
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
      active: true,
      featured: true,
      allowHalfAndHalf: true,
      groups: [
        {
          id: "pizza_cala_group_1",
          title: "Borda recheada",
          maxSelection: 1,
          options: [
            { id: "opt_borda_cat", name: "Catupiry", price: 10 },
            { id: "opt_borda_cheddar", name: "Cheddar", price: 10 },
            { id: "opt_sem_borda", name: "Sem borda recheada", price: 0 },
          ],
        },
        {
          id: "pizza_cala_group_2",
          title: "Premiums",
          maxSelection: 2,
          options: [
            { id: "opt_azeitona", name: "Azeitona extra", price: 4 },
            { id: "opt_burrata", name: "Burrata cremosa", price: 12 },
            { id: "opt_parmesao", name: "Parmesão nobre", price: 5 },
          ],
        },
      ],
    },
    {
      id: "prod_pizza_frango",
      categoryId: "cat_pizzas",
      name: "Pizza Frango Supreme",
      description: "Frango desfiado temperado, catupiry, milho verde e toque de orégano.",
      price: 66,
      image:
        "https://images.unsplash.com/photo-1548365328-9f547fb0953b?auto=format&fit=crop&w=1200&q=80",
      active: true,
      featured: false,
      allowHalfAndHalf: true,
      groups: [
        {
          id: "pizza_frango_group_1",
          title: "Borda recheada",
          maxSelection: 1,
          options: [
            { id: "opt_borda_cat_fg", name: "Catupiry", price: 10 },
            { id: "opt_borda_cheddar_fg", name: "Cheddar", price: 10 },
            { id: "opt_sem_borda_fg", name: "Sem borda recheada", price: 0 },
          ],
        },
        {
          id: "pizza_frango_group_2",
          title: "Toques finais",
          maxSelection: 2,
          options: [
            { id: "opt_bacon_fg", name: "Bacon", price: 7 },
            { id: "opt_cream_fg", name: "Cream cheese", price: 8 },
            { id: "opt_olive_fg", name: "Azeitona preta", price: 3 },
          ],
        },
      ],
    },
    {
      id: "prod_coke",
      categoryId: "cat_drinks",
      name: "Coca-Cola 2L",
      description: "Garrafa 2 litros, perfeita para compartilhar.",
      price: 14,
      image:
        "https://images.unsplash.com/photo-1629203432180-71e9b0f3b3f2?auto=format&fit=crop&w=1200&q=80",
      active: true,
      featured: false,
      allowHalfAndHalf: false,
      groups: [
        {
          id: "drink_group_1",
          title: "Complementos",
          maxSelection: 0,
          options: [],
        },
        {
          id: "drink_group_2",
          title: "Observações rápidas",
          maxSelection: 0,
          options: [],
        },
      ],
    },
    {
      id: "prod_brownie",
      categoryId: "cat_desserts",
      name: "Brownie Vulcão",
      description: "Brownie intenso com calda de chocolate e sorvete de baunilha.",
      price: 19.9,
      image:
        "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=80",
      active: true,
      featured: true,
      allowHalfAndHalf: false,
      groups: [
        {
          id: "dessert_group_1",
          title: "Coberturas",
          maxSelection: 2,
          options: [
            { id: "opt_nutella", name: "Nutella", price: 5 },
            { id: "opt_oreo", name: "Oreo", price: 4 },
            { id: "opt_strawberry", name: "Morango", price: 6 },
          ],
        },
        {
          id: "dessert_group_2",
          title: "Acompanhamentos",
          maxSelection: 1,
          options: [
            { id: "opt_icecream", name: "Sorvete extra", price: 7 },
            { id: "opt_whip", name: "Chantilly", price: 3 },
          ],
        },
      ],
    },
  ],
  schedule: {
    monday: { enabled: true, open: "18:00", close: "23:30" },
    tuesday: { enabled: true, open: "18:00", close: "23:30" },
    wednesday: { enabled: true, open: "18:00", close: "23:30" },
    thursday: { enabled: true, open: "18:00", close: "23:30" },
    friday: { enabled: true, open: "18:00", close: "00:30" },
    saturday: { enabled: true, open: "17:00", close: "00:30" },
    sunday: { enabled: true, open: "17:00", close: "23:00" },
  },
};

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function defaultGroup(index: number): AddOnGroup {
  return {
    id: `group_${index + 1}`,
    title: `Barra ${index + 1}`,
    maxSelection: 0,
    options: [],
  };
}

function normalizeGroups(groups: unknown): AddOnGroup[] {
  const safeGroups = Array.isArray(groups) ? groups : [];
  const normalized = safeGroups.slice(0, 2).map((group, index) => {
    const base = defaultGroup(index);
    const current = (group ?? {}) as Partial<AddOnGroup>;
    return {
      ...base,
      ...current,
      id: typeof current.id === "string" && current.id ? current.id : `${base.id}_${uid("g")}`,
      title: typeof current.title === "string" ? current.title : base.title,
      maxSelection:
        typeof current.maxSelection === "number" && Number.isFinite(current.maxSelection)
          ? current.maxSelection
          : 0,
      options: Array.isArray(current.options)
        ? current.options.map((option, optionIndex) => {
            const currentOption = (option ?? {}) as Partial<AddOnOption>;
            return {
              id:
                typeof currentOption.id === "string" && currentOption.id
                  ? currentOption.id
                  : `option_${index + 1}_${optionIndex + 1}`,
              name: typeof currentOption.name === "string" ? currentOption.name : `Opção ${optionIndex + 1}`,
              price:
                typeof currentOption.price === "number" && Number.isFinite(currentOption.price)
                  ? currentOption.price
                  : 0,
            };
          })
        : [],
    };
  });

  while (normalized.length < 2) {
    normalized.push(defaultGroup(normalized.length));
  }

  return normalized;
}

function sanitizeStoreData(input: Partial<StoreData> | null | undefined): StoreData {
  const source = input ?? {};
  const themeSource = (source.theme ?? {}) as Partial<ThemeSettings>;
  const scheduleSource = (source.schedule ?? {}) as Partial<Record<DayKey, Partial<ScheduleDay>>>;

  return {
    version: typeof source.version === "number" ? source.version : DEFAULT_DATA.version,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : new Date().toISOString(),
    theme: {
      ...DEFAULT_DATA.theme,
      ...themeSource,
      deliveryFee:
        typeof themeSource.deliveryFee === "number" && Number.isFinite(themeSource.deliveryFee)
          ? themeSource.deliveryFee
          : DEFAULT_DATA.theme.deliveryFee,
      minOrder:
        typeof themeSource.minOrder === "number" && Number.isFinite(themeSource.minOrder)
          ? themeSource.minOrder
          : DEFAULT_DATA.theme.minOrder,
    },
    categories: Array.isArray(source.categories)
      ? source.categories.map((category, index) => {
          const current = (category ?? {}) as Partial<Category>;
          return {
            id: typeof current.id === "string" && current.id ? current.id : `category_${index + 1}`,
            name: typeof current.name === "string" ? current.name : `Categoria ${index + 1}`,
            description: typeof current.description === "string" ? current.description : "",
            active: typeof current.active === "boolean" ? current.active : true,
          };
        })
      : DEFAULT_DATA.categories,
    products: Array.isArray(source.products)
      ? source.products.map((product, index) => {
          const current = (product ?? {}) as Partial<Product>;
          return {
            id: typeof current.id === "string" && current.id ? current.id : `product_${index + 1}`,
            categoryId:
              typeof current.categoryId === "string" && current.categoryId
                ? current.categoryId
                : DEFAULT_DATA.categories[0].id,
            name: typeof current.name === "string" ? current.name : `Produto ${index + 1}`,
            description: typeof current.description === "string" ? current.description : "",
            price:
              typeof current.price === "number" && Number.isFinite(current.price) ? current.price : 0,
            image: typeof current.image === "string" ? current.image : "",
            active: typeof current.active === "boolean" ? current.active : true,
            featured: typeof current.featured === "boolean" ? current.featured : false,
            allowHalfAndHalf:
              typeof current.allowHalfAndHalf === "boolean" ? current.allowHalfAndHalf : false,
            groups: normalizeGroups(current.groups),
          };
        })
      : DEFAULT_DATA.products,
    schedule: {
      monday: { ...DEFAULT_DATA.schedule.monday, ...(scheduleSource.monday ?? {}) },
      tuesday: { ...DEFAULT_DATA.schedule.tuesday, ...(scheduleSource.tuesday ?? {}) },
      wednesday: { ...DEFAULT_DATA.schedule.wednesday, ...(scheduleSource.wednesday ?? {}) },
      thursday: { ...DEFAULT_DATA.schedule.thursday, ...(scheduleSource.thursday ?? {}) },
      friday: { ...DEFAULT_DATA.schedule.friday, ...(scheduleSource.friday ?? {}) },
      saturday: { ...DEFAULT_DATA.schedule.saturday, ...(scheduleSource.saturday ?? {}) },
      sunday: { ...DEFAULT_DATA.schedule.sunday, ...(scheduleSource.sunday ?? {}) },
    },
  };
}

function getStoreStatus(schedule: Record<DayKey, ScheduleDay>, now = new Date()): StoreStatus {
  const dayIndex = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentKey = DAY_ORDER[dayIndex];
  const previousKey = DAY_ORDER[(dayIndex + 6) % 7];
  const previous = schedule[previousKey];

  if (previous.enabled) {
    const previousOpen = toMinutes(previous.open);
    const previousClose = toMinutes(previous.close);
    if (previousClose <= previousOpen && currentMinutes < previousClose) {
      return {
        isOpen: true,
        reason: `Aberto até ${previous.close}`,
        nextOpenText: `Virada do dia • fecha ${previous.close}`,
      };
    }
  }

  const today = schedule[currentKey];
  if (today.enabled) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    const isOvernight = close <= open;
    const insideWindow = isOvernight
      ? currentMinutes >= open || currentMinutes < close
      : currentMinutes >= open && currentMinutes < close;

    if (insideWindow) {
      return {
        isOpen: true,
        reason: `Aberto até ${today.close}`,
        nextOpenText: `${DAY_LABELS[currentKey]} • fecha ${today.close}`,
      };
    }
  }

  for (let offset = 0; offset < 7; offset += 1) {
    const key = DAY_ORDER[(dayIndex + offset) % 7];
    const day = schedule[key];
    if (!day.enabled) {
      continue;
    }

    if (offset === 0) {
      const open = toMinutes(day.open);
      if (currentMinutes < open) {
        return {
          isOpen: false,
          reason: "Loja fechada no momento",
          nextOpenText: `${DAY_LABELS[key]} • abre ${day.open}`,
        };
      }
      continue;
    }

    return {
      isOpen: false,
      reason: "Loja fechada no momento",
      nextOpenText: `${DAY_LABELS[key]} • abre ${day.open}`,
    };
  }

  return {
    isOpen: false,
    reason: "Loja fechada no momento",
    nextOpenText: "Sem expediente configurado",
  };
}

function getProductBasePrice(
  product: Product,
  productMap: Map<string, Product>,
  halfHalfProductId?: string,
) {
  if (!product.allowHalfAndHalf || !halfHalfProductId) {
    return product.price;
  }

  const halfProduct = productMap.get(halfHalfProductId);
  if (!halfProduct) {
    return product.price;
  }

  return (product.price + halfProduct.price) / 2;
}

function getItemAddOnTotal(product: Product, selectedAddOns: Record<string, string[]>) {
  return product.groups.reduce((sum, group) => {
    const selectedIds = selectedAddOns[group.id] ?? [];
    const groupTotal = group.options
      .filter((option) => selectedIds.includes(option.id))
      .reduce((acc, option) => acc + option.price, 0);
    return sum + groupTotal;
  }, 0);
}

function getCartItemTotal(item: CartItem, productMap: Map<string, Product>) {
  const product = productMap.get(item.productId);
  if (!product) {
    return 0;
  }
  const basePrice = getProductBasePrice(product, productMap, item.halfHalfProductId);
  const addOns = getItemAddOnTotal(product, item.selectedAddOns);
  return (basePrice + addOns) * item.quantity;
}

function cloneStoreData(data: StoreData) {
  return JSON.parse(JSON.stringify(data)) as StoreData;
}

function touchStoreData(data: StoreData) {
  return {
    ...data,
    updatedAt: new Date().toISOString(),
  };
}

function openWhatsApp(whatsapp: string, message: string) {
  const phone = whatsapp.replace(/\D/g, "");
  if (!phone) {
    window.alert("Defina um número de WhatsApp válido no Painel Admin.");
    return;
  }
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function buildOrderMessage(params: {
  store: StoreData;
  cart: CartItem[];
  checkout: CheckoutForm;
  status: StoreStatus;
}) {
  const { store, cart, checkout, status } = params;
  const productMap = new Map(store.products.map((product) => [product.id, product]));
  const subtotal = cart.reduce((sum, item) => sum + getCartItemTotal(item, productMap), 0);
  const total = subtotal + store.theme.deliveryFee;

  const itemsText = cart
    .map((item, index) => {
      const product = productMap.get(item.productId);
      if (!product) {
        return "";
      }
      const halfHalf = item.halfHalfProductId ? productMap.get(item.halfHalfProductId) : undefined;
      const addOnsText = product.groups
        .map((group) => {
          const selectedIds = item.selectedAddOns[group.id] ?? [];
          const selectedOptions = group.options.filter((option) => selectedIds.includes(option.id));
          if (!selectedOptions.length) {
            return "";
          }
          return `   • ${group.title}: ${selectedOptions
            .map((option) => `${option.name}${option.price ? ` (+${formatCurrency(option.price)})` : ""}`)
            .join(", ")}`;
        })
        .filter(Boolean)
        .join("\n");

      const unitBase = getProductBasePrice(product, productMap, item.halfHalfProductId);
      const addOns = getItemAddOnTotal(product, item.selectedAddOns);
      const lineTotal = (unitBase + addOns) * item.quantity;
      return [
        `${index + 1}. ${item.quantity}x ${product.name}`,
        halfHalf ? `   • Meio a meio: ${product.name} + ${halfHalf.name} = ${formatCurrency(unitBase)}` : "",
        addOnsText,
        item.notes ? `   • Observações: ${item.notes}` : "",
        `   • Total do item: ${formatCurrency(lineTotal)}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean)
    .join("\n\n");

  const orderMode = status.isOpen
    ? "Pedido imediato"
    : `Pedido agendado para ${checkout.scheduleTime || "horário a confirmar"}`;

  return [
    `*${store.theme.storeName}*`,
    "",
    `*${orderMode}*`,
    `Cliente: ${checkout.customerName}`,
    checkout.phone ? `Telefone: ${checkout.phone}` : "",
    `Endereço: ${checkout.address}`,
    checkout.neighborhood ? `Bairro/Referência: ${checkout.neighborhood}` : "",
    `Pagamento: ${checkout.paymentMethod}`,
    checkout.changeFor ? `Troco para: ${checkout.changeFor}` : "",
    "",
    "*Itens do pedido*",
    itemsText,
    "",
    checkout.orderNotes ? `Observações gerais: ${checkout.orderNotes}` : "",
    `Subtotal: ${formatCurrency(subtotal)}`,
    `Entrega: ${formatCurrency(store.theme.deliveryFee)}`,
    `*Total: ${formatCurrency(total)}*`,
  ]
    .filter(Boolean)
    .join("\n");
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto mb-3 h-11 w-11 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        <p className="text-sm text-white/80">Inicializando o ecossistema de delivery...</p>
      </div>
    </div>
  );
}

function FieldLabel({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <label className="text-sm font-semibold text-slate-700">{title}</label>
      {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </div>
  );
}

function Badge({ children, tone = "default" }: { children: string; tone?: "default" | "success" | "warning" }) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-500/10 text-emerald-700 ring-emerald-200"
      : tone === "warning"
        ? "bg-amber-500/10 text-amber-700 ring-amber-200"
        : "bg-slate-500/10 text-slate-700 ring-slate-200";
  return <span className={cn("rounded-full px-3 py-1 text-xs font-semibold ring-1", toneClass)}>{children}</span>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function AdminPage({
  data,
  seedData,
  onChange,
}: {
  data: StoreData;
  seedData: StoreData;
  onChange: (next: StoreData) => void;
}) {
  const [tab, setTab] = useState<"products" | "categories" | "operations" | "theme" | "brain">("products");
  const [selectedProductId, setSelectedProductId] = useState<string>(data.products[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [pausedOnly, setPausedOnly] = useState(false);
  const [jsonDraft, setJsonDraft] = useState(JSON.stringify(data, null, 2));

  useEffect(() => {
    if (!data.products.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(data.products[0]?.id ?? "");
    }
    setJsonDraft(JSON.stringify(data, null, 2));
  }, [data, selectedProductId]);

  const commit = (updater: (current: StoreData) => StoreData) => {
    onChange(touchStoreData(updater(cloneStoreData(data))));
  };

  const filteredProducts = data.products.filter((product) => {
    const query = normalizeText(search.trim());
    const matchesSearch =
      !query ||
      normalizeText(product.name).includes(query) ||
      normalizeText(product.description).includes(query) ||
      normalizeText(product.price.toFixed(2)).includes(query) ||
      normalizeText(formatCurrency(product.price)).includes(query);

    if (!matchesSearch) {
      return false;
    }

    if (pausedOnly && product.active) {
      return false;
    }

    return true;
  });

  const selectedProduct = data.products.find((product) => product.id === selectedProductId);

  const addCategory = () => {
    commit((current) => {
      current.categories.push({
        id: uid("cat"),
        name: `Nova categoria ${current.categories.length + 1}`,
        description: "Descreva esta categoria para o cliente.",
        active: true,
      });
      return current;
    });
  };

  const addProduct = () => {
    const defaultCategoryId = data.categories[0]?.id ?? "";
    const newId = uid("product");
    commit((current) => {
      current.products.unshift({
        id: newId,
        categoryId: defaultCategoryId,
        name: "Novo produto",
        description: "Descrição comercial do item.",
        price: 0,
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
        active: true,
        featured: false,
        allowHalfAndHalf: false,
        groups: [
          { id: uid("group"), title: "Barra 1", maxSelection: 0, options: [] },
          { id: uid("group"), title: "Barra 2", maxSelection: 0, options: [] },
        ],
      });
      return current;
    });
    setSelectedProductId(newId);
    setTab("products");
  };

  const removeProduct = (productId: string) => {
    if (!window.confirm("Excluir este produto do cardápio?")) {
      return;
    }
    commit((current) => {
      current.products = current.products.filter((product) => product.id !== productId);
      return current;
    });
  };

  const removeCategory = (categoryId: string) => {
    if (data.categories.length <= 1) {
      window.alert("Mantenha pelo menos uma categoria ativa para o cardápio.");
      return;
    }
    if (!window.confirm("Remover esta categoria? Produtos serão realocados para a primeira categoria disponível.")) {
      return;
    }
    commit((current) => {
      const fallback = current.categories.find((category) => category.id !== categoryId)?.id ?? current.categories[0]?.id ?? "";
      current.categories = current.categories.filter((category) => category.id !== categoryId);
      current.products = current.products.map((product) =>
        product.categoryId === categoryId ? { ...product, categoryId: fallback } : product,
      );
      return current;
    });
  };

  const moveCategory = (categoryId: string, direction: -1 | 1) => {
    commit((current) => {
      const index = current.categories.findIndex((category) => category.id === categoryId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.categories.length) {
        return current;
      }
      const [item] = current.categories.splice(index, 1);
      current.categories.splice(nextIndex, 0, item);
      return current;
    });
  };

  const updateSelectedProduct = (updater: (current: Product) => Product) => {
    if (!selectedProduct) {
      return;
    }
    commit((current) => {
      current.products = current.products.map((product) =>
        product.id === selectedProduct.id ? updater(product) : product,
      );
      return current;
    });
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "products.json";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importJson = () => {
    try {
      const parsed = JSON.parse(jsonDraft) as StoreData;
      onChange(touchStoreData(sanitizeStoreData(parsed)));
      window.alert("JSON aplicado com sucesso.");
    } catch {
      window.alert("JSON inválido. Revise o conteúdo antes de aplicar.");
    }
  };

  const restoreSeed = () => {
    if (!window.confirm("Restaurar o cérebro original carregado do products.json?")) {
      return;
    }
    onChange(touchStoreData(cloneStoreData(seedData)));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 shadow-2xl shadow-black/30">
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-2xl bg-white/10 px-4 py-2 text-xl">🧠</span>
                <Badge tone="success">Painel Admin</Badge>
                <Badge>{`Atualizado ${new Date(data.updatedAt).toLocaleString("pt-BR")}`}</Badge>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Ecossistema de Delivery Autônomo</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
                O painel edita o catálogo e a operação em tempo real no navegador. Como o projeto roda em hospedagem estática
                no GitHub, você pode usar o armazenamento local para operar e exportar o <strong>products.json</strong> sempre
                que quiser publicar a nova versão no repositório.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="./index.html"
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Abrir experiência do cliente
                </a>
                <button
                  type="button"
                  onClick={exportJson}
                  className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Exportar products.json
                </button>
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Categorias" value={String(data.categories.length)} />
                <MetricCard label="Produtos" value={String(data.products.length)} />
                <MetricCard label="Ativos" value={String(data.products.filter((product) => product.active).length)} />
                <MetricCard label="Taxa entrega" value={formatCurrency(data.theme.deliveryFee)} />
              </div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
                <strong className="block font-semibold">Fluxo recomendado para GitHub</strong>
                <span className="mt-1 block text-emerald-100/80">
                  Edite aqui → exporte o <code>products.json</code> → publique no repositório → GitHub Pages atualiza o cardápio.
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-6 grid flex-1 gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-4 shadow-xl backdrop-blur">
            <nav className="grid gap-2">
              {[
                ["products", "Produtos & estoque"],
                ["categories", "Categorias"],
                ["operations", "Operação"],
                ["theme", "Paleta & marca"],
                ["brain", "Cérebro JSON"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTab(value as typeof tab)}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-left text-sm font-semibold transition",
                    tab === value ? "bg-white text-slate-900" : "bg-white/5 text-slate-300 hover:bg-white/10",
                  )}
                >
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="rounded-[2rem] border border-white/10 bg-white p-4 text-slate-900 shadow-2xl sm:p-6">
            {tab === "products" ? (
              <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
                <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black">Gestão de estoque</h2>
                      <p className="text-sm text-slate-500">Buscar por nome ou preço e pausar sem abrir o editor.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addProduct}
                      className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      + Novo produto
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar por nome, descrição ou preço"
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-slate-400"
                    />
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600">
                      <input type="checkbox" checked={pausedOnly} onChange={(event) => setPausedOnly(event.target.checked)} />
                      Ver apenas itens pausados
                    </label>
                  </div>

                  <div className="mt-4 grid max-h-[65vh] gap-3 overflow-y-auto pr-1">
                    {filteredProducts.map((product) => {
                      const category = data.categories.find((item) => item.id === product.categoryId);
                      return (
                        <div
                          key={product.id}
                          className={cn(
                            "rounded-3xl border p-3 shadow-sm transition",
                            selectedProductId === product.id
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-900",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedProductId(product.id)}
                            className="w-full text-left"
                          >
                            <div className="flex items-start gap-3">
                              <img src={product.image} alt={product.name} className="h-16 w-16 rounded-2xl object-cover" />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="truncate font-bold">{product.name}</h3>
                                  {!product.active ? <Badge tone="warning">Pausado</Badge> : null}
                                  {product.allowHalfAndHalf ? <Badge>Meio a meio</Badge> : null}
                                </div>
                                <p className={cn("mt-1 text-xs", selectedProductId === product.id ? "text-white/70" : "text-slate-500")}>
                                  {category?.name ?? "Sem categoria"}
                                </p>
                                <p className="mt-2 text-sm font-semibold">{formatCurrency(product.price)}</p>
                              </div>
                            </div>
                          </button>
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                commit((current) => {
                                  current.products = current.products.map((item) =>
                                    item.id === product.id ? { ...item, active: !item.active } : item,
                                  );
                                  return current;
                                })
                              }
                              className={cn(
                                "flex-1 rounded-2xl px-3 py-2 text-xs font-semibold transition",
                                product.active
                                  ? "bg-amber-500/15 text-amber-700 hover:bg-amber-500/20"
                                  : "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20",
                              )}
                            >
                              {product.active ? "Pausar" : "Reativar"}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeProduct(product.id)}
                              className="rounded-2xl bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/15"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {!filteredProducts.length ? (
                      <EmptyState
                        title="Nenhum produto encontrado"
                        description="Ajuste a busca ou remova o filtro de itens pausados para visualizar mais produtos."
                      />
                    ) : null}
                  </div>
                </section>

                <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  {selectedProduct ? (
                    <div className="grid gap-6">
                      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                        <div>
                          <h2 className="text-xl font-black">Editor do produto</h2>
                          <p className="mt-1 text-sm text-slate-500">
                            Nome, preço, descrição, visibilidade, categoria, foto e duas barras de adicionais com limite configurável.
                          </p>
                        </div>
                        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3">
                          <img src={selectedProduct.image} alt={selectedProduct.name} className="h-44 w-full rounded-2xl object-cover" />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <FieldLabel title="Nome do produto" />
                          <input
                            value={selectedProduct.name}
                            onChange={(event) =>
                              updateSelectedProduct((product) => ({ ...product, name: event.target.value }))
                            }
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                          />
                        </div>
                        <div>
                          <FieldLabel title="Preço" />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={selectedProduct.price}
                            onChange={(event) =>
                              updateSelectedProduct((product) => ({
                                ...product,
                                price: Number(event.target.value) || 0,
                              }))
                            }
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <FieldLabel title="Descrição" />
                          <textarea
                            value={selectedProduct.description}
                            onChange={(event) =>
                              updateSelectedProduct((product) => ({ ...product, description: event.target.value }))
                            }
                            rows={3}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <FieldLabel title="Foto do produto" hint="Cole a URL da imagem" />
                          <input
                            value={selectedProduct.image}
                            onChange={(event) =>
                              updateSelectedProduct((product) => ({ ...product, image: event.target.value }))
                            }
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-4">
                        <div>
                          <FieldLabel title="Categoria" />
                          <select
                            value={selectedProduct.categoryId}
                            onChange={(event) =>
                              updateSelectedProduct((product) => ({ ...product, categoryId: event.target.value }))
                            }
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                          >
                            {data.categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <ToggleCard
                          title="Produto ativo"
                          description="Aparece para o cliente."
                          checked={selectedProduct.active}
                          onChange={(checked) => updateSelectedProduct((product) => ({ ...product, active: checked }))}
                        />
                        <ToggleCard
                          title="Destaque"
                          description="Aparece no topo da vitrine."
                          checked={selectedProduct.featured}
                          onChange={(checked) => updateSelectedProduct((product) => ({ ...product, featured: checked }))}
                        />
                        <ToggleCard
                          title="Pizza meio a meio"
                          description="Calcula média entre sabores."
                          checked={selectedProduct.allowHalfAndHalf}
                          onChange={(checked) =>
                            updateSelectedProduct((product) => ({ ...product, allowHalfAndHalf: checked }))
                          }
                        />
                      </div>

                      <div className="grid gap-4 xl:grid-cols-2">
                        {selectedProduct.groups.map((group, groupIndex) => (
                          <div key={group.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="text-lg font-black">Barra de adicionais {groupIndex + 1}</h3>
                                <p className="text-sm text-slate-500">Defina título, limite de escolha e opções.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  updateSelectedProduct((product) => ({
                                    ...product,
                                    groups: product.groups.map((currentGroup, index) =>
                                      index === groupIndex
                                        ? { ...currentGroup, options: [] }
                                        : currentGroup,
                                    ),
                                  }))
                                }
                                className="rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100"
                              >
                                Limpar barra
                              </button>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_130px]">
                              <div>
                                <FieldLabel title="Título da barra" />
                                <input
                                  value={group.title}
                                  onChange={(event) =>
                                    updateSelectedProduct((product) => ({
                                      ...product,
                                      groups: product.groups.map((currentGroup, index) =>
                                        index === groupIndex
                                          ? { ...currentGroup, title: event.target.value }
                                          : currentGroup,
                                      ),
                                    }))
                                  }
                                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                                />
                              </div>
                              <div>
                                <FieldLabel title="Máximo" hint="0 desativa" />
                                <input
                                  type="number"
                                  min="0"
                                  value={group.maxSelection}
                                  onChange={(event) =>
                                    updateSelectedProduct((product) => ({
                                      ...product,
                                      groups: product.groups.map((currentGroup, index) =>
                                        index === groupIndex
                                          ? {
                                              ...currentGroup,
                                              maxSelection: Math.max(0, Number(event.target.value) || 0),
                                            }
                                          : currentGroup,
                                      ),
                                    }))
                                  }
                                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                                />
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3">
                              {group.options.map((option) => (
                                <div key={option.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_120px_auto]">
                                  <input
                                    value={option.name}
                                    onChange={(event) =>
                                      updateSelectedProduct((product) => ({
                                        ...product,
                                        groups: product.groups.map((currentGroup, index) =>
                                          index === groupIndex
                                            ? {
                                                ...currentGroup,
                                                options: currentGroup.options.map((currentOption) =>
                                                  currentOption.id === option.id
                                                    ? { ...currentOption, name: event.target.value }
                                                    : currentOption,
                                                ),
                                              }
                                            : currentGroup,
                                        ),
                                      }))
                                    }
                                    placeholder="Nome do adicional"
                                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                                  />
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={option.price}
                                    onChange={(event) =>
                                      updateSelectedProduct((product) => ({
                                        ...product,
                                        groups: product.groups.map((currentGroup, index) =>
                                          index === groupIndex
                                            ? {
                                                ...currentGroup,
                                                options: currentGroup.options.map((currentOption) =>
                                                  currentOption.id === option.id
                                                    ? {
                                                        ...currentOption,
                                                        price: Number(event.target.value) || 0,
                                                      }
                                                    : currentOption,
                                                ),
                                              }
                                            : currentGroup,
                                        ),
                                      }))
                                    }
                                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateSelectedProduct((product) => ({
                                        ...product,
                                        groups: product.groups.map((currentGroup, index) =>
                                          index === groupIndex
                                            ? {
                                                ...currentGroup,
                                                options: currentGroup.options.filter((currentOption) => currentOption.id !== option.id),
                                              }
                                            : currentGroup,
                                        ),
                                      }))
                                    }
                                    className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-500/15"
                                  >
                                    Remover
                                  </button>
                                </div>
                              ))}

                              <button
                                type="button"
                                onClick={() =>
                                  updateSelectedProduct((product) => ({
                                    ...product,
                                    groups: product.groups.map((currentGroup, index) =>
                                      index === groupIndex
                                        ? {
                                            ...currentGroup,
                                            options: [
                                              ...currentGroup.options,
                                              { id: uid("option"), name: "Novo adicional", price: 0 },
                                            ],
                                          }
                                        : currentGroup,
                                    ),
                                  }))
                                }
                                className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                              >
                                + Adicionar opção na barra {groupIndex + 1}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      title="Selecione um produto"
                      description="Clique em um item da coluna ao lado para editar ou crie um novo produto."
                    />
                  )}
                </section>
              </div>
            ) : null}

            {tab === "categories" ? (
              <div className="grid gap-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black">Categorias e ordenação</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Crie, remova, renomeie e reorganize as categorias. A ordem daqui é a ordem exibida para o cliente.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addCategory}
                    className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    + Nova categoria
                  </button>
                </div>

                <div className="grid gap-4">
                  {data.categories.map((category, index) => (
                    <div key={category.id} className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1fr_1.2fr_auto]">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <FieldLabel title={`Categoria #${index + 1}`} />
                          <input
                            value={category.name}
                            onChange={(event) =>
                              commit((current) => {
                                current.categories = current.categories.map((item) =>
                                  item.id === category.id ? { ...item, name: event.target.value } : item,
                                );
                                return current;
                              })
                            }
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                          />
                        </div>
                        <div>
                          <FieldLabel title="Ativa" />
                          <label className="flex h-[52px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600">
                            <input
                              type="checkbox"
                              checked={category.active}
                              onChange={(event) =>
                                commit((current) => {
                                  current.categories = current.categories.map((item) =>
                                    item.id === category.id ? { ...item, active: event.target.checked } : item,
                                  );
                                  return current;
                                })
                              }
                            />
                            Exibir categoria para o cliente
                          </label>
                        </div>
                      </div>

                      <div>
                        <FieldLabel title="Descrição curta" />
                        <input
                          value={category.description}
                          onChange={(event) =>
                            commit((current) => {
                              current.categories = current.categories.map((item) =>
                                item.id === category.id ? { ...item, description: event.target.value } : item,
                              );
                              return current;
                            })
                          }
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                        />
                      </div>

                      <div className="flex flex-wrap items-end gap-2">
                        <button
                          type="button"
                          onClick={() => moveCategory(category.id, -1)}
                          className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
                        >
                          ↑ Subir
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCategory(category.id, 1)}
                          className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
                        >
                          ↓ Descer
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCategory(category.id)}
                          className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-500/15"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {tab === "operations" ? (
              <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
                <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <h2 className="text-2xl font-black">Operação e checkout</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Defina taxa de entrega, pedido mínimo e WhatsApp que recebe os pedidos formatados.
                  </p>

                  <div className="mt-5 grid gap-4">
                    <div>
                      <FieldLabel title="WhatsApp destino" hint="Use DDI + DDD + número" />
                      <input
                        value={data.theme.whatsapp}
                        onChange={(event) =>
                          commit((current) => ({
                            ...current,
                            theme: { ...current.theme, whatsapp: event.target.value },
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <FieldLabel title="Taxa de entrega" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={data.theme.deliveryFee}
                        onChange={(event) =>
                          commit((current) => ({
                            ...current,
                            theme: { ...current.theme, deliveryFee: Number(event.target.value) || 0 },
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <FieldLabel title="Pedido mínimo" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={data.theme.minOrder}
                        onChange={(event) =>
                          commit((current) => ({
                            ...current,
                            theme: { ...current.theme, minOrder: Number(event.target.value) || 0 },
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-black">Horário automático por dia</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        O cliente vê em tempo real se a loja está aberta e, quando fechada, o checkout libera o agendamento.
                      </p>
                    </div>
                    <Badge tone={getStoreStatus(data.schedule).isOpen ? "success" : "warning"}>
                      {getStoreStatus(data.schedule).isOpen ? "Loja aberta agora" : "Loja fechada agora"}
                    </Badge>
                  </div>

                  <div className="mt-5 grid gap-4">
                    {DAY_ORDER.slice(1).concat(DAY_ORDER[0]).map((dayKey) => {
                      const day = data.schedule[dayKey];
                      return (
                        <div
                          key={dayKey}
                          className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[180px_1fr_1fr]"
                        >
                          <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={day.enabled}
                              onChange={(event) =>
                                commit((current) => ({
                                  ...current,
                                  schedule: {
                                    ...current.schedule,
                                    [dayKey]: {
                                      ...current.schedule[dayKey],
                                      enabled: event.target.checked,
                                    },
                                  },
                                }))
                              }
                            />
                            {DAY_LABELS[dayKey]}
                          </label>
                          <input
                            type="time"
                            value={day.open}
                            onChange={(event) =>
                              commit((current) => ({
                                ...current,
                                schedule: {
                                  ...current.schedule,
                                  [dayKey]: {
                                    ...current.schedule[dayKey],
                                    open: event.target.value,
                                  },
                                },
                              }))
                            }
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                          />
                          <input
                            type="time"
                            value={day.close}
                            onChange={(event) =>
                              commit((current) => ({
                                ...current,
                                schedule: {
                                  ...current.schedule,
                                  [dayKey]: {
                                    ...current.schedule[dayKey],
                                    close: event.target.value,
                                  },
                                },
                              }))
                            }
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            ) : null}

            {tab === "theme" ? (
              <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
                <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <h2 className="text-2xl font-black">Paleta de cores e marca</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Ajuste a identidade visual, nome da loja, slogan e rodapé do site do cliente.
                  </p>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <FieldLabel title="Nome da loja" />
                      <input
                        value={data.theme.storeName}
                        onChange={(event) =>
                          commit((current) => ({
                            ...current,
                            theme: { ...current.theme, storeName: event.target.value },
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <FieldLabel title="Logo/emoji" />
                      <input
                        value={data.theme.logoEmoji}
                        onChange={(event) =>
                          commit((current) => ({
                            ...current,
                            theme: { ...current.theme, logoEmoji: event.target.value },
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <FieldLabel title="Slogan" />
                      <input
                        value={data.theme.slogan}
                        onChange={(event) =>
                          commit((current) => ({
                            ...current,
                            theme: { ...current.theme, slogan: event.target.value },
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <FieldLabel title="Texto do rodapé" />
                      <input
                        value={data.theme.footerText}
                        onChange={(event) =>
                          commit((current) => ({
                            ...current,
                            theme: { ...current.theme, footerText: event.target.value },
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      ["Cor primária", "primaryColor"],
                      ["Cor secundária", "secondaryColor"],
                      ["Cor destaque", "accentColor"],
                      ["Cor de superfície", "surfaceColor"],
                    ].map(([label, key]) => (
                      <div key={key} className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                        <FieldLabel title={label} />
                        <input
                          type="color"
                          value={data.theme[key as keyof ThemeSettings] as string}
                          onChange={(event) =>
                            commit((current) => ({
                              ...current,
                              theme: { ...current.theme, [key]: event.target.value },
                            }))
                          }
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-transparent p-1"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                  <h2 className="text-2xl font-black">Preview da paleta</h2>
                  <p className="mt-1 text-sm text-slate-500">Uma prévia rápida da identidade aplicada ao catálogo do cliente.</p>

                  <div
                    className="mt-5 overflow-hidden rounded-[2rem] p-5 text-white shadow-xl"
                    style={{
                      background: `linear-gradient(135deg, ${data.theme.primaryColor}, ${data.theme.secondaryColor})`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-2xl bg-white/15 px-4 py-2 text-2xl">{data.theme.logoEmoji}</span>
                      <div>
                        <h3 className="text-xl font-black">{data.theme.storeName}</h3>
                        <p className="text-sm text-white/80">{data.theme.slogan}</p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-[1.5rem] bg-white/15 p-4 backdrop-blur">
                      <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                        <span>Taxa de entrega</span>
                        <span>{formatCurrency(data.theme.deliveryFee)}</span>
                      </div>
                      <div className="mt-3 h-3 rounded-full" style={{ backgroundColor: data.theme.accentColor }} />
                      <div className="mt-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900" style={{ backgroundColor: data.theme.surfaceColor }}>
                        {data.theme.footerText}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            ) : null}

            {tab === "brain" ? (
              <div className="grid gap-6 xl:grid-cols-[1fr_250px]">
                <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <h2 className="text-2xl font-black">O Cérebro • products.json</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Aqui você pode visualizar, colar, importar e exportar o JSON que alimenta cliente e admin. Ideal para versionar no GitHub.
                  </p>
                  <textarea
                    value={jsonDraft}
                    onChange={(event) => setJsonDraft(event.target.value)}
                    className="mt-5 min-h-[520px] w-full rounded-[1.5rem] border border-slate-200 bg-slate-950 p-4 font-mono text-sm text-emerald-300 outline-none focus:border-slate-400"
                  />
                </section>

                <section className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-5">
                  <button
                    type="button"
                    onClick={importJson}
                    className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Aplicar JSON colado
                  </button>
                  <button
                    type="button"
                    onClick={exportJson}
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                  >
                    Exportar arquivo products.json
                  </button>
                  <button
                    type="button"
                    onClick={restoreSeed}
                    className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-500/15"
                  >
                    Restaurar cérebro original
                  </button>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <strong className="block font-semibold text-slate-900">Dica de publicação</strong>
                    Exporte o arquivo gerado e substitua o <code>public/products.json</code> do projeto para que o GitHub Pages entregue o catálogo atualizado para todos os clientes.
                  </div>
                </section>
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
      <span className="block text-xs uppercase tracking-[0.2em] text-slate-400">{label}</span>
      <strong className="mt-2 block text-2xl font-black text-white">{value}</strong>
    </div>
  );
}

function ToggleCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex h-full cursor-pointer items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <div>
        <span className="block text-sm font-bold text-slate-900">{title}</span>
        <span className="block text-xs text-slate-500">{description}</span>
      </div>
    </label>
  );
}

function CustomerPage({ data }: { data: StoreData }) {
  const [now, setNow] = useState(new Date());
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [customizer, setCustomizer] = useState<CustomizerState | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutForm>({
    customerName: "",
    phone: "",
    address: "",
    neighborhood: "",
    paymentMethod: "PIX",
    changeFor: "",
    orderNotes: "",
    scheduleTime: "",
  });

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const status = useMemo(() => getStoreStatus(data.schedule, now), [data.schedule, now]);
  const productMap = useMemo(() => new Map(data.products.map((product) => [product.id, product])), [data.products]);
  const activeCategories = data.categories.filter((category) => category.active);
  const favoriteProducts = data.products.filter((product) => favorites.includes(product.id) && product.active);

  const featuredProducts = data.products.filter((product) => product.active && product.featured);

  const filteredProducts = data.products.filter((product) => {
    if (!product.active) {
      return false;
    }
    const query = normalizeText(search.trim());
    const matchesSearch =
      !query ||
      normalizeText(product.name).includes(query) ||
      normalizeText(product.description).includes(query) ||
      normalizeText(formatCurrency(product.price)).includes(query) ||
      normalizeText(product.price.toFixed(2)).includes(query);

    if (!matchesSearch) {
      return false;
    }

    if (activeCategory === "favorites") {
      return favorites.includes(product.id);
    }

    if (activeCategory === "all") {
      return true;
    }

    return product.categoryId === activeCategory;
  });

  const subtotal = cart.reduce((sum, item) => sum + getCartItemTotal(item, productMap), 0);
  const total = subtotal + data.theme.deliveryFee;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const customizerProduct = customizer ? productMap.get(customizer.productId) : undefined;
  const customizerState = customizer;
  const customizerTotal = customizerProduct && customizerState
    ? (getProductBasePrice(customizerProduct, productMap, customizerState.halfHalfProductId) +
        getItemAddOnTotal(customizerProduct, customizerState.selectedAddOns)) *
      customizerState.quantity
    : 0;

  const canCheckout =
    cart.length > 0 &&
    subtotal >= data.theme.minOrder &&
    checkout.customerName.trim() &&
    checkout.address.trim() &&
    (status.isOpen || checkout.scheduleTime.trim());

  const themeVars: CSSProperties = {
    ["--theme-primary" as string]: data.theme.primaryColor,
    ["--theme-secondary" as string]: data.theme.secondaryColor,
    ["--theme-accent" as string]: data.theme.accentColor,
    ["--theme-surface" as string]: data.theme.surfaceColor,
  };

  const groupedProducts = activeCategories
    .map((category) => ({
      category,
      products: filteredProducts.filter((product) => product.categoryId === category.id),
    }))
    .filter((group) => group.products.length > 0);

  const openCustomizerForProduct = (product: Product) => {
    setCustomizer({
      productId: product.id,
      quantity: 1,
      notes: "",
      halfHalfProductId: "",
      selectedAddOns: Object.fromEntries(product.groups.map((group) => [group.id, []])),
    });
  };

  const toggleFavorite = (productId: string) => {
    setFavorites((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
    );
  };

  const addToCart = () => {
    if (!customizer) {
      return;
    }
    if (!customizerProduct) {
      return;
    }
    setCart((current) => [
      ...current,
      {
        id: uid("cart"),
        productId: customizer.productId,
        quantity: customizer.quantity,
        notes: customizer.notes,
        selectedAddOns: customizer.selectedAddOns,
        halfHalfProductId: customizer.halfHalfProductId || undefined,
      },
    ]);
    setCustomizer(null);
    setCartOpen(true);
  };

  const sendOrder = () => {
    if (!cart.length) {
      window.alert("Adicione itens ao carrinho antes de enviar.");
      return;
    }
    if (subtotal < data.theme.minOrder) {
      window.alert(`O pedido mínimo é ${formatCurrency(data.theme.minOrder)}.`);
      return;
    }
    if (!checkout.customerName.trim() || !checkout.address.trim()) {
      window.alert("Preencha nome e endereço para continuar.");
      return;
    }
    if (!status.isOpen && !checkout.scheduleTime.trim()) {
      window.alert("A loja está fechada. Escolha um horário de agendamento.");
      return;
    }

    openWhatsApp(
      data.theme.whatsapp,
      buildOrderMessage({
        store: data,
        cart,
        checkout,
        status,
      }),
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900" style={themeVars}>
      <div
        className="absolute inset-x-0 top-0 h-[520px]"
        style={{
          background: `linear-gradient(180deg, ${data.theme.primaryColor} 0%, ${data.theme.secondaryColor} 50%, rgba(255,255,255,0) 100%)`,
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[2rem] border border-white/40 bg-white/90 shadow-2xl shadow-slate-900/10 backdrop-blur">
          <div className="grid gap-5 px-5 py-5 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-7">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="inline-flex h-14 w-14 items-center justify-center rounded-[1.5rem] text-2xl text-white shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${data.theme.primaryColor}, ${data.theme.secondaryColor})` }}
                >
                  {data.theme.logoEmoji}
                </span>
                <div>
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{data.theme.storeName}</h1>
                  <p className="mt-1 text-sm text-slate-500 sm:text-base">{data.theme.slogan}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Badge tone={status.isOpen ? "success" : "warning"}>{status.isOpen ? "Loja aberta" : "Loja fechada"}</Badge>
                <Badge>{status.isOpen ? status.reason : status.nextOpenText}</Badge>
                <Badge>{`Entrega ${formatCurrency(data.theme.deliveryFee)}`}</Badge>
                <Badge>{`Pedido mínimo ${formatCurrency(data.theme.minOrder)}`}</Badge>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Atendimento em tempo real</p>
                <p className="mt-1 text-sm text-slate-500">
                  {status.isOpen
                    ? "Monte seu pedido e envie direto para o WhatsApp em poucos toques."
                    : `Loja fechada agora. Você ainda pode montar o carrinho e agendar para quando reabrir: ${status.nextOpenText}.`}
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs uppercase tracking-[0.25em] text-white/50">Conversão</span>
                    <h2 className="mt-2 text-2xl font-black">Vitrine mobile-first</h2>
                  </div>
                  <span className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-semibold">iFood style</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="rounded-2xl bg-white/5 p-3">
                    <strong className="block text-lg font-black">{featuredProducts.length}</strong>
                    <span className="text-white/60">Destaques</span>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3">
                    <strong className="block text-lg font-black">{favoriteProducts.length}</strong>
                    <span className="text-white/60">Favoritos</span>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3">
                    <strong className="block text-lg font-black">{activeCategories.length}</strong>
                    <span className="text-white/60">Categorias</span>
                  </div>
                </div>
              </div>
              <a
                href="./admin.html"
                className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Abrir Painel de Controle →
              </a>
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-[2rem] border border-white/60 bg-white/90 p-4 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="relative">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nome ou preço"
                  className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none transition focus:border-slate-400"
                />
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <CategoryChip label="Tudo" active={activeCategory === "all"} onClick={() => setActiveCategory("all")} />
              <CategoryChip
                label={`Favoritos${favoriteProducts.length ? ` (${favoriteProducts.length})` : ""}`}
                active={activeCategory === "favorites"}
                onClick={() => setActiveCategory("favorites")}
              />
              {activeCategories.map((category) => (
                <CategoryChip
                  key={category.id}
                  label={category.name}
                  active={activeCategory === category.id}
                  onClick={() => setActiveCategory(category.id)}
                />
              ))}
            </div>
          </div>
        </section>

        {featuredProducts.length && activeCategory === "all" && !search.trim() ? (
          <section className="mt-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900">Destaques da casa</h2>
                <p className="text-sm text-slate-500">Os campeões de clique e conversão.</p>
              </div>
              <Badge tone="success">Top picks</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavorite={favorites.includes(product.id)}
                  onFavorite={() => toggleFavorite(product.id)}
                  onOpen={() => openCustomizerForProduct(product)}
                  categoryName={data.categories.find((category) => category.id === product.categoryId)?.name ?? ""}
                  theme={data.theme}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6 grid gap-6">
          {activeCategory === "favorites" && !favoriteProducts.length ? (
            <EmptyState
              title="Você ainda não tem favoritos"
              description="Toque no coração dos produtos para montar seu atalho pessoal de recompra."
            />
          ) : null}

          {groupedProducts.map(({ category, products }) => (
            <div key={category.id}>
              {activeCategory === "all" ? (
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{category.name}</h2>
                    <p className="text-sm text-slate-500">{category.description}</p>
                  </div>
                  <Badge>{`${products.length} itens`}</Badge>
                </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={favorites.includes(product.id)}
                    onFavorite={() => toggleFavorite(product.id)}
                    onOpen={() => openCustomizerForProduct(product)}
                    categoryName={category.name}
                    theme={data.theme}
                  />
                ))}
              </div>
            </div>
          ))}

          {!groupedProducts.length ? (
            <EmptyState
              title="Nenhum item encontrado"
              description="Tente outra busca, remova o filtro atual ou consulte outra categoria do cardápio."
            />
          ) : null}
        </section>

        <footer className="mt-8 rounded-[2rem] border border-slate-200 bg-white/80 px-5 py-5 text-sm text-slate-500 shadow-lg backdrop-blur">
          <p>{data.theme.footerText}</p>
        </footer>
      </div>

      {customizer && customizerProduct ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 sm:p-6">
          <div className="max-h-[92vh] w-full overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-w-3xl sm:rounded-[2rem]">
            <div className="max-h-[92vh] overflow-y-auto">
              <img src={customizerProduct.image} alt={customizerProduct.name} className="h-60 w-full object-cover" />
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-black">{customizerProduct.name}</h3>
                    <p className="mt-2 text-sm text-slate-500">{customizerProduct.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomizer(null)}
                    className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                  >
                    Fechar
                  </button>
                </div>

                {customizerProduct.allowHalfAndHalf ? (
                  <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <FieldLabel title="Pizza meio a meio" hint="O valor final usa a média entre os sabores" />
                    <select
                      value={customizer.halfHalfProductId}
                      onChange={(event) =>
                        setCustomizer((current) =>
                          current ? { ...current, halfHalfProductId: event.target.value } : current,
                        )
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Escolher apenas este sabor</option>
                      {data.products
                        .filter(
                          (product) =>
                            product.active &&
                            product.allowHalfAndHalf &&
                            product.categoryId === customizerProduct.categoryId &&
                            product.id !== customizerProduct.id,
                        )
                        .map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} • {formatCurrency((customizerProduct.price + product.price) / 2)}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : null}

                <div className="mt-5 grid gap-4">
                  {customizerProduct.groups.map((group) => {
                    if (!group.options.length || group.maxSelection <= 0) {
                      return null;
                    }
                    const selectedIds = customizer.selectedAddOns[group.id] ?? [];
                    return (
                      <div key={group.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                        <FieldLabel title={group.title} hint={`Escolha até ${group.maxSelection}`} />
                        <div className="grid gap-3">
                          {group.options.map((option) => {
                            const isSelected = selectedIds.includes(option.id);
                            const isDisabled = !isSelected && selectedIds.length >= group.maxSelection;
                            return (
                              <label
                                key={option.id}
                                className={cn(
                                  "flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition",
                                  isSelected
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-200 bg-white text-slate-700",
                                  isDisabled ? "opacity-50" : "",
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    onChange={() =>
                                      setCustomizer((current) => {
                                        if (!current) {
                                          return current;
                                        }
                                        const currentSelections = current.selectedAddOns[group.id] ?? [];
                                        const nextSelections = currentSelections.includes(option.id)
                                          ? currentSelections.filter((id) => id !== option.id)
                                          : [...currentSelections, option.id].slice(0, group.maxSelection);
                                        return {
                                          ...current,
                                          selectedAddOns: {
                                            ...current.selectedAddOns,
                                            [group.id]: nextSelections,
                                          },
                                        };
                                      })
                                    }
                                  />
                                  <span className="text-sm font-semibold">{option.name}</span>
                                </div>
                                <span className="text-sm font-bold">{option.price ? `+ ${formatCurrency(option.price)}` : "Grátis"}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-[120px_1fr]">
                  <div>
                    <FieldLabel title="Quantidade" />
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCustomizer((current) =>
                            current ? { ...current, quantity: Math.max(1, current.quantity - 1) } : current,
                          )
                        }
                        className="rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200"
                      >
                        −
                      </button>
                      <span className="text-lg font-black">{customizer.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCustomizer((current) =>
                            current ? { ...current, quantity: current.quantity + 1 } : current,
                          )
                        }
                        className="rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <FieldLabel title="Observações do item" />
                    <textarea
                      value={customizer.notes}
                      onChange={(event) =>
                        setCustomizer((current) => (current ? { ...current, notes: event.target.value } : current))
                      }
                      rows={4}
                      placeholder="Ex.: sem cebola, ponto da carne, enviar separado..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-950 p-4 text-white sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/50">Subtotal do item</p>
                    <strong className="mt-1 block text-3xl font-black">{formatCurrency(customizerTotal)}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={addToCart}
                    className="rounded-2xl px-5 py-4 text-sm font-semibold text-white shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${data.theme.primaryColor}, ${data.theme.secondaryColor})` }}
                  >
                    Adicionar ao carrinho
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:px-6">
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 rounded-[1.75rem] px-5 py-4 text-left text-white shadow-2xl"
          style={{ background: `linear-gradient(135deg, ${data.theme.primaryColor}, ${data.theme.secondaryColor})` }}
        >
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-white/70">Carrinho dinâmico</span>
            <strong className="mt-1 block text-lg font-black">{totalItems} item(ns) • {formatCurrency(total)}</strong>
          </div>
          <span className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-semibold">Abrir pedido</span>
        </button>
      </div>

      {cartOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/55 p-0 sm:p-6">
          <div className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl sm:rounded-[2rem]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-2xl font-black">Seu pedido</h3>
                <p className="text-sm text-slate-500">
                  {status.isOpen ? "Envio imediato disponível" : `Agendamento liberado • ${status.nextOpenText}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Fechar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid gap-4">
                {cart.map((item) => {
                  const product = productMap.get(item.productId);
                  if (!product) {
                    return null;
                  }
                  const halfHalf = item.halfHalfProductId ? productMap.get(item.halfHalfProductId) : undefined;
                  const addOns = product.groups
                    .map((group) => {
                      const selectedIds = item.selectedAddOns[group.id] ?? [];
                      const selectedOptions = group.options.filter((option) => selectedIds.includes(option.id));
                      if (!selectedOptions.length) {
                        return null;
                      }
                      return `${group.title}: ${selectedOptions.map((option) => option.name).join(", ")}`;
                    })
                    .filter(Boolean);
                  return (
                    <div key={item.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-black text-slate-900">{product.name}</h4>
                          {halfHalf ? <p className="mt-1 text-sm text-slate-500">Meio a meio com {halfHalf.name}</p> : null}
                          {addOns.length ? <p className="mt-2 text-sm text-slate-500">{addOns.join(" • ")}</p> : null}
                          {item.notes ? <p className="mt-2 text-sm text-slate-500">Obs.: {item.notes}</p> : null}
                        </div>
                        <strong className="text-base font-black text-slate-900">{formatCurrency(getCartItemTotal(item, productMap))}</strong>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setCart((current) =>
                                current
                                  .map((currentItem) =>
                                    currentItem.id === item.id
                                      ? { ...currentItem, quantity: Math.max(1, currentItem.quantity - 1) }
                                      : currentItem,
                                  )
                                  .filter((currentItem) => currentItem.quantity > 0),
                              )
                            }
                            className="rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200"
                          >
                            −
                          </button>
                          <span className="min-w-8 text-center text-sm font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setCart((current) =>
                                current.map((currentItem) =>
                                  currentItem.id === item.id
                                    ? { ...currentItem, quantity: currentItem.quantity + 1 }
                                    : currentItem,
                                ),
                              )
                            }
                            className="rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCart((current) => current.filter((currentItem) => currentItem.id !== item.id))}
                          className="rounded-2xl bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-600"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!cart.length ? (
                <div className="mt-4">
                  <EmptyState
                    title="Seu carrinho está vazio"
                    description="Adicione produtos do cardápio para montar o pedido e finalizar pelo WhatsApp."
                  />
                </div>
              ) : null}

              <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <h4 className="text-xl font-black">Dados do pedido</h4>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel title="Nome" />
                    <input
                      value={checkout.customerName}
                      onChange={(event) => setCheckout((current) => ({ ...current, customerName: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                  <div>
                    <FieldLabel title="Telefone" />
                    <input
                      value={checkout.phone}
                      onChange={(event) => setCheckout((current) => ({ ...current, phone: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel title="Endereço" />
                    <input
                      value={checkout.address}
                      onChange={(event) => setCheckout((current) => ({ ...current, address: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel title="Bairro / referência" />
                    <input
                      value={checkout.neighborhood}
                      onChange={(event) => setCheckout((current) => ({ ...current, neighborhood: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                  <div>
                    <FieldLabel title="Pagamento" />
                    <select
                      value={checkout.paymentMethod}
                      onChange={(event) => setCheckout((current) => ({ ...current, paymentMethod: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    >
                      <option>PIX</option>
                      <option>Cartão na entrega</option>
                      <option>Dinheiro</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel title="Troco para" hint="Se pagar em dinheiro" />
                    <input
                      value={checkout.changeFor}
                      onChange={(event) => setCheckout((current) => ({ ...current, changeFor: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                  {!status.isOpen ? (
                    <div className="sm:col-span-2">
                      <FieldLabel title="Agendar pedido" hint="Obrigatório enquanto a loja estiver fechada" />
                      <input
                        type="datetime-local"
                        value={checkout.scheduleTime}
                        onChange={(event) => setCheckout((current) => ({ ...current, scheduleTime: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                      />
                    </div>
                  ) : null}
                  <div className="sm:col-span-2">
                    <FieldLabel title="Observações gerais" />
                    <textarea
                      value={checkout.orderNotes}
                      onChange={(event) => setCheckout((current) => ({ ...current, orderNotes: event.target.value }))}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white p-5">
              <div className="rounded-[1.75rem] bg-slate-950 p-4 text-white">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span>Subtotal</span>
                    <strong>{formatCurrency(subtotal)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Entrega</span>
                    <strong>{formatCurrency(data.theme.deliveryFee)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-base font-black">
                    <span>Total</span>
                    <strong>{formatCurrency(total)}</strong>
                  </div>
                </div>
                {subtotal < data.theme.minOrder ? (
                  <p className="mt-3 rounded-2xl bg-amber-500/15 px-4 py-3 text-sm font-semibold text-amber-100">
                    Pedido mínimo: {formatCurrency(data.theme.minOrder)}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={sendOrder}
                  disabled={!canCheckout}
                  className="mt-4 w-full rounded-2xl px-5 py-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${data.theme.primaryColor}, ${data.theme.secondaryColor})` }}
                >
                  {status.isOpen ? "Enviar pedido pelo WhatsApp" : "Agendar pedido pelo WhatsApp"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProductCard({
  product,
  isFavorite,
  onFavorite,
  onOpen,
  categoryName,
  theme,
}: {
  product: Product;
  isFavorite: boolean;
  onFavorite: () => void;
  onOpen: () => void;
  categoryName: string;
  theme: ThemeSettings;
}) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-lg shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="relative">
        <img src={product.image} alt={product.name} className="h-52 w-full object-cover" />
        <button
          type="button"
          onClick={onFavorite}
          className="absolute right-4 top-4 rounded-2xl bg-white/90 px-3 py-2 text-lg shadow-lg backdrop-blur transition hover:scale-105"
          aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          {isFavorite ? "❤️" : "🤍"}
        </button>
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">{categoryName}</span>
          {product.allowHalfAndHalf ? (
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900">Meio a meio</span>
          ) : null}
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-900">{product.name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{product.description}</p>
          </div>
          <strong className="text-lg font-black text-slate-900">{formatCurrency(product.price)}</strong>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="mt-5 w-full rounded-[1.25rem] px-5 py-4 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
          style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
        >
          Montar pedido
        </button>
      </div>
    </article>
  );
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full px-4 py-3 text-sm font-semibold transition",
        active ? "bg-slate-900 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
      )}
    >
      {label}
    </button>
  );
}

export default function App() {
  const isAdmin = typeof window !== "undefined" && window.location.pathname.includes("admin.html");
  const [data, setData] = useState<StoreData | null>(null);
  const [seedData, setSeedData] = useState<StoreData>(DEFAULT_DATA);
  const initializedRef = useRef(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      let seed = DEFAULT_DATA;
      try {
        const response = await fetch("./products.json", { cache: "no-store" });
        if (response.ok) {
          const json = (await response.json()) as StoreData;
          seed = sanitizeStoreData(json);
        }
      } catch {
        seed = DEFAULT_DATA;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      let next = seed;
      if (stored) {
        try {
          next = sanitizeStoreData(JSON.parse(stored) as StoreData);
        } catch {
          next = seed;
        }
      }

      if (active) {
        setSeedData(seed);
        setData(next);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!data) {
      return;
    }
    document.title = isAdmin ? `${data.theme.storeName} • Painel Admin` : data.theme.storeName;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    initializedRef.current = true;
  }, [data, isAdmin]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) {
        return;
      }
      try {
        setData(sanitizeStoreData(JSON.parse(event.newValue) as StoreData));
      } catch {
        // ignore malformed storage updates
      }
    };

    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  if (!data) {
    return <LoadingScreen />;
  }

  return isAdmin ? <AdminPage data={data} seedData={seedData} onChange={setData} /> : <CustomerPage data={data} />;
}
