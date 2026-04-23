import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { useAppData } from '../hooks/useAppData';
import { fmt, cn } from '../lib/utils';

export default function Investors({ appData }: { appData: ReturnType<typeof useAppData> }) {
  const { data } = appData;
  const investors = ['Duvan', 'Lina', 'Santiago', 'Johana', 'Pool', 'Santa Maria', 'Thomas'];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Detalle por Inversor</h2>
      </div>

      {investors.map((inv) => {
        const prods = data.products.filter(p => p.investor === inv);
        const accounts = data.accounts.filter(a => a.investor === inv);
        if (prods.length === 0 && accounts.length === 0) return null;

        const stockCapital = prods.filter(p => p.status === 'stock').reduce((acc, p) => acc + (p.purchasePrice * (p.quantity || 1)), 0);
        const accountBalance = accounts.reduce((acc, a) => acc + a.balance, 0);
        const totalCapital = stockCapital + accountBalance;
        
        const totalProfit = prods.filter(p => p.status === 'sold').reduce((acc, p) => acc + (((p.salePrice || 0) - p.purchasePrice) * (p.quantity || 1)), 0);
        const stockCount = prods.filter(p => p.status === 'stock').reduce((acc, p) => acc + (p.quantity || 1), 0);

        return (
          <div key={inv} className="space-y-4">
            <div className="flex items-end justify-between px-1">
              <div>
                <h3 className="text-lg font-bold">{inv}</h3>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  {prods.filter(p => p.status === 'stock').length} en stock · {prods.filter(p => p.status === 'sold').length} vendidos
                </div>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Cap. Total</div>
                  <div className="text-sm font-mono font-bold text-slate-900">{fmt(totalCapital)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex flex-col">
                    <span>Stock: {fmt(stockCapital)}</span>
                    <span>Cuentas: {fmt(accountBalance)}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Ganancia</div>
                  <div className="text-sm font-mono font-semibold text-emerald-600">{fmt(totalProfit)}</div>
                </div>
              </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[10px] uppercase font-bold pl-6">Producto</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Proveedor</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Compra</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Venta</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Ganancia</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold pr-6">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prods.map((p) => {
                      const profit = p.status === 'sold' ? (p.salePrice || 0) - p.purchasePrice : null;
                      return (
                        <TableRow key={p.id} className="group">
                          <TableCell className="py-3 pl-6">
                            <div className="text-sm font-medium">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{p.imei || 'S/I'}</div>
                          </TableCell>
                          <TableCell className="py-3 text-xs text-slate-500">{p.provider || '—'}</TableCell>
                          <TableCell className="py-3 text-xs font-mono">{fmt(p.purchasePrice)}</TableCell>
                          <TableCell className="py-3 text-xs font-mono">{p.salePrice ? fmt(p.salePrice) : '—'}</TableCell>
                          <TableCell className="py-3">
                            {profit !== null ? (
                              <div className={cn("text-xs font-bold font-mono", profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                {fmt(profit)}
                              </div>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="py-3 pr-6">
                            <Badge variant={p.status === 'stock' ? 'secondary' : 'default'} className={cn(
                              "text-[9px] uppercase font-bold px-1.5 py-0.5",
                              p.status === 'stock' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                            )}>
                              {p.status === 'stock' ? 'Stock' : 'Vendido'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );
      })}
      {/* Global Summary */}
      <div className="pt-10 border-t border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight uppercase">Resumen General de Inversión</h2>
          <Badge className="bg-slate-900 text-white font-mono h-7 px-4">TOTAL LDIPHONE</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Capital Actual (Stock + Cuentas)</div>
              <div className="text-2xl font-black tracking-tighter">
                {fmt(
                  data.products.filter(p => p.status === 'stock').reduce((acc, p) => acc + (p.purchasePrice * (p.quantity || 1)), 0) +
                  data.accounts.reduce((acc, a) => acc + a.balance, 0)
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ganancia Total Realizada</div>
              <div className="text-2xl font-black tracking-tighter text-emerald-600">
                {fmt(data.products.filter(p => p.status === 'sold').reduce((acc, p) => acc + (((p.salePrice || 0) - p.purchasePrice) * (p.quantity || 1)), 0))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Productos en Stock</div>
              <div className="text-2xl font-black tracking-tighter text-blue-600">
                {data.products.filter(p => p.status === 'stock').reduce((acc, p) => acc + (p.quantity || 1), 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
