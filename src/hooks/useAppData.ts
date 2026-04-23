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
  });
  const [loading, setLoading] = useState(true);

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
    if (!user) return;

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setData(prev => ({ ...prev, products }));
      setLoading(false);
    }, (err) => handleFirestoreError(err, 'list', 'products'));

    const unsubDebtors = onSnapshot(collection(db, 'debtors'), (snapshot) => {
      const debtors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debtor));
      setData(prev => ({ ...prev, debtors }));
    });

    const unsubLiabilities = onSnapshot(collection(db, 'liabilities'), (snapshot) => {
      const liabilities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Liability));
      setData(prev => ({ ...prev, liabilities }));
    });

    const unsubAccounts = onSnapshot(collection(db, 'accounts'), (snapshot) => {
      const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialAccount));
      setData(prev => ({ ...prev, accounts }));
    });

    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setData(prev => ({ ...prev, expenses }));
    });

    const unsubSettings = onSnapshot(doc(db, 'app_settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setData(prev => ({ ...prev, invoiceCounter: snapshot.data().invoiceCounter }));
      }
    });

    return () => {
      unsubProducts();
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
        transaction.set(doc(db, 'app_settings', 'global'), { invoiceCounter: 15 });

        // Init Accounts
        const investors: Investor[] = ['Duvan', 'Lina', 'Santiago', 'Johana', 'Pool', 'Santa Maria', 'Thomas'];
        const methods: PaymentMethod[] = ['Efectivo', 'Bancolombia', 'Nequi', 'Banco de Bogota'];
        
        investors.forEach(inv => {
          methods.forEach(met => {
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
        transaction.set(docRef, newProduct);
        
        if (newProduct.purchaseMethod && newProduct.purchaseMethod !== 'none') {
          const accountId = `${newProduct.investor}-${newProduct.purchaseMethod}`;
          const accountRef = doc(db, 'accounts', accountId);
          const accountDoc = await transaction.get(accountRef);
          
          const amount = newProduct.purchasePrice * newProduct.quantity;
          if (accountDoc.exists()) {
            transaction.update(accountRef, {
              balance: accountDoc.data().balance - amount
            });
          } else {
            transaction.set(accountRef, {
              id: accountId,
              investor: newProduct.investor,
              method: newProduct.purchaseMethod,
              name: newProduct.purchaseMethod,
              balance: -amount
            });
          }
        }
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
        const inv = updates.investor || product.investor;
        const saleQty = updates.sellQuantity || updates.quantity || product.quantity || 1;

        if (updates.status === 'sold' && updates.sellQuantity && updates.sellQuantity < (product.quantity || 1)) {
          // Partial sale
          transaction.update(productRef, {
            quantity: (product.quantity || 1) - updates.sellQuantity,
          });

          const newSoldId = Math.random().toString(36).substr(2, 9);
          const soldEntry: Product = {
            ...product,
            id: newSoldId,
            status: 'sold',
            quantity: updates.sellQuantity,
            salePrice: updates.salePrice,
            saleDate: updates.saleDate,
            buyer: updates.buyer,
            invoiceNumber: updates.invoiceNumber,
            saleMethod: updates.saleMethod,
          };
          transaction.set(doc(db, 'products', newSoldId), soldEntry);

          if (updates.saleMethod && updates.salePrice && updates.saleMethod !== 'none') {
            const accountId = `${inv}-${updates.saleMethod}`;
            const accountRef = doc(db, 'accounts', accountId);
            const accountDoc = await transaction.get(accountRef);
            if (accountDoc.exists()) {
              transaction.update(accountRef, {
                balance: accountDoc.data().balance + (updates.salePrice! * updates.sellQuantity!)
              });
            } else {
              // Create account if missing for some reason
              transaction.set(accountRef, {
                id: accountId,
                investor: inv,
                method: updates.saleMethod,
                name: updates.saleMethod,
                balance: updates.salePrice! * updates.sellQuantity!
              });
            }
          }
        } else {
          // Full update or status change
          const oldStatus = product.status;
          // Ensure we don't save sellQuantity as a field in the product doc if it's just a helper
          const { sellQuantity, ...cleanUpdates } = updates;
          transaction.update(productRef, cleanUpdates);

          if (oldStatus !== 'sold' && updates.status === 'sold' && updates.saleMethod && updates.salePrice && updates.saleMethod !== 'none') {
            const accountId = `${inv}-${updates.saleMethod}`;
            const accountRef = doc(db, 'accounts', accountId);
            const accountDoc = await transaction.get(accountRef);
            if (accountDoc.exists()) {
              transaction.update(accountRef, {
                balance: accountDoc.data().balance + (updates.salePrice! * saleQty)
              });
            } else {
              transaction.set(accountRef, {
                id: accountId,
                investor: inv,
                method: updates.saleMethod,
                name: updates.saleMethod,
                balance: updates.salePrice! * saleQty
              });
            }
          }
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
        transaction.set(expenseRef, { ...expense, id });
        const accountDoc = await transaction.get(accountRef);
        if (accountDoc.exists()) {
          transaction.update(accountRef, {
            balance: accountDoc.data().balance - expense.amount
          });
        } else {
          transaction.set(accountRef, {
            id: accountId,
            investor: expense.investor,
            method: expense.method,
            name: expense.method,
            balance: -expense.amount
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
        const expenseRef = doc(db, 'expenses', id);
        const expenseDoc = await transaction.get(expenseRef);
        if (!expenseDoc.exists()) return;

        const expense = expenseDoc.data() as Expense;
        const accountRef = doc(db, 'accounts', `${expense.investor}-${expense.method}`);
        
        transaction.delete(expenseRef);
        const accountDoc = await transaction.get(accountRef);
        if (accountDoc.exists()) {
          transaction.update(accountRef, {
            balance: accountDoc.data().balance + expense.amount
          });
        }
      });
    } catch (err) {
      handleFirestoreError(err, 'delete', `expenses/${id}`);
    }
  };

  const updateAccountBalance = async (accountId: string, newBalance: number) => {
    try {
      await updateDoc(doc(db, 'accounts', accountId), { balance: newBalance });
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

  const generateInvoiceNumber = () => {
    const num = data.invoiceCounter;
    updateDoc(doc(db, 'app_settings', 'global'), { invoiceCounter: num + 1 });
    return `FAC-${String(num).padStart(3, '0')}`;
  };

  return {
    data,
    user,
    loading,
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
    initializeDatabase,
  };
}
