import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Package, ShoppingCart, TrendingUp, Wallet, CreditCard } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useAppData } from '../hooks/useAppData';
import { fmt, cn } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard({ appData }: { appData: ReturnType<typeof useAppData> }) {
  const { data } = appData;
  const stock = data.products.filter(p => p.status === 'stock');
  const sold = data.products.filter(p => p.status === 'sold');
  
  const totalProfit = sold.reduce((acc, p) => acc + (((p.salePrice || 0) - p.purchasePrice) * (p.quantity || 1)), 0);
  const stockValue = stock.reduce((acc, p) => acc + (p.purchasePrice * (p.quantity || 1)), 0);
  const totalStockUnits = stock.reduce((acc, p) => acc + (p.quantity || 1), 0);
  
  const pendingDebts = data.debtors.reduce((acc, d) => {
    const paid = d.payments.reduce((a, b) => a + b, 0);
    return acc + (d.totalAmount - paid);
  }, 0);

  const totalLiabilities = data.liabilities.reduce((acc, l) => {
    const paid = l.payments.reduce((a, b) => a + b, 0);
    return acc + (l.totalAmount - paid);
  }, 0);

  const investors = ['Duvan', 'Lina', 'Santiago', 'Johana', 'Pool', 'Santa Maria', 'Thomas'];
  const investorStats = investors.map(inv => {
    const invProds = data.products.filter(p => p.investor === inv);
    const invSold = invProds.filter(p => p.status === 'sold');
    const invStock = invProds.filter(p => p.status === 'stock');
    
    return {
      name: inv,
      capital: invProds.reduce((acc, p) => acc + (p.purchasePrice * (p.quantity || 1)), 0),
      sales: invSold.reduce((acc, p) => acc + ((p.salePrice || 0) * (p.quantity || 1)), 0),
      profit: invSold.reduce((acc, p) => acc + (((p.salePrice || 0) - p.purchasePrice) * (p.quantity || 1)), 0),
      balance: data.accounts.filter(a => a.investor === inv).reduce((acc, a) => acc + a.balance, 0),
      stockCount: invStock.reduce((acc, p) => acc + (p.quantity || 1), 0)
    };
  });

  const totalCapital = data.accounts.reduce((acc, a) => acc + a.balance, 0);

  const stats = [
    { label: 'Unidades Stock', value: totalStockUnits, icon: Package, color: 'text-blue-600' },
    { label: 'Ganancia Total', value: fmt(totalProfit), icon: TrendingUp, color: totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600' },
    { label: 'Capital en Stock', value: fmt(stockValue), icon: Wallet, color: 'text-slate-600' },
    { label: 'Capital Disponible', value: fmt(totalCapital), icon: Wallet, color: 'text-emerald-500' },
    { label: 'Por Cobrar', value: fmt(pendingDebts), icon: CreditCard, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                {stat.label}
              </CardTitle>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold tracking-tight">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium italic serif">Ganancia por Inversor</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={investorStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000000}M`} />
                <Tooltip 
                  formatter={(v: number) => fmt(v)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                  {investorStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium italic serif">Resumen de Inversores</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase font-bold">Inversor</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-right">Efectivo</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-right">Capital Stock</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-right">Ganancia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investorStats.map((inv) => (
                  <TableRow key={inv.name} className="group cursor-default">
                    <TableCell className="font-medium py-3">{inv.name}</TableCell>
                    <TableCell className="text-right py-3 font-mono text-xs text-blue-600 font-bold">{fmt(inv.balance)}</TableCell>
                    <TableCell className="text-right py-3 font-mono text-xs">{fmt(inv.capital)}</TableCell>
                    <TableCell className={cn(
                      "text-right py-3 font-mono text-xs font-semibold",
                      inv.profit >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {fmt(inv.profit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium italic serif">Productos en Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] uppercase font-bold">Producto</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-center">Cant.</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Inversor</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">P. Compra (u)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.slice(0, 10).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium py-3 text-xs">{p.name}</TableCell>
                  <TableCell className="py-3 text-center">
                    <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {p.quantity || 1}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-slate-500 text-xs">{p.investor}</TableCell>
                  <TableCell className="text-right py-3 font-mono text-[10px]">{fmt(p.purchasePrice)}</TableCell>
                </TableRow>
              ))}
              {stock.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-400">Sin productos en stock</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
