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

export default function Liabilities({ appData }: { appData: ReturnType<typeof useAppData> }) {
  const { data, addLiability, addLiabilityPayment, deleteLiability } = appData;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedLiabilityId, setSelectedLiabilityId] = useState<string | null>(null);

  const [newLiability, setNewLiability] = useState({
    creditor: '',
    description: '',
    totalAmount: 0,
    initialPayment: 0,
  });

  const [paymentAmount, setPaymentAmount] = useState(0);

  const handleAddLiability = () => {
    if (!newLiability.creditor || !newLiability.totalAmount) return;
    addLiability({
      creditor: newLiability.creditor,
      description: newLiability.description,
      totalAmount: newLiability.totalAmount,
      payments: newLiability.initialPayment > 0 ? [newLiability.initialPayment] : [],
      status: newLiability.initialPayment >= newLiability.totalAmount ? 'paid' : 'pending',
    });
    setNewLiability({ creditor: '', description: '', totalAmount: 0, initialPayment: 0 });
    setIsAddOpen(false);
  };

  const handleAddPayment = () => {
    if (!selectedLiabilityId || !paymentAmount) return;
    addLiabilityPayment(selectedLiabilityId, paymentAmount);
    setPaymentAmount(0);
    setIsPaymentOpen(false);
    setSelectedLiabilityId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-rose-700 font-serif italic">Pasivos (Deudas por Pagar)</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger
            render={
              <Button className="bg-rose-900 hover:bg-rose-800">
                <Plus className="w-4 h-4 mr-2" /> Agregar Obligación
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nueva Obligación</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="l-creditor">Acreedor *</Label>
                <Input id="l-creditor" value={newLiability.creditor} onChange={e => setNewLiability({...newLiability, creditor: e.target.value})} placeholder="Ej: Omar, Banco, etc." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="l-desc">Descripción</Label>
                <Input id="l-desc" value={newLiability.description} onChange={e => setNewLiability({...newLiability, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="l-total">Monto Total *</Label>
                  <Input id="l-total" type="number" value={newLiability.totalAmount || 0} onChange={e => setNewLiability({...newLiability, totalAmount: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="l-abono">Abono Inicial</Label>
                  <Input id="l-abono" type="number" value={newLiability.initialPayment || 0} onChange={e => setNewLiability({...newLiability, initialPayment: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
            </div>
            <Button onClick={handleAddLiability} className="w-full bg-rose-700">Guardar Obligación</Button>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] uppercase font-bold pl-6">Acreedor</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Descripción</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Total</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Pagado</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Saldo</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Progreso</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right pr-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.liabilities.map((l) => {
                const paid = l.payments.reduce((a, b) => a + b, 0);
                const balance = l.totalAmount - paid;
                const progress = Math.min(100, Math.round((paid / l.totalAmount) * 100));
                
                return (
                  <TableRow key={l.id}>
                    <TableCell className="py-4 pl-6 font-medium">{l.creditor}</TableCell>
                    <TableCell className="py-4 text-xs text-slate-500">{l.description || '—'}</TableCell>
                    <TableCell className="py-4 text-right text-xs font-mono">{fmt(l.totalAmount)}</TableCell>
                    <TableCell className="py-4 text-right text-xs font-mono text-emerald-600">{fmt(paid)}</TableCell>
                    <TableCell className="py-4 text-right text-xs font-mono text-rose-600 font-bold">{fmt(balance)}</TableCell>
                    <TableCell className="py-4">
                      <div className="w-24">
                        <div className="flex justify-between text-[9px] font-bold mb-1">
                          <span>{progress}%</span>
                          <Badge variant="outline" className={cn(
                            "text-[8px] h-3 px-1 border-none",
                            l.status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          )}>
                            {l.status === 'paid' ? 'Pagado' : 'Pendiente'}
                          </Badge>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full transition-all duration-500", l.status === 'paid' ? "bg-emerald-500" : "bg-rose-500")} 
                            style={{ width: `${progress}%` }} 
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        {l.status === 'pending' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => {
                              setSelectedLiabilityId(l.id);
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
                          onClick={() => deleteLiability(l.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {data.liabilities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    No hay obligaciones registradas
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
            <DialogTitle>Registrar Pago a Obligación</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="pl-amount">Monto del Pago *</Label>
              <Input 
                id="pl-amount" 
                type="number" 
                value={paymentAmount || 0} 
                onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)} 
              />
            </div>
          </div>
          <Button onClick={handleAddPayment} className="w-full bg-emerald-600 hover:bg-emerald-700">Guardar Pago</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
