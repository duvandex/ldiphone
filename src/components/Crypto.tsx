import React, { useState, useEffect } from 'react';
import { useData } from '../context/AppDataContext';
import { CryptoTransaction, Investor } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  Coins, 
  DollarSign, 
  BarChart3, 
  RefreshCw,
  Wallet,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { fmt, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Crypto() {
  const { data, addCryptoTransaction, deleteCryptoTransaction, usdtRate } = useData();
  const transactions = data.cryptoTransactions || [];

  // Local state for live crypto prices
  const [livePrices, setLivePrices] = useState<{ btc: number; eth: number }>({ btc: 68500, eth: 3500 });
  const [fetchingPrices, setFetchingPrices] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Form state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<'BTC' | 'ETH'>('BTC');
  const [quantity, setQuantity] = useState('');
  const [purchasePriceUsd, setPurchasePriceUsd] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [investor, setInvestor] = useState<Investor>('Duvan');
  const [notes, setNotes] = useState('');

  // Deletion state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteCoin, setDeleteCoin] = useState<string>('');
  const [deleteQty, setDeleteQty] = useState<number>(0);

  // Fetch prices helper
  const fetchLivePrices = async () => {
    setFetchingPrices(true);
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
      if (response.ok) {
        const resData = await response.json();
        setLivePrices({
          btc: resData.bitcoin?.usd || 68500,
          eth: resData.ethereum?.usd || 3500
        });
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.warn("Failed to fetch live crypto prices, using fallbacks.", error);
    } finally {
      setFetchingPrices(false);
    }
  };

  useEffect(() => {
    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 2 * 60 * 1000); // refresh every 2 mins
    return () => clearInterval(interval);
  }, []);

  // Calculations per Coin
  const coinStats = React.useMemo(() => {
    const stats = {
      BTC: { totalQty: 0, totalSpentUsd: 0, avgPriceUsd: 0 },
      ETH: { totalQty: 0, totalSpentUsd: 0, avgPriceUsd: 0 }
    };

    transactions.forEach((tx) => {
      const coin = tx.cryptocurrency;
      if (coin === 'BTC' || coin === 'ETH') {
        stats[coin].totalQty += tx.quantity;
        stats[coin].totalSpentUsd += tx.quantity * tx.purchasePriceUsd;
      }
    });

    if (stats.BTC.totalQty > 0) {
      stats.BTC.avgPriceUsd = stats.BTC.totalSpentUsd / stats.BTC.totalQty;
    }
    if (stats.ETH.totalQty > 0) {
      stats.ETH.avgPriceUsd = stats.ETH.totalSpentUsd / stats.ETH.totalQty;
    }

    return stats;
  }, [transactions]);

  // General Calculations
  const summary = React.useMemo(() => {
    const btcInvestedUsd = coinStats.BTC.totalSpentUsd;
    const ethInvestedUsd = coinStats.ETH.totalSpentUsd;
    const totalInvestedUsd = btcInvestedUsd + ethInvestedUsd;
    const totalInvestedCop = totalInvestedUsd * usdtRate;

    const btcCurrentValueUsd = coinStats.BTC.totalQty * livePrices.btc;
    const ethCurrentValueUsd = coinStats.ETH.totalQty * livePrices.eth;
    const totalCurrentValueUsd = btcCurrentValueUsd + ethCurrentValueUsd;
    const totalCurrentValueCop = totalCurrentValueUsd * usdtRate;

    const totalProfitUsd = totalCurrentValueUsd - totalInvestedUsd;
    const totalProfitCop = totalProfitUsd * usdtRate;
    const roiPercentage = totalInvestedUsd > 0 ? (totalProfitUsd / totalInvestedUsd) * 100 : 0;

    return {
      totalInvestedUsd,
      totalInvestedCop,
      totalCurrentValueUsd,
      totalCurrentValueCop,
      totalProfitUsd,
      totalProfitCop,
      roiPercentage,
      btcInvestedUsd,
      btcCurrentValueUsd,
      btcProfitUsd: btcCurrentValueUsd - btcInvestedUsd,
      btcRoi: btcInvestedUsd > 0 ? ((btcCurrentValueUsd - btcInvestedUsd) / btcInvestedUsd) * 100 : 0,
      ethInvestedUsd,
      ethCurrentValueUsd,
      ethProfitUsd: ethCurrentValueUsd - ethInvestedUsd,
      ethRoi: ethInvestedUsd > 0 ? ((ethCurrentValueUsd - ethInvestedUsd) / ethInvestedUsd) * 100 : 0
    };
  }, [coinStats, livePrices, usdtRate]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    const price = parseFloat(purchasePriceUsd);
    if (!qty || !price || isNaN(qty) || isNaN(price)) {
      alert("Por favor ingrese cantidad y precio válidos");
      return;
    }

    addCryptoTransaction({
      cryptocurrency: selectedCoin,
      quantity: qty,
      purchasePriceUsd: price,
      purchasePriceCop: price * usdtRate,
      date: purchaseDate,
      investor,
      notes: notes.trim() || ""
    });

    // Reset Form
    setQuantity('');
    setPurchasePriceUsd('');
    setNotes('');
    setIsOpen(false);
  };

  const fmtUsd = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(val);
  };

  const fmtCrypto = (val: number, isBtc = true) => {
    return val.toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 6
    }) + (isBtc ? ' BTC' : ' ETH');
  };

  const investorsList: Investor[] = ['Duvan', 'Lina', 'Santiago', 'Johana', 'Pool', 'Santa Maria', 'Thomas'];

  return (
    <div className="space-y-6">
      {/* Header and Live stats control */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-black tracking-widest text-[#F7931A]">Ledger de Inversión</span>
          <h2 className="text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
            <Coins className="w-6 h-6 text-[#F7931A]" />
            Criptomonedas (BTC / ETH)
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Monitorea compras, precio promedio y rendimiento en tiempo real.</p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLivePrices}
            disabled={fetchingPrices}
            className="h-10 rounded-xl px-3 text-xs font-bold border-border shrink-0 text-muted-foreground flex items-center gap-1.5"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", fetchingPrices && "animate-spin")} />
            <span className="hidden xs:inline">Actualizar Precios</span>
          </Button>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger className="h-10 rounded-xl bg-[#F7931A] hover:bg-[#E28014] text-white text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/15 flex-1 sm:flex-initial px-4 cursor-pointer transition-all">
              <Plus className="w-4 h-4" />
              Registrar Compra
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl border border-border">
              <DialogHeader>
                <DialogTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  <Coins className="w-5 h-5 text-[#F7931A]" />
                  Registrar Compra Cripto
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddTransaction} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Activo</Label>
                    <div className="flex gap-1 bg-muted p-1 rounded-xl border">
                      <button
                        type="button"
                        onClick={() => setSelectedCoin('BTC')}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-xs font-black transition-all",
                          selectedCoin === 'BTC' ? "bg-white text-[#F7931A] shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        BTC
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCoin('ETH')}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-xs font-black transition-all",
                          selectedCoin === 'ETH' ? "bg-white text-[#627EEA] shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        ETH
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Inversor</Label>
                    <Select value={investor} onValueChange={(v) => setInvestor(v as Investor)}>
                      <SelectTrigger className="rounded-xl h-9 text-xs border-border bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {investorsList.map((inv) => (
                          <SelectItem key={inv} value={inv} className="text-xs font-semibold">
                            {inv}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="quantity" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Cantidad Comprada ({selectedCoin})
                  </Label>
                  <div className="relative">
                    <Input
                      id="quantity"
                      type="number"
                      step="any"
                      placeholder="0.025"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      className="rounded-xl h-10 pr-12 text-xs border-border pr-12 font-mono font-bold"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground">
                      {selectedCoin}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="price-usd" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Precio por Unidad (USD)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="price-usd"
                      type="number"
                      step="any"
                      placeholder="67500"
                      value={purchasePriceUsd}
                      onChange={(e) => setPurchasePriceUsd(e.target.value)}
                      required
                      className="rounded-xl h-10 pl-9 text-xs border-border font-mono font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic font-semibold">
                    Equivale aprox a {purchasePriceUsd ? fmt(parseFloat(purchasePriceUsd) * usdtRate) : '$0'} COP (TRM USDT: {fmt(usdtRate)})
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Fecha de Compra
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    required
                    className="rounded-xl h-10 text-xs border-border text-foreground font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Notas / Comentario
                  </Label>
                  <Input
                    id="notes"
                    placeholder="Compra en Binance P2P / Ledger Hardware Wallet"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="rounded-xl h-10 text-xs border-border placeholder:text-muted-foreground/60"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 rounded-xl h-11 text-xs font-bold border-border text-foreground"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 rounded-xl h-11 bg-[#F7931A] hover:bg-[#E28014] text-white text-xs font-black uppercase tracking-wider"
                  >
                    Guardar Compra
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Real-time Crypto Prices Banner */}
      <div className="bg-muted/30 border border-border/80 rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-muted-foreground">Precios de Referencia (Live):</span>
          <div className="flex items-center gap-4 ml-1">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-[#F7931A]">BTC</span>
              <span className="font-mono font-bold text-foreground">{fmtUsd(livePrices.btc)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-[#627EEA]">ETH</span>
              <span className="font-mono font-bold text-foreground">{fmtUsd(livePrices.eth)}</span>
            </div>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground/80 font-medium self-end sm:self-auto flex items-center gap-1">
          <Info className="w-3 h-3 text-muted-foreground/55" />
          Precios actualizados: {lastUpdated.toLocaleTimeString()} | TRM USDT: {fmt(usdtRate)}
        </div>
      </div>

      {/* Main Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-border/80 rounded-2xl shadow-sm bg-gradient-to-br from-card to-background relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#F7931A]">TOTAL INVERTIDO</p>
                <h3 className="text-2xl font-black text-foreground mt-1.5 font-mono">
                  {fmtUsd(summary.totalInvestedUsd)}
                </h3>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">{fmt(summary.totalInvestedCop)} COP</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#F7931A]/10 flex items-center justify-center text-[#F7931A]">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="pt-3 border-t border-border/50 flex justify-between items-center text-[10px] text-muted-foreground font-bold">
              <span>TRACCIONADO PROPORCIONAL</span>
              <span className="font-mono">{transactions.length} Registros</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 rounded-2xl shadow-sm bg-gradient-to-br from-card to-background relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">VALOR PORTAFOLIO</p>
                <h3 className="text-2xl font-black text-foreground mt-1.5 font-mono">
                  {fmtUsd(summary.totalCurrentValueUsd)}
                </h3>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">{fmt(summary.totalCurrentValueCop)} COP</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
            <div className="pt-3 border-t border-border/50 flex justify-between items-center text-[10px] text-muted-foreground font-bold">
              <span>VALUADO A PRECIO SPOT</span>
              <span className="font-mono text-emerald-500 flex items-center gap-0.5">
                SPOT LIVE <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-border/80 rounded-2xl shadow-sm bg-gradient-to-br relative overflow-hidden",
          summary.totalProfitUsd >= 0 ? "from-card to-emerald-500/5" : "from-card to-rose-500/5"
        )}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">GANANCIA NO REALIZADA</p>
                <h3 className={cn(
                  "text-2xl font-black mt-1.5 font-mono flex items-center gap-1.5",
                  summary.totalProfitUsd >= 0 ? "text-emerald-500" : "text-rose-500"
                )}>
                  {summary.totalProfitUsd >= 0 ? '+' : ''}
                  {fmtUsd(summary.totalProfitUsd)}
                  {summary.totalProfitUsd >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                </h3>
                <p className={cn(
                  "text-xs font-bold mt-0.5",
                  summary.totalProfitUsd >= 0 ? "text-emerald-600" : "text-rose-600"
                )}>
                  {summary.totalProfitUsd >= 0 ? '+' : ''}
                  {summary.roiPercentage.toFixed(2)}% ROI
                </p>
              </div>
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center",
                summary.totalProfitUsd >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
              )}>
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="pt-3 border-t border-border/50 flex justify-between items-center text-[10px] text-muted-foreground font-bold">
              <span>PRECIO PROMEDIO VS ACTUAL</span>
              <span className={cn("font-mono", summary.totalProfitUsd >= 0 ? "text-emerald-500" : "text-rose-500")}>
                {summary.totalProfitUsd >= 0 ? '+' : ''}
                {fmt(summary.totalProfitCop)} COP
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coin specifics widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bitcoin specific */}
        <Card className="border border-border/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#F7931A]/15 flex items-center justify-center text-[#F7931A] font-black text-lg">
                ₿
              </div>
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground">Bitcoin (BTC)</CardTitle>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-muted-foreground font-bold font-mono">SPOT: {fmtUsd(livePrices.btc)}</span>
                </div>
              </div>
            </div>
            <span className={cn(
              "text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider",
              summary.btcProfitUsd >= 0 
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                : "bg-rose-500/10 text-rose-600 border-rose-500/20"
            )}>
              {summary.btcRoi >= 0 ? '+' : ''}{summary.btcRoi.toFixed(1)}% ROI
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/20 border border-border/40 rounded-xl grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Monto en Hold</span>
                <span className="text-base font-black text-foreground font-mono mt-0.5 block">
                  {fmtCrypto(coinStats.BTC.totalQty, true)}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Precio Promedio Compra</span>
                <span className="text-base font-black text-foreground font-mono mt-0.5 block">
                  {fmtUsd(coinStats.BTC.avgPriceUsd)}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground font-semibold">Total Invertido:</span>
                <div className="text-right">
                  <span className="font-bold text-foreground font-mono block">{fmtUsd(summary.btcInvestedUsd)}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{fmt(summary.btcInvestedUsd * usdtRate)} COP</span>
                </div>
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground font-semibold">Valor Actual:</span>
                <div className="text-right">
                  <span className="font-bold text-foreground font-mono block">{fmtUsd(summary.btcCurrentValueUsd)}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{fmt(summary.btcCurrentValueUsd * usdtRate)} COP</span>
                </div>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground font-bold">Rendimiento Estimado:</span>
                <div className="text-right">
                  <span className={cn(
                    "font-black font-mono block",
                    summary.btcProfitUsd >= 0 ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {summary.btcProfitUsd >= 0 ? '+' : ''}{fmtUsd(summary.btcProfitUsd)}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold",
                    summary.btcProfitUsd >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {summary.btcProfitUsd >= 0 ? '+' : ''}{fmt(summary.btcProfitUsd * usdtRate)} COP
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ethereum specific */}
        <Card className="border border-border/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#627EEA]/15 flex items-center justify-center text-[#627EEA] font-black text-lg">
                Ξ
              </div>
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground">Ethereum (ETH)</CardTitle>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-muted-foreground font-bold font-mono">SPOT: {fmtUsd(livePrices.eth)}</span>
                </div>
              </div>
            </div>
            <span className={cn(
              "text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider",
              summary.ethProfitUsd >= 0 
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                : "bg-rose-500/10 text-rose-600 border-rose-500/20"
            )}>
              {summary.ethRoi >= 0 ? '+' : ''}{summary.ethRoi.toFixed(1)}% ROI
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/20 border border-border/40 rounded-xl grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Monto en Hold</span>
                <span className="text-base font-black text-foreground font-mono mt-0.5 block">
                  {fmtCrypto(coinStats.ETH.totalQty, false)}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Precio Promedio Compra</span>
                <span className="text-base font-black text-foreground font-mono mt-0.5 block">
                  {fmtUsd(coinStats.ETH.avgPriceUsd)}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground font-semibold">Total Invertido:</span>
                <div className="text-right">
                  <span className="font-bold text-foreground font-mono block">{fmtUsd(summary.ethInvestedUsd)}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{fmt(summary.ethInvestedUsd * usdtRate)} COP</span>
                </div>
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground font-semibold">Valor Actual:</span>
                <div className="text-right">
                  <span className="font-bold text-foreground font-mono block">{fmtUsd(summary.ethCurrentValueUsd)}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{fmt(summary.ethCurrentValueUsd * usdtRate)} COP</span>
                </div>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground font-bold">Rendimiento Estimado:</span>
                <div className="text-right">
                  <span className={cn(
                    "font-black font-mono block",
                    summary.ethProfitUsd >= 0 ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {summary.ethProfitUsd >= 0 ? '+' : ''}{fmtUsd(summary.ethProfitUsd)}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold",
                    summary.ethProfitUsd >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {summary.ethProfitUsd >= 0 ? '+' : ''}{fmt(summary.ethProfitUsd * usdtRate)} COP
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Records Ledger list */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm">
        <h3 className="text-base font-black text-foreground uppercase tracking-tight mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          Historial de Transacciones
        </h3>

        {transactions.length === 0 ? (
          <div className="text-center py-10 text-sm font-semibold text-muted-foreground">
            No hay registros de compras. Haz clic en "Registrar Compra" para agregar tu primer activo.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground/80 uppercase tracking-widest font-black text-[10px]">
                  <th className="py-3 px-2">Fecha</th>
                  <th className="py-3 px-2">Inversor</th>
                  <th className="py-3 px-2">Activo</th>
                  <th className="py-3 px-2">Cantidad</th>
                  <th className="py-3 px-2 text-right">Precio de Compra (USD)</th>
                  <th className="py-3 px-2 text-right">Inversión Total</th>
                  <th className="py-3 px-2 text-right">SPOT Actual / Valor</th>
                  <th className="py-3 px-2 text-right">Rendimiento (P&L)</th>
                  <th className="py-3 px-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((tx) => {
                    const isBtc = tx.cryptocurrency === 'BTC';
                    const currentSpot = isBtc ? livePrices.btc : livePrices.eth;
                    const totalCostUsd = tx.quantity * tx.purchasePriceUsd;
                    const currentValueUsd = tx.quantity * currentSpot;
                    const profitUsd = currentValueUsd - totalCostUsd;
                    const roi = totalCostUsd > 0 ? (profitUsd / totalCostUsd) * 100 : 0;

                    return (
                      <tr key={tx.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                        <td className="py-3 px-2 font-mono text-muted-foreground whitespace-nowrap">{tx.date}</td>
                        <td className="py-3 px-2 font-bold text-foreground">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            {tx.investor}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-black">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md border font-mono text-[10px]",
                            isBtc 
                              ? "bg-amber-50 text-amber-700 border-amber-200" 
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          )}>
                            {tx.cryptocurrency}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-mono font-bold text-foreground">
                          {tx.quantity.toFixed(6).replace(/\.?0+$/, '')}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-muted-foreground font-semibold">
                          {fmtUsd(tx.purchasePriceUsd)}
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-bold text-foreground">
                          <div>{fmtUsd(totalCostUsd)}</div>
                          <div className="text-[10px] text-muted-foreground font-medium font-sans">
                            {fmt(totalCostUsd * usdtRate)} COP
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-mono">
                          <div className="text-foreground font-bold">{fmtUsd(currentValueUsd)}</div>
                          <div className="text-[10px] text-muted-foreground font-semibold font-sans">
                            A {fmtUsd(currentSpot)} spot
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-mono">
                          <div className={cn("font-black", profitUsd >= 0 ? "text-emerald-500" : "text-rose-500")}>
                            {profitUsd >= 0 ? '+' : ''}{fmtUsd(profitUsd)}
                          </div>
                          <div className={cn("text-[10px] font-bold", profitUsd >= 0 ? "text-emerald-600" : "text-rose-600")}>
                            {profitUsd >= 0 ? '+' : ''}{roi.toFixed(1)}%
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteId(tx.id);
                              setDeleteCoin(tx.cryptocurrency);
                              setDeleteQty(tx.quantity);
                            }}
                            className="h-8 w-8 text-muted-foreground hover:text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-tight text-rose-500 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Confirmar Eliminación
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              ¿Está seguro de que desea eliminar permanentemente este registro de compra de <span className="font-extrabold text-foreground">{deleteQty} {deleteCoin}</span>? Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl h-11 text-xs font-bold border-border text-foreground cursor-pointer"
              >
                No, Cancelar
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  if (deleteId) {
                    await deleteCryptoTransaction(deleteId);
                    setDeleteId(null);
                  }
                }}
                className="flex-1 rounded-xl h-11 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Sí, Eliminar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
