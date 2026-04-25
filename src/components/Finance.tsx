import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Trash2, Wallet, Landmark, Banknote, TrendingDown, TrendingUp, PiggyBank, Users, User, Pencil, Save, CreditCard, Bitcoin } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { PaymentMethod, FinancialAccount, Investor, Expense } from '../types';
import { fmt, cn } from '../lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';

export default function Finance({ appData }: { appData: ReturnType<typeof useAppData> }) {
  const { data, addExpense, deleteExpense, updateAccountBalance, usdtRate } = appData;
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<FinancialAccount | null>(null);
  const [newBalance, setNewBalance] = useState<number>(0);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpenseState, setEditExpenseState] = useState<Expense | null>(null);

  const getAccountBalanceCOP = (acc: FinancialAccount) => {
    if (acc.method === 'Cripto (USDT)') {
      return acc.balance * usdtRate;
    }
    return acc.balance;
  };

  const investors: Investor[] = ['Duvan', 'Lina', 'Santiago', 'Johana', 'Pool', 'Santa Maria', 'Thomas'];

  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: 0,
    method: 'Efectivo' as PaymentMethod,
    category: 'Varios',
    date: new Date().toISOString().split('T')[0],
    investor: 'Duvan' as Investor,
  });

  const totalCapital = data.accounts.reduce((sum, acc) => sum + getAccountBalanceCOP(acc), 0);
  const totalInventory = data.products
    .filter(p => p.status === 'stock')
    .reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);
  
  const totalGain = data.products
    .filter(p => p.status === 'sold')
    .reduce((sum, p) => {
      const pGain = (p.salePrice || 0) - p.purchasePrice;
      return sum + (pGain * p.quantity);
    }, 0);

  const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalDebts = data.debtors.reduce((sum, d) => {
    const paid = d.payments.reduce((a, b) => a + b, 0);
    return sum + (d.totalAmount - paid);
  }, 0);
  const totalLiabilities = data.liabilities.reduce((sum, l) => {
    const paid = l.payments.reduce((a, b) => a + b, 0);
    return sum + (l.totalAmount - paid);
  }, 0);

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) return;
    addExpense(newExpense);
    setNewExpense({
      ...newExpense,
      description: '',
      amount: 0,
    });
    setIsExpenseOpen(false);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditExpenseState(expense);
    setEditingExpenseId(expense.id);
  };

  const saveExpenseEdit = async () => {
    if (!editExpenseState || !editingExpenseId) return;
    // For simplicity since we don't have updateExpense, 
    // we'll implement it by updating the doc directly if we have access or 
    // just re-run deletion and addition if too complex.
    // However, I added `updateDoc` logic in useAppData for others, 
    // let's add `updateExpense` to `useAppData` properly to maintain balances.
    
    // For now, I'll delete and re-add which is the safest way to trigger balance updates in current useAppData logic
    await deleteExpense(editingExpenseId);
    await addExpense(editExpenseState);
    
    setEditingExpenseId(null);
    setEditExpenseState(null);
  };

  const handleAdjustBalance = () => {
    if (!selectedAccount) return;
    updateAccountBalance(selectedAccount.id, newBalance);
    setIsAdjustOpen(false);
    setSelectedAccount(null);
  };

  const confirmDeleteExpense = () => {
    if (expenseToDelete) {
      deleteExpense(expenseToDelete);
      setExpenseToDelete(null);
      setIsConfirmDeleteOpen(false);
    }
  };

  const accountIcons: Record<string, any> = {
    'Bancolombia': <Landmark className="w-4 h-4 text-blue-600" />,
    'Nequi': <Wallet className="w-4 h-4 text-fuchsia-600" />,
    'Banco de Bogota': <Landmark className="w-4 h-4 text-slate-800" />,
    'Efectivo': <Banknote className="w-4 h-4 text-emerald-600" />,
    'Cripto (USDT)': <Bitcoin className="w-4 h-4 text-orange-500" />,
  };

  return (
    <div className="space-y-12">
      {/* Individual Investor Views */}
      <div className="grid grid-cols-1 gap-12">
        {investors.map((investor) => {
          const methods: PaymentMethod[] = ['Efectivo', 'Bancolombia', 'Nequi', 'Banco de Bogota'];
          if (investor === 'Duvan') methods.push('Cripto (USDT)');

          const accountsToRender = methods.map(method => {
            const existing = data.accounts.find(a => a.investor === investor && a.method === method);
            return existing || { 
              id: `${investor}-${method}`,
              investor, 
              method, 
              balance: 0, 
              name: method 
            } as FinancialAccount;
          });

          const investorProducts = data.products.filter(p => 
            p.investor === investor || 
            (p.coInvestors && p.coInvestors.some(co => co.investor === investor))
          );
          const investorExpenses = data.expenses.filter(e => e.investor === investor);
          
          const invCapital = accountsToRender.reduce((s, a) => s + getAccountBalanceCOP(a), 0);
          
          const invInventory = investorProducts
            .filter(p => p.status === 'stock' && !p.isExternal)
            .reduce((s, p) => {
              const share = p.coInvestors && p.coInvestors.length > 0 
                ? (p.coInvestors.find(co => co.investor === investor)?.percentage || 0) / 100
                : 1;
              return s + (p.purchasePrice * share * (p.quantity || 1));
            }, 0);

          const invGain = investorProducts
            .filter(p => p.status === 'sold')
            .reduce((s, p) => {
              const share = p.coInvestors && p.coInvestors.length > 0 
                ? (p.coInvestors.find(co => co.investor === investor)?.percentage || 0) / 100
                : 1;
              const pGain = (p.salePrice || 0) - p.purchasePrice;
              return s + (pGain * share * (p.quantity || 1));
            }, 0);
          const invExpensesTotal = investorExpenses.reduce((s, e) => s + e.amount, 0);

          return (
            <div key={investor} className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                <div className="bg-slate-900 text-white p-1.5 rounded-lg">
                  <User className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">{investor}</h2>
                <div className="ml-auto flex gap-4">
                   <div className="text-right">
                      <div className="text-[9px] uppercase font-bold text-slate-400">Total Patrimonio</div>
                      <div className="text-sm font-black text-slate-900">{fmt(invCapital + invInventory)}</div>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Investor Stats */}
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Capital en Efectivo</span>
                      <span className="text-xs font-mono font-bold text-blue-600">{fmt(invCapital)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Inversión en Stock</span>
                      <span className="text-xs font-mono font-bold text-slate-900">{fmt(invInventory)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Ganancia Acumulada</span>
                      <span className={cn("text-xs font-mono font-bold", invGain >= 0 ? "text-emerald-600" : "text-rose-600")}>
                        {fmt(invGain)}
                      </span>
                    </div>
                    <div className="pt-2 border-t flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase text-rose-500">Gastos Realizados</span>
                      <span className="text-xs font-mono font-bold text-rose-500">{fmt(invExpensesTotal)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Investor Accounts */}
                <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-5 gap-2">
                  {accountsToRender.map(acc => (
                    <div key={acc.id} className="p-3 bg-white rounded-lg shadow-sm group relative flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        {accountIcons[acc.method]}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setSelectedAccount(acc);
                            setNewBalance(acc.balance);
                            setIsAdjustOpen(true);
                          }}
                        >
                          <Pencil className="w-3 h-3 text-slate-400" />
                        </Button>
                      </div>
                      <div className="mt-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase truncate">{acc.method}</div>
                        <div className="text-xs font-mono font-bold truncate">
                          {acc.method === 'Cripto (USDT)' ? (
                            <span title={`${acc.balance} USDT @ ${fmt(usdtRate)}`}>
                              {fmt(acc.balance * usdtRate)}
                              <span className="text-[8px] ml-1 opacity-50">({acc.balance} U)</span>
                            </span>
                          ) : fmt(acc.balance)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expenses and Actions */}
                <Card className="lg:col-span-2 border-none shadow-sm flex flex-col justify-center p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase text-slate-500">Operaciones Rápidas</h4>
                      <p className="text-[11px] text-slate-400">Registra salidas de dinero para {investor}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-rose-200 text-rose-600 hover:bg-rose-50 font-bold uppercase text-[10px]"
                      onClick={() => {
                        setNewExpense(prev => ({ ...prev, investor: investor }));
                        setIsExpenseOpen(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Registrar Gasto
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Summary Section */}
      <div className="pt-12 border-t-2 border-dashed border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Resumen General Consolidad</h2>
            <p className="text-xs text-slate-500 font-medium">CONSOLIDADO DE TODOS LOS INVERSORES</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold uppercase opacity-80 mb-1">Capital Total Disponible</p>
                  <h3 className="text-2xl font-black">{fmt(totalCapital)}</h3>
                </div>
                <PiggyBank className="w-8 h-8 opacity-40" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">Inversión Total Stock</p>
                  <h3 className="text-2xl font-black text-slate-900">{fmt(totalInventory)}</h3>
                </div>
                <TrendingDown className="w-8 h-8 text-slate-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1">Ganancia Neta Global</p>
                  <h3 className="text-2xl font-black text-emerald-600">{fmt(totalGain)}</h3>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-slate-900 text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold uppercase opacity-60 mb-1">Patrimonio Total</p>
                  <h3 className="text-2xl font-black">{fmt(totalCapital + totalInventory + totalDebts - totalLiabilities)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card className="border-none shadow-sm bg-amber-50 border-amber-100">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Cuentas por Cobrar</p>
                <h3 className="text-xl font-black text-amber-700">{fmt(totalDebts)}</h3>
              </div>
              <CreditCard className="w-8 h-8 text-amber-200" />
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-rose-50 border-rose-100">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Pasivos (Deudas)</p>
                <h3 className="text-xl font-black text-rose-700">{fmt(totalLiabilities)}</h3>
              </div>
              <TrendingDown className="w-8 h-8 text-rose-200" />
            </CardContent>
          </Card>
        </div>

        {/* Expenses History */}
        <Card className="mt-8 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <TrendingDown className="w-4 h-4" /> Historial de Egresos (Gastos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-[10px] uppercase font-bold">Fecha</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold">Inversor / Descripción</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold">Cuenta</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-right">Monto</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-right w-20">Acceso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...data.expenses].sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs font-mono py-3">{e.date}</TableCell>
                      <TableCell className="text-xs py-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[8px] font-bold uppercase px-1 py-0">{e.investor}</Badge>
                          <span className="font-medium">{e.description}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[10px] font-bold py-3 uppercase">{e.method}</TableCell>
                      <TableCell className="text-xs font-mono text-rose-600 font-bold text-right py-3">{fmt(e.amount)}</TableCell>
                      <TableCell className="text-right py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-blue-400 hover:text-blue-600" 
                            onClick={() => handleEditExpense(e)}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-7 w-7 text-rose-400 hover:text-rose-600" 
                            onClick={() => {
                              setExpenseToDelete(e.id);
                              setIsConfirmDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.expenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-400">Sin gastos reportados</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Dialog */}
      {isExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Registrar Gasto: {newExpense.investor}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} placeholder="Ej: Pago de Luz, Almuerzo, etc." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monto</Label>
                  <Input type="number" value={newExpense.amount || 0} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <Label>Cuenta</Label>
                  <Select value={newExpense.method} onValueChange={v => setNewExpense({...newExpense, method: v as PaymentMethod})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Bancolombia">Bancolombia</SelectItem>
                      <SelectItem value="Nequi">Nequi</SelectItem>
                      <SelectItem value="Banco de Bogota">Banco de Bogota</SelectItem>
                      {newExpense.investor === 'Duvan' && <SelectItem value="Cripto (USDT)">Cripto (USDT)</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsExpenseOpen(false)}>Cancelar</Button>
                <Button className="flex-1 bg-rose-600 hover:bg-rose-700" onClick={handleAddExpense}>Confirmar Gasto</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Expense Edit Dialog */}
      {editingExpenseId && editExpenseState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Editar Gasto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input value={editExpenseState.description} onChange={e => setEditExpenseState({...editExpenseState, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monto</Label>
                  <Input type="number" value={editExpenseState.amount || 0} onChange={e => setEditExpenseState({...editExpenseState, amount: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <Label>Cuenta</Label>
                  <Select value={editExpenseState.method} onValueChange={v => setEditExpenseState({...editExpenseState, method: v as PaymentMethod})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Bancolombia">Bancolombia</SelectItem>
                      <SelectItem value="Nequi">Nequi</SelectItem>
                      <SelectItem value="Banco de Bogota">Banco de Bogota</SelectItem>
                      {editExpenseState.investor === 'Duvan' && <SelectItem value="Cripto (USDT)">Cripto (USDT)</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={editExpenseState.date} onChange={e => setEditExpenseState({...editExpenseState, date: e.target.value})} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditingExpenseId(null)}>Cancelar</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={saveExpenseEdit}>Guardar Cambios</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Adjust Balance Dialog */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Ajustar Saldo: {selectedAccount?.investor} - {selectedAccount?.method}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="adj-balance">
                {selectedAccount?.method === 'Cripto (USDT)' ? 'Nuevo Saldo en USDT' : 'Nuevo Saldo Disponible'}
              </Label>
              <Input 
                id="adj-balance" 
                type="number" 
                step="any"
                value={newBalance || 0} 
                onChange={e => setNewBalance(parseFloat(e.target.value) || 0)} 
              />
              {selectedAccount?.method === 'Cripto (USDT)' && (
                <p className="text-[10px] text-slate-500 font-bold uppercase">
                  Valor Aproximado en COP: {fmt(newBalance * usdtRate)}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsAdjustOpen(false)}>Cancelar</Button>
            <Button className="flex-1 bg-slate-900 text-white" onClick={handleAdjustBalance}>Guardar Cambios</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción restaurará el dinero a la cuenta correspondiente y eliminará el registro permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteExpense} className="bg-rose-600 hover:bg-rose-700">Eliminar Gasto</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
