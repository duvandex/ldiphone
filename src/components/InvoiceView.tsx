import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Printer, Share2, CheckCircle2, ChevronLeft, ShieldCheck } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { fmt, cn } from '../lib/utils';
import Logo from './Logo';

export default function InvoiceView({ appData, isPublic = false }: { appData: ReturnType<typeof useAppData>, isPublic?: boolean }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data, findProductPublicly, searchedProduct, loading } = appData;
  
  const [selectedId, setSelectedId] = useState<string>(id || searchParams.get('id') || '');
  const [imeiSearch, setImeiSearch] = useState('');
  const [copied, setCopied] = useState(false);

  // Sync selectedId with URL param and fetch if needed
  useEffect(() => {
    const tid = id || searchParams.get('id');
    if (tid) {
      setSelectedId(tid);
      // If not in memory, fetch it
      const found = data.products.find(p => p.id === tid);
      if (!found) {
        findProductPublicly(tid);
      }
    }
  }, [id, searchParams, data.products]);

  // Auto-detect product by IMEI
  useEffect(() => {
    if (imeiSearch.length >= 8) {
      const found = data.products.find(p => p.status === 'sold' && p.imei === imeiSearch);
      if (found) {
        setSelectedId(found.id);
      } else {
        // Search in DB
        findProductPublicly(imeiSearch);
      }
    }
  }, [imeiSearch, data.products]);

  // If public, we might be getting data from a 'd' param (Base64 encoded)
  const publicDataParam = searchParams.get('d');
  let publicInvoiceData = null;
  if (isPublic && publicDataParam) {
    try {
      publicInvoiceData = JSON.parse(decodeURIComponent(escape(atob(publicDataParam))));
    } catch (e) {
      console.error('Error decoding public invoice data', e);
    }
  }

  const product = publicInvoiceData || data.products.find(p => p.id === selectedId) || (searchedProduct?.id === selectedId ? searchedProduct : null) || searchedProduct;

  const generatePublicLink = () => {
    if (!product) return '';
    return `${window.location.origin}/view-invoice/${product.id}`;
  };

  const publicLink = generatePublicLink();

  const handleCopy = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isPublic && !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 space-y-4">
        <div className="text-6xl text-muted">?</div>
        <h2 className="text-xl font-bold text-muted-foreground">Factura no encontrada</h2>
        <p className="text-muted-foreground text-sm max-w-xs text-center">No pudimos encontrar la factura solicitada. Por favor verifica el enlace.</p>
        <Button variant="outline" onClick={() => navigate('/catalog')}>Volver al Catálogo</Button>
      </div>
    );
  }

  return (
    <div className={cn("max-w-2xl mx-auto space-y-6 pb-12", isPublic ? "p-4 md:pt-8" : "")}>
      {isPublic && (
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="print:hidden">
          <ChevronLeft className="w-4 h-4 mr-1" /> Volver
        </Button>
      )}
      {!isPublic && (
        <Card className="border-none shadow-sm print:hidden bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Generar Factura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label className="text-foreground">Escanear/Buscar IMEI</Label>
                <Input 
                  placeholder="Ingrese IMEI para detectar..." 
                  value={imeiSearch}
                  onChange={(e) => setImeiSearch(e.target.value)}
                  className="bg-muted border-none text-foreground"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-foreground">Seleccionar Venta Manual</Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger className="bg-muted border-none text-foreground">
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.products.filter(p => p.status === 'sold').map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.invoiceNumber} — {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {product ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Invoice Document */}
          <Card className="border-none shadow-lg overflow-hidden bg-card text-card-foreground print:shadow-none print:border print:bg-white print:text-black">
            <CardContent className="p-8 space-y-8">
              {/* Header */}
              <div className="flex flex-col items-center gap-4 text-center">
                <Logo size="xl" />
                <div className="space-y-1">
                  <h1 className="text-xl font-black tracking-tighter text-foreground leading-none uppercase print:text-black">{data.settings.companyName}</h1>
                  <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-relaxed">
                    FACTURACIÓN ELECTRÓNICA Y GARANTÍAS<br />
                    COMPRA Y VENTA DE DISPOSITIVOS MÓVILES
                  </div>
                </div>
              </div>

              <Separator className="bg-border print:bg-slate-200" />

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-y-4 text-xs">
                <div className="space-y-1">
                  <div className="text-[9px] uppercase font-bold text-muted-foreground">Factura N°</div>
                  <div className="font-bold text-sm text-foreground print:text-black">{product.invoiceNumber}</div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="text-[9px] uppercase font-bold text-muted-foreground">Fecha</div>
                  <div className="font-medium text-foreground print:text-black">{product.saleDate || new Date().toLocaleDateString()}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[9px] uppercase font-bold text-muted-foreground">Cliente</div>
                  <div className="font-semibold text-foreground print:text-black">{product.buyer || 'Consumidor Final'}</div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="text-[9px] uppercase font-bold text-muted-foreground">Estado</div>
                  <div className="text-emerald-600 font-bold uppercase tracking-tighter">Pagado</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-4">
                <div className="grid grid-cols-12 text-[10px] uppercase font-bold text-muted-foreground px-2">
                  <div className="col-span-6">Descripción</div>
                  <div className="col-span-2 text-center">Cant.</div>
                  <div className="col-span-4 text-right">Total</div>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-12 items-center bg-muted/50 p-3 rounded-lg border border-border print:bg-slate-50 print:border-slate-100">
                    <div className="col-span-6">
                      <div className="text-sm font-bold text-foreground print:text-black">{product.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">IMEI: {product.imei || 'No registrado'}</div>
                      <div className="text-[9px] text-muted-foreground/80 mt-0.5">P. Unitario: {fmt(product.salePrice || 0)}</div>
                    </div>
                    <div className="col-span-2 text-center text-xs font-bold text-foreground print:text-black">
                      x{product.quantity || 1}
                    </div>
                    <div className="col-span-4 text-right font-mono font-bold text-sm text-foreground print:text-black">
                      {fmt((product.salePrice || 0) * (product.quantity || 1))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-end pt-4">
                <div className="w-full max-w-[200px] space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono text-foreground print:text-black">{fmt((product.salePrice || 0) * (product.quantity || 1))}</span>
                  </div>
                  <Separator className="bg-border print:bg-slate-200" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold uppercase text-foreground print:text-black">Total</span>
                    <span className="text-xl font-black tracking-tighter text-foreground print:text-black">{fmt((product.salePrice || 0) * (product.quantity || 1))}</span>
                  </div>
                </div>
              </div>

              {/* Warranty Box */}
              <div className="bg-secondary text-secondary-foreground rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4" />
                  Garantía y Condiciones
                </div>
                <div className="space-y-3">
                  <div className="text-[10px] font-black bg-foreground/10 w-fit px-3 py-1 rounded-full text-foreground uppercase tracking-widest print:bg-black/10 print:text-black">
                    Vigencia: {product.warrantyMonths || data.settings.defaultWarrantyMonths} Meses 
                    {product.warrantyExpiration && ` (Hasta: ${product.warrantyExpiration})`}
                  </div>
                  <div className="text-[9px] text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium border-l-2 border-emerald-500/30 pl-3">
                    {product.warrantyTerms || data.settings.warrantyTerms}
                  </div>
                </div>
              </div>

              {/* QR and Footer */}
              <div className="flex flex-col items-center space-y-4 pt-4">
                {publicLink ? (
                  <>
                    <div className="p-3 bg-white border border-border rounded-2xl shadow-sm dark:bg-slate-100">
                      <QRCodeSVG value={publicLink} size={100} level="H" />
                    </div>
                    <div className="text-center space-y-1">
                      <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Escanea para ver en línea</div>
                      <div className="text-[8px] text-muted-foreground/60 font-mono break-all max-w-[240px]">{publicLink}</div>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                    <div className="text-[10px] font-bold text-rose-600 uppercase tracking-tight">Error de Enlace</div>
                    <div className="text-[9px] text-rose-500 mt-1">No se pudo generar el enlace para ver en línea.</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {!isPublic && (
            <div className="flex flex-wrap gap-3 justify-center print:hidden">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full border-border text-foreground" 
                onClick={handleCopy}
                disabled={!publicLink}
              >
                {copied ? <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copiado' : 'Copiar Link'}
              </Button>
              <Button variant="outline" size="sm" className="rounded-full border-border text-foreground" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button 
                size="sm" 
                className="rounded-full bg-primary text-primary-foreground" 
                disabled={!publicLink}
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: 'Factura LDIPHONE', url: publicLink });
                  } else {
                    handleCopy();
                  }
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground print:hidden">
          Selecciona una venta para ver la factura
        </div>
      )}
    </div>
  );
}
