export interface ProductColor {
  img: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  sizes: string[];
  colors: ProductColor[];
}

export interface CartItem {
  name: string;
  price: number;
  sz: string;
  img: string;
  hex: string;
  qty: number;
}

export interface ShippingDetails {
  name: string;
  phone: string;
  address: string;
}

export interface Order {
  id: string;
  userName: string;
  items: CartItem[];
  total: number;
  shipping: ShippingDetails;
  status: string;
  timestamp: number;
}

export interface UserProfile {
  name: string;
  role: 'admin' | 'user';
}