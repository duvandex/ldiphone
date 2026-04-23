import { useState, useEffect } from 'react';
import { AppData, Product, Debtor, Liability, Expense, Investor, PaymentMethod, FinancialAccount } from '../types';
import { INITIAL_PRODUCTS, INITIAL_DEBTORS, INITIAL_LIABILITIES } from '../constants';

const STORAGE_KEY = 'ldiphone_app_data_v6';

export function useAppData() {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const investors: Investor[] = ['Duvan', 'Lina', 'Santiago', 'Johana', 'Pool', 'Santa Maria', 'Thomas'];
    const methods: PaymentMethod[] = ['Efectivo', 'Bancolombia', 'Nequi', 'Banco de Bogota'];
    
    // Create accounts for each investor
    const defaultAccounts: FinancialAccount[] = [];
    investors.forEach(inv => {
      methods.forEach(met => {
        defaultAccounts.push({
          id: `${inv}-${met}`,
          investor: inv,
          method: met,
          name: met,
          balance: 0
        });
      });
    });

    const defaults: AppData = {
      products: INITIAL_PRODUCTS,
      debtors: INITIAL_DEBTORS,
      liabilities: INITIAL_LIABILITIES,
      invoiceCounter: 15,
      accounts: defaultAccounts,
      expenses: [],
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration check for account IDs
        let savedAccounts = parsed.accounts || defaultAccounts;
        if (savedAccounts.length > 0 && !savedAccounts[0].investor) {
           // Old format detected, reset or migrate? 
           // Better to reset since the structure changed drastically for individual tracking
           savedAccounts = defaultAccounts;
        }

        return {
          ...defaults,
          ...parsed,
          products: parsed.products || INITIAL_PRODUCTS,
          debtors: parsed.debtors || INITIAL_DEBTORS,
          liabilities: parsed.liabilities || INITIAL_LIABILITIES,
          accounts: savedAccounts,
          expenses: parsed.expenses || defaults.expenses,
        };
      } catch (e) {
        console.error('Error parsing saved data', e);
      }
    }
    return defaults;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.error('Error: Límite de almacenamiento excedido (LocalStorage Quota exceeded)');
      } else {
        console.error('Error saving data', e);
      }
    }
  }, [data]);

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: Math.random().toString(36).substr(2, 9),
      initialQuantity: product.quantity,
      status: product.status || 'stock',
    };
    
    setData(prev => {
      let newAccounts = [...prev.accounts];
      if (newProduct.purchaseMethod && newProduct.purchaseMethod !== 'none') {
        const targetAccountId = `${newProduct.investor}-${newProduct.purchaseMethod}`;
        newAccounts = newAccounts.map(acc => 
          acc.id === targetAccountId 
            ? { ...acc, balance: acc.balance - (newProduct.purchasePrice * newProduct.quantity) }
            : acc
        );
      }

      return {
        ...prev,
        products: [...prev.products, newProduct],
        accounts: newAccounts,
      };
    });
  };

  const updateProduct = (id: string, updates: Partial<Product> & { sellQuantity?: number }) => {
    setData(prev => {
      const productIndex = prev.products.findIndex(p => p.id === id);
      if (productIndex === -1) return prev;

      const product = prev.products[productIndex];
      const newProducts = [...prev.products];
      let newAccounts = [...prev.accounts];
      
      const inv = updates.investor || product.investor;

      if (updates.status === 'sold' && updates.sellQuantity && updates.sellQuantity < (product.quantity || 1)) {
        newProducts[productIndex] = {
          ...product,
          quantity: (product.quantity || 1) - updates.sellQuantity,
        };
        
        const soldEntry: Product = {
          ...product,
          id: Math.random().toString(36).substr(2, 9),
          status: 'sold',
          quantity: updates.sellQuantity,
          salePrice: updates.salePrice,
          saleDate: updates.saleDate,
          buyer: updates.buyer,
          invoiceNumber: updates.invoiceNumber,
          saleMethod: updates.saleMethod,
        };
        newProducts.push(soldEntry);

        if (updates.saleMethod && updates.salePrice && updates.saleMethod !== 'none') {
          const targetAccountId = `${inv}-${updates.saleMethod}`;
          newAccounts = newAccounts.map(acc => 
            acc.id === targetAccountId 
              ? { ...acc, balance: acc.balance + (updates.salePrice! * updates.sellQuantity!) }
              : acc
          );
        }
      } else {
        const oldStatus = product.status;
        newProducts[productIndex] = { ...product, ...updates };

        if (oldStatus !== 'sold' && updates.status === 'sold' && updates.saleMethod && updates.salePrice && updates.saleMethod !== 'none') {
          const targetAccountId = `${inv}-${updates.saleMethod}`;
          newAccounts = newAccounts.map(acc => 
            acc.id === targetAccountId 
              ? { ...acc, balance: acc.balance + (updates.salePrice! * (updates.quantity || product.quantity || 1)) }
              : acc
          );
        }
      }

      return { ...prev, products: newProducts, accounts: newAccounts };
    });
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Math.random().toString(36).substr(2, 9),
    };
    setData(prev => {
      const targetAccountId = `${newExpense.investor}-${newExpense.method}`;
      const newAccounts = prev.accounts.map(acc => 
        acc.id === targetAccountId 
          ? { ...acc, balance: acc.balance - newExpense.amount }
          : acc
      );
      return {
        ...prev,
        expenses: [...prev.expenses, newExpense],
        accounts: newAccounts,
      };
    });
  };

  const deleteExpense = (id: string) => {
    setData(prev => {
      const expense = prev.expenses.find(e => e.id === id) as Expense | undefined;
      if (!expense) return prev;
      
      const targetAccountId = `${expense.investor}-${expense.method}`;
      const newAccounts = prev.accounts.map(acc => 
        acc.id === targetAccountId 
          ? { ...acc, balance: acc.balance + expense.amount }
          : acc
      );
      
      return {
        ...prev,
        expenses: prev.expenses.filter(e => e.id !== id),
        accounts: newAccounts,
      };
    });
  };

  const updateAccountBalance = (accountId: string, newBalance: number) => {
    setData(prev => ({
      ...prev,
      accounts: prev.accounts.map(acc => 
        acc.id === accountId ? { ...acc, balance: newBalance } : acc
      ),
    }));
  };

  const deleteProduct = (id: string) => {
    setData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id),
    }));
  };

  const addDebtor = (debtor: Omit<Debtor, 'id'>) => {
    const newDebtor = {
      ...debtor,
      id: Math.random().toString(36).substr(2, 9),
    };
    setData(prev => ({
      ...prev,
      debtors: [...prev.debtors, newDebtor],
    }));
  };

  const addPayment = (debtorId: string, amount: number) => {
    setData(prev => ({
      ...prev,
      debtors: prev.debtors.map(d => {
        if (d.id === debtorId) {
          const newPayments = [...d.payments, amount];
          const totalPaid = newPayments.reduce((a, b) => a + b, 0);
          return {
            ...d,
            payments: newPayments,
            status: totalPaid >= d.totalAmount ? 'paid' : 'pending',
          };
        }
        return d;
      }),
    }));
  };

  const deleteDebtor = (id: string) => {
    setData(prev => ({
      ...prev,
      debtors: prev.debtors.filter(d => d.id !== id),
    }));
  };

  const addLiability = (liability: Omit<Liability, 'id'>) => {
    const newLiability = {
      ...liability,
      id: Math.random().toString(36).substr(2, 9),
    };
    setData(prev => ({
      ...prev,
      liabilities: [...prev.liabilities, newLiability],
    }));
  };

  const addLiabilityPayment = (liabilityId: string, amount: number) => {
    setData(prev => ({
      ...prev,
      liabilities: prev.liabilities.map(l => {
        if (l.id === liabilityId) {
          const newPayments = [...l.payments, amount];
          const totalPaid = newPayments.reduce((a, b) => a + b, 0);
          return {
            ...l,
            payments: newPayments,
            status: totalPaid >= l.totalAmount ? 'paid' : 'pending',
          };
        }
        return l;
      }),
    }));
  };

  const deleteLiability = (id: string) => {
    setData(prev => ({
      ...prev,
      liabilities: prev.liabilities.filter(l => l.id !== id),
    }));
  };

  const generateInvoiceNumber = () => {
    const num = data.invoiceCounter;
    setData(prev => ({ ...prev, invoiceCounter: prev.invoiceCounter + 1 }));
    return `FAC-${String(num).padStart(3, '0')}`;
  };

  return {
    data,
    addProduct,
    updateProduct,
    deleteProduct,
    addDebtor,
    addPayment,
    deleteDebtor,
    addLiability,
    addLiabilityPayment,
    deleteLiability,
    addExpense,
    deleteExpense,
    updateAccountBalance,
    generateInvoiceNumber,
  };
}
