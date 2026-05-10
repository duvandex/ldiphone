import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Receipt, Download, Pencil, Trash2, Copy } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { fmt } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { Product, PaymentMethod } from '../types';

export default function Sales({ appData }: { appData: ReturnType<typeof useAppData> }) {
  const { data, updateProduct, undoSale } = appData;
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Product | null>(null);
  const [isUndoOpen, setIsUndoOpen] = useState(false);
  const [undoId, setUndoId] = useState<string | null>(null);

  const soldProducts = React.useMemo(() => {
    return [...data.products.filter(p => p.status === 'sold')].sort((a, b) => 
      (b.saleDate || '').localeCompare(a.saleDate || '')
    );
  }, [data.products]);

  const handleUpdateSale = () => {
    if (!editingSale) return;
    updateProduct(editingSale.id, editingSale);
    setIsEditOpen(false);
    setEditingSale(null);
  };

  const exportToCSV = () => {
    const headers = ['Factura', 'Producto', 'Cant.', 'IMEI', 'Inversor', 'Proveedor', 'Fecha Venta', 'Precio Compra (u)', 'Precio Venta (u)', 'Ganancia Total'];
    const rows = soldProducts.map(p => {
      const qty = p.quantity || 1;
      const profitPerUnit = (p.salePrice || 0) - p.purchasePrice;
      return [
        p.invoiceNumber || '',
        p.name,
        qty,
        p.imei || '',
        p.investor,
        p.provider || '',
        p.saleDate || '',
        p.purchasePrice,
        p.salePrice || 0,
        profitPerUnit * qty
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ventas_ldiphone_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Historial de Ventas</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={exportToCSV}
          disabled={soldProducts.length === 0}
          className="text-xs font-medium border-border"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="text-[10px] uppercase font-bold pl-6 text-muted-foreground">Producto</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-center text-muted-foreground">Cant.</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Proveedor</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Fecha Venta</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right text-muted-foreground">P. Compra (u)</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right text-muted-foreground">P. Venta (u)</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right text-muted-foreground">Ganancia Total</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right text-muted-foreground">Factura</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right pr-6 text-muted-foreground">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {soldProducts.map((p) => {
                const qty = p.quantity || 1;
                const profit = ((p.salePrice || 0) - p.purchasePrice) * qty;
                return (
                  <TableRow key={p.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <TableCell className="py-4 pl-6">
                      <div className="text-sm font-semibold text-foreground">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{p.invoiceNumber || 'S/N'}</div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <div className="text-xs font-bold bg-muted px-2 py-1 rounded w-fit mx-auto border border-border text-foreground">
                        {qty}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-sm font-medium text-primary">{p.provider || '—'}</div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-xs font-mono text-muted-foreground">{p.saleDate || '—'}</div>
                    </TableCell>
                    <TableCell className="py-4 text-right text-xs font-mono text-muted-foreground">{fmt(p.purchasePrice)}</TableCell>
                    <TableCell className="py-4 text-right text-xs font-mono font-semibold text-foreground">{fmt(p.salePrice || 0)}</TableCell>
                    <TableCell className="py-4 text-right">
                      <div className={`text-xs font-bold font-mono ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {fmt(profit)}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                        onClick={() => navigate(`/invoice?id=${p.id}`)}
                      >
                        <Receipt className="w-4 h-4 mr-2" />
                        Factura
                      </Button>
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-primary/60 hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Duplicar para inventario"
                          onClick={() => navigate(`/inventory?duplicateProductId=${p.id}`)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                          onClick={() => {
                            setEditingSale({ ...p });
                            setIsEditOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-500/10"
                          onClick={() => {
                            setUndoId(p.id);
                            setIsUndoOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {soldProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    No hay ventas registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirm Undo Dialog */}
      <Dialog open={isUndoOpen} onOpenChange={setIsUndoOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5" /> ¿Eliminar Venta?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            Esta acción revertirá la venta. El equipo volverá al inventario y el dinero se descontará de la cuenta correspondiente.
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsUndoOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => {
              if (undoId) {
                await undoSale(undoId);
                setIsUndoOpen(false);
                setUndoId(null);
              }
            }}>Confirmar y Revertir</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Sale Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Venta</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Producto</Label>
              <Input value={editingSale?.name || ''} disabled />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Precio Venta (u)</Label>
                <Input 
                  type="number" 
                  value={editingSale?.salePrice || 0} 
                  onChange={e => setEditingSale(prev => prev ? ({...prev, salePrice: parseFloat(e.target.value) || 0}) : null)} 
                />
              </div>
              <div className="grid gap-2">
                <Label>Precio Compra (u)</Label>
                <Input 
                  type="number" 
                  value={editingSale?.purchasePrice || 0} 
                  onChange={e => setEditingSale(prev => prev ? ({...prev, purchasePrice: parseFloat(e.target.value) || 0}) : null)} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Fecha Venta</Label>
                <Input 
                  type="date" 
                  value={editingSale?.saleDate || ''} 
                  onChange={e => setEditingSale(prev => prev ? ({...prev, saleDate: e.target.value}) : null)} 
                />
              </div>
              <div className="grid gap-2">
                <Label>Cantidad</Label>
                <Input 
                  type="number" 
                  value={editingSale?.quantity || 1} 
                  onChange={e => setEditingSale(prev => prev ? ({...prev, quantity: parseInt(e.target.value) || 1}) : null)} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Cuenta Destino</Label>
                <Select 
                  value={editingSale?.saleMethod || 'Efectivo'} 
                  onValueChange={v => setEditingSale(prev => prev ? ({...prev, saleMethod: v as PaymentMethod}) : null)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Bancolombia">Bancolombia</SelectItem>
                    <SelectItem value="Nequi">Nequi</SelectItem>
                    <SelectItem value="Banco de Bogota">Banco de Bogota</SelectItem>
                    {editingSale?.investor === 'Duvan' && <SelectItem value="Cripto (USDT)">Cripto (USDT)</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Proveedor</Label>
                <Input 
                  value={editingSale?.provider || ''} 
                  onChange={e => setEditingSale(prev => prev ? ({...prev, provider: e.target.value}) : null)} 
                  placeholder="Proveedor"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Número de Factura</Label>
              <Input 
                value={editingSale?.invoiceNumber || ''} 
                onChange={e => setEditingSale(prev => prev ? ({...prev, invoiceNumber: e.target.value}) : null)} 
              />
            </div>

            <div className="grid gap-2 border-t border-border pt-4">
              <div className="grid gap-2">
                <Label className="text-rose-600 font-bold uppercase text-[10px] tracking-widest">Garantía (Meses)</Label>
                <Input 
                  type="number" 
                  min="0"
                  className="rounded-xl border-border h-11"
                  value={editingSale?.warrantyMonths || 0} 
                  onChange={e => {
                    const months = parseInt(e.target.value) || 0;
                    setEditingSale(prev => {
                      if (!prev) return null;
                      const date = prev.saleDate ? new Date(prev.saleDate) : new Date();
                      date.setMonth(date.getMonth() + months);
                      return {
                        ...prev,
                        warrantyMonths: months,
                        warrantyExpiration: date.toISOString().split('T')[0]
                      };
                    });
                  }} 
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Vencimiento</Label>
                <Input 
                  type="date"
                  className="rounded-xl border-border h-11"
                  value={editingSale?.warrantyExpiration || ''} 
                  onChange={e => setEditingSale(prev => prev ? ({...prev, warrantyExpiration: e.target.value}) : null)} 
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-rose-600">Términos de Garantía Específicos</Label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={editingSale?.warrantyTerms || ''} 
                placeholder="Deja en blanco para usar los generales de configuración..."
                onChange={e => setEditingSale(prev => prev ? ({...prev, warrantyTerms: e.target.value}) : null)} 
              />
            </div>
          </div>
          <Button onClick={handleUpdateSale} className="w-full bg-primary text-primary-foreground h-12 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-primary/10">Actualizar Información</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
