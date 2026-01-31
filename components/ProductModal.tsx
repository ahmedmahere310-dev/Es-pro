import React, { useState, useEffect } from 'react';
import { Product, CartItem } from '../types';
import { X, Share, QrCode } from './Icons';
import QRCode from 'react-qr-code';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  onBuyNow: (item: CartItem) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onAddToCart, onBuyNow }) => {
  const [selectedImg, setSelectedImg] = useState(product.image);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "");
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || { img: product.image, hex: "Default" });
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    setSelectedImg(product.image);
    setSelectedSize(product.sizes[0] || "");
    if (product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
      setSelectedImg(product.colors[0].img);
    }
  }, [product]);

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}?product=${product.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Es Store', text: 'Check out this product!', url });
      } catch (err) {
        console.error(err);
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("تم نسخ الرابط 🔗");
    }
  };

  const createItem = (): CartItem => ({
    name: product.name,
    price: product.price,
    sz: selectedSize,
    img: selectedImg,
    hex: selectedColor.hex,
    qty: 1
  });

  return (
    <div className="fixed inset-0 z-[2500] flex items-end md:items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose}></div>
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-zinc-900 w-full max-w-6xl md:h-[85vh] h-[92vh] md:rounded-[4rem] rounded-t-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in slide-in-from-bottom duration-500">
        
        <button onClick={onClose} className="absolute top-6 right-6 z-50 bg-white/80 dark:bg-zinc-800 p-2 rounded-full shadow-lg dark:text-white hover:scale-110 transition-transform">
          <X />
        </button>

        {/* Image Section (Fixed Height on Mobile) */}
        <div className="w-full md:w-1/2 h-[45%] md:h-full bg-zinc-50 dark:bg-zinc-800/50 p-6 flex flex-col items-center justify-center relative flex-shrink-0">
          <div className="w-full h-full md:h-[80%] max-w-sm aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-white shadow-2xl relative">
             <img src={selectedImg} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 md:static md:mt-6 pointer-events-none md:pointer-events-auto">
             <button onClick={handleShare} className="pointer-events-auto flex items-center gap-2 bg-white/90 dark:bg-zinc-700/90 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-sm font-black text-[10px] uppercase tracking-widest dark:text-white transition-transform active:scale-95 hover:shadow-lg">
               <Share className="w-4 h-4" /> مشاركة
             </button>
             <button onClick={() => setShowQr(true)} className="pointer-events-auto flex items-center justify-center bg-white/90 dark:bg-zinc-700/90 backdrop-blur-sm w-12 h-12 rounded-2xl shadow-sm dark:text-white transition-transform active:scale-95 hover:shadow-lg">
               <QrCode className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Details Section (Scrollable) */}
        <div className="w-full md:w-1/2 flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-900">
          <div className="p-8 md:p-16 flex flex-col min-h-full">
            
            <div className="mb-8 text-right">
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 block mb-2">Es Store Premium</span>
               {product.category && <span className="inline-block px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-[10px] rounded-full font-bold mb-3 dark:text-zinc-300">{product.category}</span>}
               <h3 className="text-3xl md:text-5xl font-black italic logo-font my-2 dark:text-white leading-tight">{product.name}</h3>
               <p className="text-2xl font-black text-gold italic mt-2">{product.price.toLocaleString()} EGP</p>
            </div>

            {/* Colors */}
            {product.colors.length > 0 && (
              <div className="mb-8 text-right">
                <p className="text-[10px] font-black uppercase text-zinc-400 mb-4 tracking-[0.2em]">الألوان المتاحة</p>
                <div className="flex flex-wrap gap-4 justify-end">
                  {product.colors.map((c, i) => (
                    <div 
                      key={i}
                      onClick={() => { setSelectedColor(c); setSelectedImg(c.img); }}
                      className={`w-12 h-12 rounded-full border-[3px] cursor-pointer transition-all hover:scale-110 shadow-sm ${selectedColor.hex === c.hex ? 'border-black dark:border-white scale-110 shadow-md ring-2 ring-zinc-200 dark:ring-zinc-700' : 'border-transparent'}`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div className="mb-10 text-right">
                 <p className="text-[10px] font-black uppercase text-zinc-400 mb-4 tracking-[0.2em]">المقاس</p>
                 <div className="flex flex-wrap gap-3 justify-end">
                   {product.sizes.map(s => (
                     <button 
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`min-w-[4rem] px-6 py-3 rounded-2xl border-2 font-black transition-all active:scale-95 ${selectedSize === s ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-lg' : 'border-zinc-200 dark:border-zinc-700 dark:text-white hover:border-black dark:hover:border-white'}`}
                     >
                       {s}
                     </button>
                   ))}
                 </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4 mt-auto pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={() => onBuyNow(createItem())} className="w-full bg-black dark:bg-white dark:text-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:opacity-90 transition-all hover:shadow-xl active:scale-[0.98]">
                شراء الآن
              </button>
              <button onClick={() => onAddToCart(createItem())} className="w-full bg-transparent border-2 border-zinc-200 dark:border-zinc-700 dark:text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors active:scale-[0.98]">
                إضافة للسلة
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Modal Overlay */}
      {showQr && (
        <div className="fixed inset-0 z-[2600] bg-black/80 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowQr(false)}>
           <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] text-center space-y-6 max-w-xs w-full animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
              <h4 className="font-black italic text-xl dark:text-white logo-font">Scan Me</h4>
              <div className="bg-white p-4 rounded-2xl inline-block">
                <QRCode value={`${window.location.origin}${window.location.pathname}?product=${product.id}`} size={180} />
              </div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">امسح الكود لفتح المنتج مباشرة</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProductModal;