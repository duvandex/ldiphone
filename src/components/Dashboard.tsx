import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Package, ShoppingCart, TrendingUp, Wallet, CreditCard, RefreshCw, ChevronRight, Activity } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { useAppData } from '../hooks/useAppData';
import { fmt, cn } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'motion/react';

export default function Dashboard({ appData }: { appData: ReturnType<typeof useAppData> }) {
  const { data, user, initializeDatabase } = appData;
  const isDuvan = user?.email === 'duvanmarinj@gmail.com';
  const isDbEmpty = data.products.length === 0;
  const stock = (data.products || []).filter(p => p.status === 'stock');
  const sold = (data.products || []).filter(p => p.status === 'sold');
  
  const totalProfit = sold.reduce((acc, p) => acc + (((p.salePrice || 0) - p.purchasePrice) * (p.quantity || 1)), 0);
  const stockValue = stock.reduce((acc, p) => acc + (p.purchasePrice * (p.quantity || 1)), 0);
  const totalStockUnits = stock.reduce((acc, p) => acc + (p.quantity || 1), 0);
  
  const pendingDebts = data.debtors.reduce((acc, d) => {
    const paid = d.payments.reduce((a, b) => a + b, 0);
    return acc + (d.totalAmount - paid);
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
    { label: 'Unidades Stock', value: totalStockUnits, icon: Package, color: 'bg-blue-50 text-blue-600' },
    { label: 'Ganancia Total', value: fmt(totalProfit), icon: TrendingUp, color: totalProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600' },
    { label: 'Capital en Stock', value: fmt(stockValue), icon: Wallet, color: 'bg-slate-50 text-slate-600' },
    { label: 'Capital Disponible', value: fmt(totalCapital), icon: Activity, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Por Cobrar', value: fmt(pendingDebts), icon: CreditCard, color: 'bg-amber-50 text-amber-600' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            Exploración de Datos
            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">LIVE</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">Control financiero y de inventario centralizado</p>
        </div>
      </div>

      {isDuvan && isDbEmpty && (
        <Card className="card-premium bg-gradient-to-br from-white to-slate-50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <CardContent className="p-8 flex flex-col items-center justify-center text-center gap-4 relative z-10">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin-slow" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black tracking-tight">Estructura detectada, pero sin registros</h3>
              <p className="text-slate-500 text-sm max-w-sm">Si es tu primera vez, puedes restaurar la base de datos de LDIPHONE desde la nube.</p>
            </div>
            <Button onClick={initializeDatabase} className="bg-slate-900 rounded-full px-8 h-12 hover:scale-105 transition-transform">
              Sincronizar Cloud Data
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={item}>
            <Card className="card-premium border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                  {stat.label}
                </CardTitle>
                <div className={cn("p-2 rounded-xl", stat.color)}>
                  <stat.icon className="h-3.5 w-3.5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-black tracking-tighter text-slate-900">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item}>
          <Card className="card-premium border-none overflow-hidden h-full">
            <CardHeader className="border-b border-slate-50">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Rendimiento de Inversores
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={investorStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} fontWeight={700} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000000}M`} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', padding: '12px' }}
                    labelStyle={{ fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px' }}
                  />
                  <Bar dataKey="profit" radius={[6, 6, 0, 0]} barSize={32}>
                    {investorStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="card-premium border-none h-full">
            <CardHeader className="border-b border-slate-50">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Posiciones de Capital
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-none bg-slate-50/50">
                    <TableHead className="text-[10px] uppercase font-black px-6 h-10">Inversor</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-right px-6 h-10">Efectivo</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-right px-6 h-10">Ganancia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investorStats.map((inv) => (
                    <TableRow key={inv.name} className="group cursor-default border-slate-50">
                      <TableCell className="font-bold py-4 px-6 text-sm flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black group-hover:bg-slate-900 group-hover:text-white transition-colors uppercase">
                          {inv.name.substring(0, 2)}
                        </div>
                        {inv.name}
                      </TableCell>
                      <TableCell className="text-right py-4 px-6 font-mono text-xs text-blue-600 font-black">{fmt(inv.balance)}</TableCell>
                      <TableCell className={cn(
                        "text-right py-4 px-6 font-mono text-xs font-black",
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
        </motion.div>
      </div>

      <motion.div variants={item}>
        <Card className="card-premium border-none">
          <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-900"></span>
              Stock Reciente
            </CardTitle>
            <Button variant="ghost" className="text-[10px] font-black uppercase h-7 px-2">Ver todo <ChevronRight className="w-3 h-3 ml-1" /></Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-none bg-slate-50/50">
                  <TableHead className="text-[10px] uppercase font-black px-6 h-10">Producto</TableHead>
                  <TableHead className="text-[10px] uppercase font-black text-center h-10">Cant.</TableHead>
                  <TableHead className="text-[10px] uppercase font-black h-10">Inversor</TableHead>
                  <TableHead className="text-[10px] uppercase font-black text-right px-6 h-10">P. Compra</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.slice(0, 5).map((p) => (
                  <TableRow key={p.id} className="border-slate-50 group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-bold py-4 px-6 text-xs text-slate-700">{p.name}</TableCell>
                    <TableCell className="py-4 text-center">
                      <span className="text-[10px] font-black bg-white border border-slate-200 text-slate-900 px-2.5 py-1 rounded-full shadow-sm">
                        {p.quantity || 1}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-slate-500 font-bold text-[10px] uppercase tracking-wider">{p.investor}</TableCell>
                    <TableCell className="text-right py-4 px-6 font-mono text-[11px] font-bold text-slate-900">{fmt(p.purchasePrice)}</TableCell>
                  </TableRow>
                ))}
                {stock.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-400 font-medium italic">Inventario actualmente vacío</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
