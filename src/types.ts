export interface Category {
  id: number;
  name: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: number;
  name: string;
  category_id: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  image: string;
  price: number | null;
  link_afiliado: string;
  category_id: number;
  subcategory_id: number;
  featured: number;
  clicks: number;
  created_at: string;
  category_name?: string;
  subcategory_name?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}
