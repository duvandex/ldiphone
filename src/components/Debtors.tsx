import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Plus, Trash2, HandCoins } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { fmt, cn } from '../lib/utils';

export default function Debtors({ appData }: { appData: ReturnType<typeof useAppData> }) {
  const { data, addDebtor, addPayment, deleteDebtor } = appData;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedDebtorId, setSelectedDebtorId] = useState<string | null>(null);

  const [newDebtor, setNewDebtor] = useState({
    name: '',
    description: '',
    totalAmount: 0,
    initialPayment: 0,
  });

  const [paymentAmount, setPaymentAmount] = useState(0);

  const handleAddDebtor = () => {
    if (!newDebtor.name || !newDebtor.totalAmount) return;
    addDebtor({
      name: newDebtor.name,
      description: newDebtor.description,
      totalAmount: newDebtor.totalAmount,
      payments: newDebtor.initialPayment > 0 ? [newDebtor.initialPayment] : [],
      status: newDebtor.initialPayment >= newDebtor.totalAmount ? 'paid' : 'pending',
    });
    setNewDebtor({ name: '', description: '', totalAmount: 0, initialPayment: 0 });
    setIsAddOpen(false);
  };

  const handleAddPayment = () => {
    if (!selectedDebtorId || !paymentAmount) return;
    addPayment(selectedDebtorId, paymentAmount);
    setPaymentAmount(0);
    setIsPaymentOpen(false);
    setSelectedDebtorId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Deudores</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger
            render={
              <Button className="bg-slate-900 hover:bg-slate-800">
                <Plus className="w-4 h-4 mr-2" /> Agregar Deudor
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nuevo Deudor</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="d-name">Nombre *</Label>
                <Input id="d-name" value={newDebtor.name} onChange={e => setNewDebtor({...newDebtor, name: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="d-desc">Descripción</Label>
                <Input id="d-desc" value={newDebtor.description} onChange={e => setNewDebtor({...newDebtor, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="d-total">Monto Total *</Label>
                  <Input id="d-total" type="number" value={newDebtor.totalAmount || 0} onChange={e => setNewDebtor({...newDebtor, totalAmount: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="d-abono">Abono Inicial</Label>
                  <Input id="d-abono" type="number" value={newDebtor.initialPayment || 0} onChange={e => setNewDebtor({...newDebtor, initialPayment: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
            </div>
            <Button onClick={handleAddDebtor} className="w-full">Guardar Deudor</Button>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] uppercase font-bold pl-6">Deudor</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Descripción</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Total</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Abonado</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Saldo</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Progreso</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right pr-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.debtors.map((d) => {
                const paid = d.payments.reduce((a, b) => a + b, 0);
                const balance = d.totalAmount - paid;
                const progress = Math.min(100, Math.round((paid / d.totalAmount) * 100));
                
                return (
                  <TableRow key={d.id}>
                    <TableCell className="py-4 pl-6 font-medium">{d.name}</TableCell>
                    <TableCell className="py-4 text-xs text-slate-500">{d.description || '—'}</TableCell>
                    <TableCell className="py-4 text-right text-xs font-mono">{fmt(d.totalAmount)}</TableCell>
                    <TableCell className="py-4 text-right text-xs font-mono text-emerald-600">{fmt(paid)}</TableCell>
                    <TableCell className="py-4 text-right text-xs font-mono text-rose-600 font-bold">{fmt(balance)}</TableCell>
                    <TableCell className="py-4">
                      <div className="w-24">
                        <div className="flex justify-between text-[9px] font-bold mb-1">
                          <span>{progress}%</span>
                          <Badge variant="outline" className={cn(
                            "text-[8px] h-3 px-1 border-none",
                            d.status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          )}>
                            {d.status === 'paid' ? 'Pagado' : 'Pendiente'}
                          </Badge>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full transition-all duration-500", d.status === 'paid' ? "bg-emerald-500" : "bg-rose-500")} 
                            style={{ width: `${progress}%` }} 
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        {d.status === 'pending' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => {
                              setSelectedDebtorId(d.id);
                              setIsPaymentOpen(true);
                            }}
                          >
                            <HandCoins className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          onClick={() => deleteDebtor(d.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {data.debtors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    No hay deudores registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Abono</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="p-amount">Monto del Abono *</Label>
              <Input 
                id="p-amount" 
                type="number" 
                value={paymentAmount || 0} 
                onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)} 
              />
            </div>
          </div>
          <Button onClick={handleAddPayment} className="w-full bg-emerald-600 hover:bg-emerald-700">Guardar Abono</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
