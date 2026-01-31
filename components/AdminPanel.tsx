import React, { useState, useEffect } from 'react';
import { db, DB_ROOT } from '../firebase';
import { ref, push, remove, update, onValue, get } from 'firebase/database';
import { Product, Order } from '../types';
import { Plus, X } from './Icons';
import toast from 'react-hot-toast';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  
  // Product Form State
  const [pName, setPName] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pImg, setPImg] = useState('');
  const [pCategory, setPCategory] = useState('');
  const [pSizes, setPSizes] = useState('');
  const [pColors, setPColors] = useState<{img: string, hex: string}[]>([]);
  
  // Data for suggestions
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Load Orders
  useEffect(() => {
    const ordersRef = ref(db, `${DB_ROOT}/orders`);
    const unsub = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val
        })).reverse();
        setOrders(list);
      } else {
        setOrders([]);
      }
    });
    return () => unsub();
  }, []);

  // Load existing categories from products
  useEffect(() => {
    const productsRef = ref(db, `${DB_ROOT}/products`);
    get(productsRef).then((snapshot) => {
        if(snapshot.exists()) {
            const data = snapshot.val();
            const cats = new Set<string>();
            Object.values(data).forEach((p: any) => {
                if(p.category) cats.add(p.category);
            });
            setExistingCategories(Array.from(cats));
        }
    });
  }, []);

  const handleAddColor = () => {
    setPColors([...pColors, { img: '', hex: '#000000' }]);
  };

  const updateColor = (index: number, field: 'img' | 'hex', value: string) => {
    const newColors = [...pColors];
    newColors[index] = { ...newColors[index], [field]: value };
    setPColors(newColors);
  };

  const removeColor = (index: number) => {
    setPColors(pColors.filter((_, i) => i !== index));
  };

  const handleAddProduct = async () => {
    if (!pName || !pPrice || !pImg) {
      toast.error("البيانات ناقصة");
      return;
    }
    const cat = pCategory.trim() || 'New Arrival';
    try {
      await push(ref(db, `${DB_ROOT}/products`), {
        name: pName,
        price: Number(pPrice),
        image: pImg,
        category: cat,
        sizes: pSizes.split(',').map(s => s.trim()).filter(Boolean),
        colors: pColors
      });
      toast.success("تم إضافة المنتج بنجاح");
      
      // Update local categories list if new
      if(!existingCategories.includes(cat)) {
          setExistingCategories([...existingCategories, cat]);
      }

      // Reset
      setPName(''); setPPrice(''); setPImg(''); setPSizes(''); setPColors([]); setPCategory('');
    } catch (error) {
      toast.error("حدث خطأ");
    }
  };

  const processOrder = async (order: Order, status: string) => {
    try {
        await update(ref(db, `${DB_ROOT}/orders/${order.id}`), { status });
        
        const itemsList = order.items.map(i => 
            `🛍️ *${i.name}*\n📏 المقاس: ${i.sz}\n🎨 اللون: ${i.hex}\n🔢 الكمية: ${i.qty}`
        ).join('\n\n');

        const message = 
`✨ *تحديث بخصوص طلبك من Es Store* ✨

أهلاً يا ${order.shipping.name} 👋

نود إبلاغك بأن طلبك الآن حالته: *${status}* ✅

📦 *تفاصيل المنتجات:*
${itemsList}

---
💰 *إجمالي المبلغ:* ${order.total} EGP
📍 *عنوان الشحن:* ${order.shipping.address}
📞 *رقم التواصل:* ${order.shipping.phone}

🚚 المندوب سيتواصل معك قريباً لتسليم الطلب. شكراً لثقتك في Es Store! 🖤`;

        const whatsappUrl = `https://wa.me/${order.shipping.phone.replace('+', '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        toast.success(`تم تحديث الطلب: ${status}`);
    } catch (e) {
        toast.error("خطأ في التحديث");
    }
  };

  const deleteOrder = async (id: string) => {
      if(window.confirm("حذف الطلب نهائياً؟")) {
          await remove(ref(db, `${DB_ROOT}/orders/${id}`));
          toast.success("تم الحذف");
      }
  };

  return (
    <div className="w-full bg-zinc-900 border-b-[12px] border-black text-white p-6 animate-in slide-in-from-top duration-500 shadow-2xl relative z-[200]">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black uppercase tracking-widest text-zinc-500">لوحة التحكم</h2>
            <div className="flex gap-4">
                <button onClick={() => setActiveTab('products')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'products' ? 'bg-white text-black scale-105' : 'bg-zinc-800 hover:bg-zinc-700'}`}>المنتجات</button>
                <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'orders' ? 'bg-white text-black scale-105' : 'bg-zinc-800 hover:bg-zinc-700'}`}>الطلبات</button>
            </div>
        </div>

        {activeTab === 'products' && (
            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 max-w-2xl mx-auto space-y-4 text-right backdrop-blur-sm" dir="rtl">
                <h3 className="text-xl font-bold mb-4">إضافة منتج جديد</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <input value={pName} onChange={e => setPName(e.target.value)} placeholder="اسم المنتج" className="w-full bg-white/5 p-4 rounded-2xl outline-none focus:bg-white/10 focus:ring-2 ring-white/20 transition" />
                     <div className="relative">
                         <input 
                            value={pCategory} 
                            onChange={e => setPCategory(e.target.value)} 
                            list="categories-list"
                            placeholder="الفئة (مثال: شتوي)" 
                            className="w-full bg-white/5 p-4 rounded-2xl outline-none focus:bg-white/10 focus:ring-2 ring-white/20 transition" 
                         />
                         <datalist id="categories-list">
                             {existingCategories.map(c => <option key={c} value={c} />)}
                         </datalist>
                     </div>
                </div>

                <div className="flex gap-4">
                    <input value={pPrice} onChange={e => setPPrice(e.target.value)} type="number" placeholder="السعر" className="w-1/2 bg-white/5 p-4 rounded-2xl outline-none focus:bg-white/10 transition" />
                    <input value={pSizes} onChange={e => setPSizes(e.target.value)} placeholder="المقاسات (S, M, L)" className="w-1/2 bg-white/5 p-4 rounded-2xl outline-none focus:bg-white/10 transition" />
                </div>
                <input value={pImg} onChange={e => setPImg(e.target.value)} placeholder="رابط الصورة الرئيسية" className="w-full bg-white/5 p-4 rounded-2xl outline-none focus:bg-white/10 transition" />
                
                <div className="space-y-2 bg-black/20 p-4 rounded-2xl">
                    <p className="text-xs text-zinc-400 mb-2">الألوان (اختياري)</p>
                    {pColors.map((c, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-zinc-800/50 p-2 rounded-xl animate-in fade-in slide-in-from-right">
                             <input value={c.img} onChange={e => updateColor(idx, 'img', e.target.value)} placeholder="رابط صورة اللون" className="flex-1 bg-transparent p-2 text-xs outline-none" />
                             <input type="color" value={c.hex} onChange={e => updateColor(idx, 'hex', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" />
                             <button onClick={() => removeColor(idx)} className="text-red-500 hover:bg-red-500/20 p-1 rounded-full"><X className="w-4 h-4" /></button>
                        </div>
                    ))}
                    <button onClick={handleAddColor} className="text-xs font-bold text-blue-400 flex items-center gap-1 mt-2 hover:text-blue-300 transition-colors">
                        <Plus className="w-3 h-3" /> إضافة لون
                    </button>
                </div>

                <button onClick={handleAddProduct} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg hover:shadow-white/20">نشر المنتج</button>
            </div>
        )}

        {activeTab === 'orders' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" dir="rtl">
                {orders.map(order => (
                    <div key={order.id} className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${order.status === 'تم التوصيل' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>{order.status}</span>
                            <span className="font-black text-white">{order.total} EGP</span>
                        </div>
                        <div className="space-y-2 text-sm text-zinc-400 mb-4">
                            <p><strong className="text-zinc-300">العميل:</strong> {order.shipping.name}</p>
                            <p><strong className="text-zinc-300">الهاتف:</strong> {order.shipping.phone}</p>
                            <p><strong className="text-zinc-300">العنوان:</strong> {order.shipping.address}</p>
                            <div className="bg-black/20 p-3 rounded-xl mt-2 max-h-32 overflow-y-auto custom-scrollbar">
                                {order.items.map((item, i) => (
                                    <p key={i} className="text-xs text-zinc-500 mb-1 border-b border-white/5 pb-1 last:border-0">
                                        {item.name} ({item.qty}) <br /> 
                                        <span className="text-[10px]">{item.sz} - {item.hex}</span>
                                    </p>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => processOrder(order, 'تم التوصيل')} className="flex-1 bg-green-600/20 text-green-400 py-2 rounded-xl text-xs font-bold hover:bg-green-600/30 transition-colors">تأكيد وتوصيل 🟢</button>
                            <button onClick={() => deleteOrder(order.id)} className="px-4 bg-red-900/20 text-red-400 rounded-xl text-xs font-bold hover:bg-red-900/30 transition-colors">حذف</button>
                        </div>
                    </div>
                ))}
                {orders.length === 0 && <p className="text-center col-span-full text-zinc-600">لا توجد طلبات حالياً</p>}
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;