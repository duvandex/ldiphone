import { useState, useEffect } from 'react';
import { 
  onSnapshot, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  runTransaction
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, handleFirestoreError } from '../lib/firebase';
import { AppData, Product, Debtor, Liability, Expense, Investor, PaymentMethod, FinancialAccount } from '../types';
import { INITIAL_PRODUCTS, INITIAL_DEBTORS, INITIAL_LIABILITIES } from '../constants';

export function useAppData() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData>({
    products: [],
    debtors: [],
    liabilities: [],
    invoiceCounter: 15,
    accounts: [],
    expenses: [],
    settings: {
      companyName: 'LDIPHONE',
      warrantyTerms: 'La garantía cubre defectos de fábrica. No cubre daños por humedad, golpes o mal uso.',
      defaultWarrantyMonths: 3,
      paymentMethods: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [usdtRate, setUsdtRate] = useState<number>(4000);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=cop');
        if (!response.ok) throw new Error('API response not ok');
        const data = await response.json();
        if (data.tether && data.tether.cop) {
          setUsdtRate(data.tether.cop);
        }
      } catch (err) {
        console.warn("Error fetching USDT rate, using fallback", err);
        // Fallback to a reasonable default if API fails
        setUsdtRate(prev => prev || 4000);
      }
    };
    fetchRate();
    const interval = setInterval(fetchRate, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleQuotaError = (err: any) => {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota')) {
      setIsQuotaExceeded(true);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setData(prev => ({ ...prev, products }));
      setLoading(false);
      setIsQuotaExceeded(false);
    }, (err) => {
      console.error("Products fallback error:", err);
      handleQuotaError(err);
      setLoading(false);
    });

    return () => unsubProducts();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubDebtors = onSnapshot(collection(db, 'debtors'), (snapshot) => {
      const debtors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debtor));
      setData(prev => ({ ...prev, debtors }));
      setIsQuotaExceeded(false);
    }, handleQuotaError);

    const unsubLiabilities = onSnapshot(collection(db, 'liabilities'), (snapshot) => {
      const liabilities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Liability));
      setData(prev => ({ ...prev, liabilities }));
      setIsQuotaExceeded(false);
    }, handleQuotaError);

    const unsubAccounts = onSnapshot(collection(db, 'accounts'), (snapshot) => {
      const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialAccount));
      setData(prev => ({ ...prev, accounts }));
      setIsQuotaExceeded(false);
    }, handleQuotaError);

    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setData(prev => ({ ...prev, expenses }));
      setIsQuotaExceeded(false);
    }, handleQuotaError);

    const unsubSettings = onSnapshot(doc(db, 'app_settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const snapData = snapshot.data();
        setData(prev => ({ 
          ...prev, 
          invoiceCounter: snapData.invoiceCounter || prev.invoiceCounter,
          settings: {
            companyName: snapData.companyName || prev.settings.companyName,
            companyLogo: snapData.companyLogo,
            warrantyTerms: snapData.warrantyTerms || prev.settings.warrantyTerms,
            defaultWarrantyMonths: snapData.defaultWarrantyMonths || prev.settings.defaultWarrantyMonths,
            paymentMethods: snapData.paymentMethods || [],
          }
        }));
      }
      setIsQuotaExceeded(false);
    }, handleQuotaError);

    return () => {
      unsubDebtors();
      unsubLiabilities();
      unsubAccounts();
      unsubExpenses();
      unsubSettings();
    };
  }, [user]);

  const initializeDatabase = async () => {
    if (!user || user.email !== 'duvanmarinj@gmail.com') return;
    
    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        // Init Settings
        transaction.set(doc(db, 'app_settings', 'global'), { 
          invoiceCounter: 15,
          companyName: 'LDIPHONE',
          warrantyTerms: 'La garantía cubre defectos de fábrica. No cubre daños por humedad, golpes o mal uso.',
          defaultWarrantyMonths: 3
        });

        // Init Accounts
        const investors: Investor[] = ['Duvan', 'Lina', 'Santiago', 'Johana', 'Pool', 'Santa Maria', 'Thomas'];
        const methods: PaymentMethod[] = ['Efectivo', 'Bancolombia', 'Nequi', 'Banco de Bogota', 'Cripto (USDT)'];
        
        investors.forEach(inv => {
          methods.forEach(met => {
            if (met === 'Cripto (USDT)' && inv !== 'Duvan') return;
            const id = `${inv}-${met}`;
            transaction.set(doc(db, 'accounts', id), {
              id,
              investor: inv,
              method: met,
              name: met,
              balance: 0
            });
          });
        });

        // Init Data from constants
        INITIAL_PRODUCTS.forEach(p => {
          transaction.set(doc(db, 'products', p.id), p);
        });
        INITIAL_DEBTORS.forEach(d => {
          transaction.set(doc(db, 'debtors', d.id), d);
        });
        INITIAL_LIABILITIES.forEach(l => {
          transaction.set(doc(db, 'liabilities', l.id), l);
        });
      });
      alert('Base de datos inicializada con éxito.');
    } catch (err) {
      console.error("Error initializing DB", err);
      alert('Error al inicializar: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const id = Math.random().toString(36).substr(2, 9);
      const docRef = doc(db, 'products', id);
      const newProduct: Product = {
        ...product,
        id,
        initialQuantity: product.quantity,
        status: product.status || 'stock',
      };

      await runTransaction(db, async (transaction) => {
        // Only deduct capital if it's NOT an external product
        if (!newProduct.isExternal) {
          // If there are co-investors, handle split capital deduction
          if (newProduct.coInvestors && newProduct.coInvestors.length > 0) {
            for (const co of newProduct.coInvestors) {
              const methodUsed = co.method || newProduct.purchaseMethod || 'Efectivo';
              const accountId = `${co.investor}-${methodUsed}`;
              const accountRef = doc(db, 'accounts', accountId);
              const accountDoc = await transaction.get(accountRef);
              const totalCOP = (newProduct.purchasePrice * newProduct.quantity) * (co.percentage / 100);
              const amount = methodUsed === 'Cripto (USDT)' ? totalCOP / usdtRate : totalCOP;

              if (accountDoc.exists()) {
                transaction.update(accountRef, { balance: accountDoc.data().balance - amount });
              } else {
                transaction.set(accountRef, {
                  id: accountId,
                  investor: co.investor,
                  method: methodUsed,
                  name: methodUsed,
                  balance: -amount
                });
              }
            }
          } else {
            // Standard single investor
            const accountId = `${newProduct.investor}-${newProduct.purchaseMethod || 'Efectivo'}`;
            const accountRef = doc(db, 'accounts', accountId);
            const accountDoc = await transaction.get(accountRef);
            const totalCOP = newProduct.purchasePrice * newProduct.quantity;
            const amount = newProduct.purchaseMethod === 'Cripto (USDT)' ? totalCOP / usdtRate : totalCOP;

            if (accountDoc.exists()) {
              transaction.update(accountRef, { balance: accountDoc.data().balance - amount });
            } else {
              transaction.set(accountRef, {
                id: accountId,
                investor: newProduct.investor,
                method: newProduct.purchaseMethod || 'Efectivo',
                name: newProduct.purchaseMethod || 'Efectivo',
                balance: -amount
              });
            }
          }
        }

        // --- ESCRITURA ---
        transaction.set(docRef, newProduct);
      });
    } catch (err) {
      handleFirestoreError(err, 'create', 'products');
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product> & { sellQuantity?: number }) => {
    try {
      await runTransaction(db, async (transaction) => {
        const productRef = doc(db, 'products', id);
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) return;

        const product = productDoc.data() as Product;
        const sellQty = updates.sellQuantity || 1;

        let settingsDoc = null;
        if (updates.status === 'sold' && !updates.invoiceNumber) {
          const settingsRef = doc(db, 'app_settings', 'global');
          settingsDoc = await transaction.get(settingsRef);
        }

        // Manejar Número de Factura
        let finalInvoiceNumber = updates.invoiceNumber;
        if (updates.status === 'sold' && !finalInvoiceNumber) {
          const currentCounter = settingsDoc && settingsDoc.exists() ? settingsDoc.data().invoiceCounter || 1 : 1;
          finalInvoiceNumber = `FAC-${String(currentCounter).padStart(3, '0')}`;
          transaction.set(doc(db, 'app_settings', 'global'), { invoiceCounter: currentCounter + 1 }, { merge: true });
        }

        if (updates.status === 'sold') {
          const currentQty = product.quantity || 1;
          const isSalePartial = sellQty < currentQty;

          if (isSalePartial) {
            transaction.update(productRef, {
              quantity: currentQty - sellQty,
              status: 'stock'
            });

            const newSoldId = Math.random().toString(36).substr(2, 9);
            const soldEntry: Product = {
              ...product,
              id: newSoldId,
              status: 'sold',
              quantity: sellQty,
              salePrice: updates.salePrice,
              saleDate: updates.saleDate,
              buyer: updates.buyer,
              invoiceNumber: finalInvoiceNumber,
              saleMethod: updates.saleMethod,
              originalProductId: id,
            };
            transaction.set(doc(db, 'products', newSoldId), soldEntry);
          } else {
            const { sellQuantity, ...cleanUpdates } = updates;
            cleanUpdates.invoiceNumber = finalInvoiceNumber;
            transaction.update(productRef, cleanUpdates);
          }

          // --- LOGICA DE REPARTO DE DINERO ---
          const totalRevenue = (updates.salePrice || 0) * sellQty;
          const adjustedRevenue = updates.saleMethod === 'Cripto (USDT)' ? totalRevenue / usdtRate : totalRevenue;

          if (product.isExternal) {
            // Todo el dinero a Duvan (independientemente de quién aparezca como responsable en el form)
            const accountId = `Duvan-${updates.saleMethod || 'Efectivo'}`;
            const accountRef = doc(db, 'accounts', accountId);
            const accountDoc = await transaction.get(accountRef);
            if (accountDoc.exists()) {
              transaction.update(accountRef, { balance: accountDoc.data().balance + adjustedRevenue });
            } else {
              transaction.set(accountRef, {
                id: accountId,
                investor: 'Duvan',
                method: updates.saleMethod || 'Efectivo',
                name: updates.saleMethod || 'Efectivo',
                balance: adjustedRevenue
              });
            }
          } else if (product.coInvestors && product.coInvestors.length > 0) {
            // Reparto proporcional entre socios
            for (const co of product.coInvestors) {
              const accountId = `${co.investor}-${updates.saleMethod || 'Efectivo'}`;
              const accountRef = doc(db, 'accounts', accountId);
              const accountDoc = await transaction.get(accountRef);
              const share = adjustedRevenue * (co.percentage / 100);

              if (accountDoc.exists()) {
                transaction.update(accountRef, { balance: accountDoc.data().balance + share });
              } else {
                transaction.set(accountRef, {
                  id: accountId,
                  investor: co.investor,
                  method: updates.saleMethod || 'Efectivo',
                  name: updates.saleMethod || 'Efectivo',
                  balance: share
                });
              }
            }
          } else {
            // Único inversor
            const accountId = `${product.investor}-${updates.saleMethod || 'Efectivo'}`;
            const accountRef = doc(db, 'accounts', accountId);
            const accountDoc = await transaction.get(accountRef);
            if (accountDoc.exists()) {
              transaction.update(accountRef, { balance: accountDoc.data().balance + adjustedRevenue });
            } else {
              transaction.set(accountRef, {
                id: accountId,
                investor: product.investor,
                method: updates.saleMethod || 'Efectivo',
                name: updates.saleMethod || 'Efectivo',
                balance: adjustedRevenue
              });
            }
          }
        } else {
          const { sellQuantity, ...cleanUpdates } = updates;
          transaction.update(productRef, cleanUpdates);
        }
      });
    } catch (err) {
      handleFirestoreError(err, 'update', `products/${id}`);
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      const id = Math.random().toString(36).substr(2, 9);
      const expenseRef = doc(db, 'expenses', id);
      const accountId = `${expense.investor}-${expense.method}`;
      const accountRef = doc(db, 'accounts', accountId);

      await runTransaction(db, async (transaction) => {
        // --- 1. LECTURAS (GETS) ---
        const accountDoc = await transaction.get(accountRef);

        // --- 2. ESCRITURAS ---
        transaction.set(expenseRef, { ...expense, id });
        const adjustedAmount = expense.method === 'Cripto (USDT)' ? expense.amount / usdtRate : expense.amount;

        if (accountDoc.exists()) {
          transaction.update(accountRef, {
            balance: accountDoc.data().balance - adjustedAmount
          });
        } else {
          transaction.set(accountRef, {
            id: accountId,
            investor: expense.investor,
            method: expense.method,
            name: expense.method,
            balance: -adjustedAmount
          });
        }
      });
    } catch (err) {
      handleFirestoreError(err, 'create', 'expenses');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await runTransaction(db, async (transaction) => {
        // --- 1. LECTURAS (GETS) ---
        const expenseRef = doc(db, 'expenses', id);
        const expenseDoc = await transaction.get(expenseRef);
        if (!expenseDoc.exists()) return;

        const expense = expenseDoc.data() as Expense;
        const adjustedAmount = expense.method === 'Cripto (USDT)' ? expense.amount / usdtRate : expense.amount;

        const accountRef = doc(db, 'accounts', `${expense.investor}-${expense.method}`);
        const accountDoc = await transaction.get(accountRef);

        // --- 2. ESCRITURAS ---
        transaction.delete(expenseRef);
        if (accountDoc.exists()) {
          transaction.update(accountRef, {
            balance: accountDoc.data().balance + adjustedAmount
          });
        }
      });
    } catch (err) {
      handleFirestoreError(err, 'delete', `expenses/${id}`);
    }
  };

  const updateAccountBalance = async (accountId: string, newBalance: number) => {
    try {
      const accountRef = doc(db, 'accounts', accountId);
      const [investor, method] = accountId.split('-');
      await setDoc(accountRef, { 
        balance: newBalance,
        investor,
        method,
        name: method,
        id: accountId
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, 'update', `accounts/${accountId}`);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      handleFirestoreError(err, 'delete', `products/${id}`);
    }
  };

  const addDebtor = async (debtor: Omit<Debtor, 'id'>) => {
    try {
      const id = Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, 'debtors', id), { ...debtor, id });
    } catch (err) {
      handleFirestoreError(err, 'create', 'debtors');
    }
  };

  const addPayment = async (debtorId: string, amount: number) => {
    try {
      const debtorRef = doc(db, 'debtors', debtorId);
      await runTransaction(db, async (transaction) => {
        const dDoc = await transaction.get(debtorRef);
        if (!dDoc.exists()) return;
        
        const d = dDoc.data() as Debtor;
        const newPayments = [...d.payments, amount];
        const totalPaid = newPayments.reduce((a, b) => a + b, 0);
        transaction.update(debtorRef, {
          payments: newPayments,
          status: totalPaid >= d.totalAmount ? 'paid' : 'pending',
        });
      });
    } catch (err) {
      handleFirestoreError(err, 'update', `debtors/${debtorId}`);
    }
  };

  const deleteDebtor = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'debtors', id));
    } catch (err) {
      handleFirestoreError(err, 'delete', `debtors/${id}`);
    }
  };

  const updateDebtor = async (id: string, updates: Partial<Debtor>) => {
    try {
      await updateDoc(doc(db, 'debtors', id), updates);
    } catch (err) {
      handleFirestoreError(err, 'update', `debtors/${id}`);
    }
  };

  const addLiability = async (liability: Omit<Liability, 'id'>) => {
    try {
      const id = Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, 'liabilities', id), { ...liability, id });
    } catch (err) {
      handleFirestoreError(err, 'create', 'liabilities');
    }
  };

  const addLiabilityPayment = async (liabilityId: string, amount: number) => {
    try {
      const libRef = doc(db, 'liabilities', liabilityId);
      await runTransaction(db, async (transaction) => {
        const lDoc = await transaction.get(libRef);
        if (!lDoc.exists()) return;

        const l = lDoc.data() as Liability;
        const newPayments = [...l.payments, amount];
        const totalPaid = newPayments.reduce((a, b) => a + b, 0);
        transaction.update(libRef, {
          payments: newPayments,
          status: totalPaid >= l.totalAmount ? 'paid' : 'pending',
        });
      });
    } catch (err) {
      handleFirestoreError(err, 'update', `liabilities/${liabilityId}`);
    }
  };

  const deleteLiability = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'liabilities', id));
    } catch (err) {
      handleFirestoreError(err, 'delete', `liabilities/${id}`);
    }
  };

  const updateLiability = async (id: string, updates: Partial<Liability>) => {
    try {
      await updateDoc(doc(db, 'liabilities', id), updates);
    } catch (err) {
      handleFirestoreError(err, 'update', `liabilities/${id}`);
    }
  };

  const updateSettings = async (updates: Partial<AppData['settings']>) => {
    try {
      await setDoc(doc(db, 'app_settings', 'global'), updates, { merge: true });
    } catch (err) {
      handleFirestoreError(err, 'update', 'app_settings/global');
    }
  };

  const generateInvoiceNumber = async () => {
    const num = data.invoiceCounter || 1;
    try {
      await setDoc(doc(db, 'app_settings', 'global'), { invoiceCounter: num + 1 }, { merge: true });
      return `FAC-${String(num).padStart(3, '0')}`;
    } catch (err) {
      console.error("Error generating invoice number", err);
      return `FAC-${Date.now().toString().slice(-6)}`; // Fallback simple if Firestore fails
    }
  };

  const undoSale = async (saleId: string) => {
    try {
      await runTransaction(db, async (transaction) => {
        // --- 1. LECTURAS (GETS) ---
        const saleRef = doc(db, 'products', saleId);
        const saleDoc = await transaction.get(saleRef);
        if (!saleDoc.exists()) return;

        const sale = saleDoc.data() as Product;
        if (sale.status !== 'sold') return;

        let originalDoc = null;
        let originalRef = null;
        if (sale.originalProductId) {
          originalRef = doc(db, 'products', sale.originalProductId);
          originalDoc = await transaction.get(originalRef);
        }

        let accountDoc = null;
        let accountRef = null;
        if (sale.saleMethod && sale.salePrice && sale.saleMethod !== 'none') {
          const targetInvestor = sale.isExternal ? 'Duvan' : sale.investor;
          const accountId = `${targetInvestor}-${sale.saleMethod}`;
          accountRef = doc(db, 'accounts', accountId);
          accountDoc = await transaction.get(accountRef);
        }

        // --- 2. ESCRITURAS ---
        
        // Restaurar el stock
        if (sale.originalProductId && originalRef) {
          if (originalDoc && originalDoc.exists()) {
            const original = originalDoc.data() as Product;
            transaction.update(originalRef, {
              quantity: (original.quantity || 0) + (sale.quantity || 1),
              status: 'stock'
            });
            transaction.delete(saleRef);
          } else {
            transaction.update(saleRef, {
              status: 'stock',
              salePrice: null,
              saleDate: null,
              buyer: null,
              invoiceNumber: null,
              saleMethod: null,
              originalProductId: null
            });
          }
        } else {
          transaction.update(saleRef, {
            status: 'stock',
            salePrice: null,
            saleDate: null,
            buyer: null,
            invoiceNumber: null,
            saleMethod: null
          });
        }

        // Revertir el dinero de las cuentas
        if (accountRef && accountDoc && accountDoc.exists()) {
          const amount = (sale.salePrice || 0) * (sale.quantity || 1);
          const adjustedAmountValue = sale.saleMethod === 'Cripto (USDT)' ? amount / usdtRate : amount;
          transaction.update(accountRef, {
            balance: accountDoc.data().balance - adjustedAmountValue
          });
        }
      });
    } catch (err) {
      handleFirestoreError(err, 'delete', `sales/${saleId}`);
    }
  };

  return {
    data,
    user,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    undoSale,
    addDebtor,
    addPayment,
    deleteDebtor,
    addLiability,
    addLiabilityPayment,
    deleteLiability,
    updateLiability,
    addExpense,
    deleteExpense,
    updateAccountBalance,
    updateSettings,
    generateInvoiceNumber,
    initializeDatabase,
    updateDebtor,
    usdtRate,
    isQuotaExceeded,
  };
}
