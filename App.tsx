import React, { useState, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { db, auth, DB_ROOT } from './firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { ref, onValue, set, get, push, remove } from 'firebase/database';
import { Product, UserProfile, CartItem, Order } from './types';
import { ShoppingBag, Moon, Sun, LogOut } from './components/Icons';

import AdminPanel from './components/AdminPanel';
import ProductModal from './components/ProductModal';

// Declare EmailJS global
declare const emailjs: any;

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authStep, setAuthStep] = useState(1);
  const [loginName, setLoginName] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  
  // UI State
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState<'home' | 'orders'>('home');
  const [showAdmin, setShowAdmin] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Checkout State
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]); // Items being bought
  const [shipName, setShipName] = useState('');
  const [shipPhone, setShipPhone] = useState('');
  const [shipAddress, setShipAddress] = useState('');

  // --- Derived State ---
  const categories = useMemo(() => {
     const cats = new Set<string>(['All']);
     products.forEach(p => p.category ? cats.add(p.category) : cats.add('Other'));
     return Array.from(cats);
  }, [products]);

  const filteredProducts = useMemo(() => {
     if(selectedCategory === 'All') return products;
     return products.filter(p => (p.category || 'Other') === selectedCategory);
  }, [products, selectedCategory]);

  // --- Effects ---

  // Theme Init
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Theme Toggle
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Auth Listener
  useEffect(() => {
    const savedUser = localStorage.getItem('es_session_v4');
    if (savedUser) {
        onValue(ref(db, `${DB_ROOT}/users/${savedUser}`), (snap) => {
            const data = snap.val();
            if(data) setUser(data);
        });
    }
  }, []);

  // Load Products
  useEffect(() => {
    const pRef = ref(db, `${DB_ROOT}/products`);
    return onValue(pRef, (snap) => {
        const data = snap.val();
        if(data) {
            const arr = Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse();
            setProducts(arr);
        } else setProducts([]);
    });
  }, []);

  // Load My Orders
  useEffect(() => {
      if(!user) return;
      const oRef = ref(db, `${DB_ROOT}/orders`);
      return onValue(oRef, (snap) => {
          const data = snap.val();
          if(data) {
              const arr = Object.keys(data)
                .map(key => ({ id: key, ...data[key] }))
                .filter((o: any) => o.userName === user.name)
                .reverse();
              setMyOrders(arr as Order[]);
          } else setMyOrders([]);
      });
  }, [user]);

  // Deep Link Check
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('product');
    if (pid && products.length > 0) {
        const p = products.find(prod => prod.id === pid);
        if (p) setSelectedProduct(p);
    }
  }, [products]);

  // --- Handlers ---

  const handleLogin = async () => {
      if(!loginName) return;
      if(authStep === 1) {
          setAuthStep(2);
          return;
      }
      // Step 2
      try {
          const userRef = ref(db, `${DB_ROOT}/users/${loginName}`);
          const snap = await get(userRef);
          
          if(!snap.exists()) {
              await signInAnonymously(auth);
              const newUser: UserProfile = { name: loginName, role: loginName.toLowerCase() === 'admin' ? 'admin' : 'user' };
              await set(userRef, { ...newUser, password: loginPass });
              setUser(newUser);
          } else {
              if(snap.val().password !== loginPass) {
                  toast.error("كلمة المرور خاطئة");
                  return;
              }
              setUser(snap.val());
          }
          localStorage.setItem('es_session_v4', loginName);
          toast.success(`أهلاً بك ${loginName}`);
      } catch(e) {
          toast.error("حدث خطأ في التسجيل");
      }
  };

  const logout = () => {
      localStorage.removeItem('es_session_v4');
      window.location.reload();
  };

  const addToCart = (item: CartItem) => {
      setCart([...cart, item]);
      toast.success("تمت الإضافة للسلة");
  };

  const buyNow = (item: CartItem) => {
      setCheckoutItems([item]);
      setShowCheckout(true);
      if(selectedProduct) setSelectedProduct(null); // Close modal if open
  };

  const checkoutCart = () => {
      if(cart.length === 0) return;
      setCheckoutItems(cart);
      setShowCheckout(true);
      setCartOpen(false);
  };

  const submitOrder = async () => {
      if(!shipName || !shipPhone || !shipAddress) {
          toast.error("أكمل البيانات");
          return;
      }
      
      const total = checkoutItems.reduce((acc, i) => acc + (i.price * i.qty), 0);
      const orderData = {
          userName: user?.name,
          items: checkoutItems,
          total,
          shipping: { name: shipName, phone: "+20" + shipPhone, address: shipAddress },
          status: 'Processing',
          timestamp: Date.now()
      };

      try {
          await push(ref(db, `${DB_ROOT}/orders`), orderData);
          
          // Send Email
          emailjs.send("service_7d06dp2", "template_lqgeexy", {
            customer_name: shipName,
            user_login: user?.name,
            customer_phone: "+20" + shipPhone,
            customer_address: shipAddress,
            order_items: checkoutItems.map(i=>`${i.name} (Size: ${i.sz}, Color: ${i.hex})`).join(', '),
            total_price: total + " EGP"
          });

          toast.success("تم إرسال الطلب بنجاح 🚀");
          if(checkoutItems.length === cart.length && checkoutItems[0] === cart[0]) {
             setCart([]); // Clear cart if it was a cart checkout
          }
          setShowCheckout(false);
          setShipName(''); setShipPhone(''); setShipAddress('');
          setView('orders');
      } catch(e) {
          toast.error("خطأ في الطلب");
      }
  };

  const deleteProduct = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(window.confirm("حذف المنتج؟")) {
          await remove(ref(db, `${DB_ROOT}/products/${id}`));
      }
  };

  // --- Render ---

  if (!user) {
    return (
      <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 text-white text-center bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url('https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')" }}>
        <div className="w-full max-w-sm bg-white/5 backdrop-blur-2xl p-10 rounded-[3.5rem] border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-500">
          <h1 className="logo-font text-8xl italic font-black mb-10 text-white">Es</h1>
          
          <div className="space-y-4">
              {authStep === 1 ? (
                  <input 
                    type="text" 
                    placeholder="اسم المستخدم" 
                    className="w-full p-5 rounded-2xl bg-white/10 text-center outline-none border border-white/5 text-white placeholder-white/50 focus:bg-white/20 transition-all"
                    value={loginName}
                    onChange={e => setLoginName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  />
              ) : (
                  <input 
                    type="password" 
                    placeholder="كلمة المرور" 
                    className="w-full p-5 rounded-2xl bg-white/10 text-center outline-none border border-white/5 text-white placeholder-white/50 focus:bg-white/20 transition-all animate-in slide-in-from-right"
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  />
              )}
              
              <button onClick={handleLogin} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  {authStep === 1 ? 'متابعة' : 'دخول / تسجيل'}
              </button>
          </div>
        </div>
        <Toaster position="top-center" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-cairo">
      <Toaster 
         position="top-center" 
         toastOptions={{
             style: {
                 borderRadius: '1.5rem',
                 background: darkMode ? '#333' : '#fff',
                 color: darkMode ? '#fff' : '#000',
             }
         }}
      />

      {/* Header */}
      <header className="sticky top-0 z-[100] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-b border-gray-100 dark:border-zinc-900 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center w-full">
            <div className="flex items-center gap-6">
                <span className="logo-font text-4xl font-black italic cursor-pointer" onClick={() => { setView('home'); setShowAdmin(false); }}>Es</span>
                <button onClick={toggleTheme} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full transition-colors active:scale-95">
                    {darkMode ? <Sun className="w-5 h-5 text-gold" /> : <Moon className="w-5 h-5 text-zinc-600" />}
                </button>
            </div>
            
            <div className="flex items-center gap-4">
                {user.role === 'admin' && (
                    <button onClick={() => setShowAdmin(!showAdmin)} className="bg-black dark:bg-white dark:text-black text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-transform hidden md:block">
                        Dashboard
                    </button>
                )}
                <button onClick={() => setCartOpen(true)} className="relative p-3 bg-gray-50 dark:bg-zinc-800 rounded-full transition-all hover:bg-gray-200 dark:hover:bg-zinc-700 active:scale-95">
                    <ShoppingBag className="w-5 h-5 dark:text-white" />
                    {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black animate-bounce">
                            {cart.length}
                        </span>
                    )}
                </button>
                <button onClick={logout} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </div>
      </header>

      {/* Admin Panel */}
      {showAdmin && user.role === 'admin' && (
          <AdminPanel onClose={() => setShowAdmin(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 w-full">
         {view === 'home' && !showAdmin && (
             <>
                {/* Hero */}
                <div className="relative h-[60vh] w-full overflow-hidden">
                    <img src="https://images.pexels.com/photos/1884581/pexels-photo-1884581.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-1000" alt="Hero" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/80 flex flex-col items-center justify-center text-white text-center px-6">
                        <span className="text-[10px] font-black uppercase tracking-[0.6em] mb-4 opacity-70 animate-in slide-in-from-top duration-700 delay-100">Es Store Official</span>
                        <h2 className="logo-font text-6xl md:text-8xl italic font-black mb-6 animate-in zoom-in duration-700 delay-200">Style is Eternal</h2>
                        <button onClick={() => document.getElementById('products-grid')?.scrollIntoView({behavior:'smooth'})} className="mt-10 px-10 py-5 bg-white text-black rounded-full font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] animate-in slide-in-from-bottom duration-700 delay-300">
                            Shop Collection
                        </button>
                    </div>
                </div>

                {/* Categories & Products */}
                <div id="products-grid" className="max-w-7xl mx-auto px-6 py-20 min-h-[60vh]">
                    
                    {/* Category Filter */}
                    <div className="flex gap-4 overflow-x-auto pb-8 justify-center custom-scrollbar mb-8">
                       {categories.map(cat => (
                           <button 
                             key={cat}
                             onClick={() => setSelectedCategory(cat)}
                             className={`px-6 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all border ${selectedCategory === cat ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white scale-110 shadow-lg' : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-800 dark:text-zinc-400 hover:border-black dark:hover:border-white'}`}
                           >
                              {cat}
                           </button>
                       ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-12">
                        {filteredProducts.map(p => (
                            <div key={p.id} onClick={() => { setSelectedProduct(p); window.history.pushState({}, '', `?product=${p.id}`); }} className="group cursor-pointer animate-in fade-in zoom-in duration-500">
                                <div className="aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-gray-50 dark:bg-zinc-800 relative shadow-sm hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                                    <img src={p.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={p.name} />
                                    {p.category && <span className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-[9px] px-3 py-1 rounded-full uppercase tracking-wider font-bold">{p.category}</span>}
                                    {user.role === 'admin' && (
                                        <button onClick={(e) => deleteProduct(p.id, e)} className="absolute top-4 right-4 bg-red-600/80 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm z-10 transition-colors">×</button>
                                    )}
                                </div>
                                <div className="mt-5 px-2 text-center">
                                    <h4 className="font-black italic text-lg uppercase dark:text-white group-hover:text-gold transition-colors">{p.name}</h4>
                                    <p className="text-zinc-400 font-bold text-sm mt-1">{p.price.toLocaleString()} EGP</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredProducts.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-2xl font-black text-zinc-300 italic">No items found in this category.</p>
                        </div>
                    )}
                </div>
             </>
         )}

         {view === 'orders' && (
             <div className="max-w-3xl mx-auto px-6 py-12 min-h-[60vh]">
                 <h2 className="text-4xl font-black italic logo-font mb-12 text-center dark:text-white">Order History</h2>
                 <div className="space-y-4">
                     {myOrders.map(o => (
                         <div key={o.id} className="bg-gray-50 dark:bg-zinc-800 p-6 rounded-[2rem] flex justify-between items-center text-right shadow-sm border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all animate-in slide-in-from-bottom">
                            <div>
                                <p className="font-black text-xs uppercase dark:text-white">{o.items.map(i => i.name).join(', ')}</p>
                                <p className={`text-[10px] mt-2 uppercase font-bold tracking-widest inline-block px-2 py-1 rounded-md ${o.status === 'تم التوصيل' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                    {o.status}
                                </p>
                            </div>
                            <div className="font-black dark:text-white text-lg">{o.total} EGP</div>
                        </div>
                     ))}
                     {myOrders.length === 0 && <p className="text-center text-zinc-400">No orders yet.</p>}
                 </div>
             </div>
         )}
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-[90] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-gray-100 dark:border-zinc-800 flex justify-around py-4 md:hidden">
          <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 pb-1 transition-colors ${view === 'home' ? 'text-black dark:text-white border-b-2 border-black dark:border-white' : 'text-zinc-400'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest">Store</span>
          </button>
          <button onClick={() => setView('orders')} className={`flex flex-col items-center gap-1 pb-1 transition-colors ${view === 'orders' ? 'text-black dark:text-white border-b-2 border-black dark:border-white' : 'text-zinc-400'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest">Orders</span>
          </button>
          {user.role === 'admin' && (
             <button onClick={() => setShowAdmin(!showAdmin)} className={`flex flex-col items-center gap-1 pb-1 transition-colors ${showAdmin ? 'text-black dark:text-white border-b-2 border-black dark:border-white' : 'text-zinc-400'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest">Admin</span>
             </button>
          )}
      </nav>

      {/* Product Modal */}
      {selectedProduct && (
          <ProductModal 
            product={selectedProduct} 
            onClose={() => { setSelectedProduct(null); window.history.pushState({}, '', window.location.pathname); }}
            onAddToCart={addToCart}
            onBuyNow={buyNow}
          />
      )}

      {/* Cart Drawer */}
      <div className={`fixed inset-0 z-[2400] bg-black/40 transition-opacity duration-500 ${cartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setCartOpen(false)}>
         <div onClick={e => e.stopPropagation()} className={`absolute left-0 top-0 h-full w-full max-w-sm bg-white dark:bg-zinc-900 p-10 flex flex-col transform transition-transform duration-500 shadow-2xl ${cartOpen ? 'translate-x-0' : '-translate-x-full'}`}>
             <h2 className="text-4xl font-black italic logo-font mb-10 dark:text-white">Cart</h2>
             <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
                 {cart.map((item, idx) => (
                     <div key={idx} className="flex items-center gap-4 bg-gray-50 dark:bg-zinc-800 p-4 rounded-3xl animate-in slide-in-from-left">
                         <img src={item.img} className="w-16 h-16 object-cover rounded-xl" alt={item.name} />
                         <div className="flex-1 text-right">
                             <h4 className="font-black text-[10px] dark:text-white">{item.name}</h4>
                             <p className="text-[9px] text-zinc-400 font-bold">{item.sz} | {item.hex}</p>
                         </div>
                         <div className="flex items-center gap-2">
                             <button onClick={() => {
                                 const newCart = [...cart];
                                 if(newCart[idx].qty > 1) newCart[idx].qty--; else newCart.splice(idx,1);
                                 setCart(newCart);
                             }} className="w-6 h-6 bg-white dark:bg-zinc-700 rounded-lg text-xs font-black dark:text-white flex items-center justify-center transition-transform active:scale-95">-</button>
                             <span className="text-xs font-black dark:text-white w-4 text-center">{item.qty}</span>
                             <button onClick={() => {
                                 const newCart = [...cart];
                                 newCart[idx].qty++;
                                 setCart(newCart);
                             }} className="w-6 h-6 bg-white dark:bg-zinc-700 rounded-lg text-xs font-black dark:text-white flex items-center justify-center transition-transform active:scale-95">+</button>
                         </div>
                     </div>
                 ))}
                 {cart.length === 0 && <p className="text-center text-zinc-400 italic">Your cart is empty.</p>}
             </div>
             <div className="pt-8 border-t dark:border-zinc-800 mt-6">
                 <div className="flex justify-between font-black text-2xl mb-8 italic dark:text-white">
                     <span>Total</span>
                     <span>{cart.reduce((a, b) => a + (b.price * b.qty), 0).toLocaleString()} EGP</span>
                 </div>
                 <button onClick={checkoutCart} className="w-full bg-black dark:bg-white dark:text-black text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:scale-[1.02] transition-transform active:scale-95">
                     Checkout
                 </button>
             </div>
             <button onClick={() => setCartOpen(false)} className="mt-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center hover:text-black dark:hover:text-white">Close</button>
         </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
          <div className="fixed inset-0 z-[2600] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
             <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl text-right animate-in zoom-in duration-300">
                 <h2 className="text-3xl font-black italic logo-font mb-8 text-center dark:text-white">Checkout</h2>
                 <div className="space-y-4">
                     <input value={shipName} onChange={e => setShipName(e.target.value)} type="text" placeholder="الاسم الكامل" className="w-full p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 dark:text-white outline-none font-bold focus:ring-2 ring-zinc-200 dark:ring-zinc-700 transition-all text-right" dir="rtl" />
                     <div className="flex gap-2" dir="ltr">
                         <div className="w-20 p-5 rounded-2xl bg-zinc-100 dark:bg-zinc-700 dark:text-white font-black text-center flex items-center justify-center">+20</div>
                         <input value={shipPhone} onChange={e => setShipPhone(e.target.value)} type="tel" placeholder="1xxxxxxxxx" className="flex-1 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 dark:text-white outline-none font-bold text-left focus:ring-2 ring-zinc-200 dark:ring-zinc-700 transition-all" />
                     </div>
                     <textarea value={shipAddress} onChange={e => setShipAddress(e.target.value)} placeholder="العنوان بالتفصيل" className="w-full p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 dark:text-white outline-none h-28 font-bold resize-none focus:ring-2 ring-zinc-200 dark:ring-zinc-700 transition-all text-right" dir="rtl" />
                     <button onClick={submitOrder} className="w-full bg-black dark:bg-white dark:text-black text-white py-6 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all hover:shadow-lg">
                         تأكيد الطلب ({checkoutItems.reduce((a, b) => a + (b.price * b.qty), 0).toLocaleString()} EGP)
                     </button>
                 </div>
                 <button onClick={() => setShowCheckout(false)} className="w-full mt-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-red-500 transition-colors">إلغاء</button>
             </div>
          </div>
      )}

    </div>
  );
}

export default App;