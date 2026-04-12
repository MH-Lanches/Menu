import { MenuItem } from "../data/menu";

interface MenuCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

export default function MenuCard({ item, onAdd }: MenuCardProps) {
  const discount = item.originalPrice
    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
    : null;

  return (
    <div className="card-hover bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 flex flex-col">
      {/* Image area */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-4 flex items-center justify-center h-44">
        {/* Discount badge */}
        {discount && (
          <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow">
            -{discount}%
          </div>
        )}
        {/* Category badge */}
        {item.badge && (
          <div className={`absolute top-3 right-3 ${item.badgeColor} text-white text-xs font-bold px-2.5 py-1 rounded-full shadow`}>
            {item.badge}
          </div>
        )}

        <img
          src={item.image}
          alt={item.name}
          className="h-36 w-36 object-contain drop-shadow-xl hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm px-2 py-0.5">
          <p className="text-[8px] text-white/40 text-center leading-tight">Imagem meramente ilustrativa.</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-black text-gray-900 text-base leading-tight">{item.name}</h3>
        <p className="text-gray-500 text-xs mt-1 leading-relaxed flex-1 line-clamp-2">{item.description}</p>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 font-semibold">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {item.rating}
          </span>
          <span>({item.reviews})</span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {item.time}
          </span>
        </div>

        {/* Price + Add button */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-gray-900">
                R$ {item.price.toFixed(2).replace(".", ",")}
              </span>
            </div>
            {item.originalPrice && (
              <div className="text-xs text-gray-400 line-through font-medium">
                R$ {item.originalPrice.toFixed(2).replace(".", ",")}
              </div>
            )}
          </div>

          <button
            onClick={() => onAdd(item)}
            className="btn-shine w-11 h-11 bg-gradient-to-br from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200 transition-all hover:scale-110 active:scale-95"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
