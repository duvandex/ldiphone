export type Investor = 'Duvan' | 'Lina' | 'Santiago' | 'Johana' | 'Pool' | 'Santa Maria' | 'Thomas';
export type PaymentMethod = 'Efectivo' | 'Bancolombia' | 'Nequi' | 'Banco de Bogota' | 'Cripto (USDT)' | 'none';

export interface CoInvestor {
  investor: Investor;
  percentage: number;
  method?: PaymentMethod;
}

export type Category = 'CELULARES' | 'TABLETS' | 'RELOJ INTELIGENTES' | 'AURICULARES' | 'ACCESORIOS' | 'Other';

export interface Product {
  id: string;
  name: string;
  category?: Category;
  imei?: string;
  provider?: string;
  investor: Investor;
  purchaseDate: string;
  purchasePrice: number; // Unit price for purchase
  salePrice?: number;    // Unit price for sale
  status: 'stock' | 'sold' | 'out_of_stock';
  saleDate?: string;
  buyer?: string;
  invoiceNumber?: string;
  quantity: number;
  initialQuantity?: number;
  images?: string[]; // Max 4 image URLs (Cloudinary)
  purchaseMethod?: PaymentMethod;
  saleMethod?: PaymentMethod;
  warrantyMonths?: number;
  warrantyExpiration?: string;
  warrantyTerms?: string;
  customerName?: string;
  originalProductId?: string; // Reference to original product for partial sales
  description?: string;
  isExternal?: boolean; // If true, not counted in physical stock value, profit to Duvan
  coInvestors?: CoInvestor[]; // For split ownership
}

export interface FinancialAccount {
  id: string; // Unique ID (e.g., "Duvan-Bancolombia")
  method: PaymentMethod;
  name: string;
  balance: number;
  investor: Investor;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  category: string;
  investor: Investor;
}

export interface Debtor {
  id: string;
  name: string;
  description?: string;
  totalAmount: number;
  payments: number[];
  status: 'pending' | 'paid';
}

export interface Liability {
  id: string;
  creditor: string;
  description: string;
  totalAmount: number;
  payments: number[];
  status: 'pending' | 'paid';
}

export interface AppSettings {
  companyName: string;
  companyLogo?: string; // Cloudinary URL
  warrantyTerms: string;
  defaultWarrantyMonths: number;
  paymentMethods?: string[]; // Cloudinary URLs
}

export interface AppData {
  products: Product[];
  debtors: Debtor[];
  liabilities: Liability[];
  invoiceCounter: number;
  accounts: FinancialAccount[];
  expenses: Expense[];
  settings: AppSettings;
}
