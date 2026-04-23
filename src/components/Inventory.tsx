import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Search, Plus, Trash2, ShoppingCart, Pencil, Camera, X, ImagePlus, Smartphone, ShieldCheck } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { Investor, Product, PaymentMethod } from '../types';
import { fmt, cn } from '../lib/utils';
import IMEIScanner from './IMEIScanner';

const ImageUploader = ({ 
  images, 
  onUpload, 
  onRemove 
}: { 
  images: string[], 
  onUpload: (base64: string) => void, 
  onRemove: (index: number) => void 
}) => {
  const localFileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length >= 4) return;
    const remainingSlots = 4 - images.length;
    const filesArray = Array.from(files).slice(0, remainingSlots);

    filesArray.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max_size = 1000; // Optimal size for storage vs quality

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6); // 60% quality is plenty for mobile preview
          onUpload(compressedBase64);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
    
    if (localFileInputRef.current) localFileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <Label>Fotos del Producto (Máx 4)</Label>
      <div className="grid grid-cols-4 gap-2">
        {images.map((img, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
            <img src={img} className="w-full h-full object-cover" alt="preview" />
            <button 
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-1 right-1 p-1 bg-white/80 rounded-full shadow-sm hover:bg-white text-rose-500"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {images.length < 4 && (
          <button
            type="button"
            onClick={() => localFileInputRef.current?.click()}
            className="aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-400 gap-1 transition-colors"
          >
            <ImagePlus className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold">Subir</span>
          </button>
        )}
      </div>
      <input 
        type="file" 
        accept="image/*" 
        multiple 
        className="hidden" 
        ref={localFileInputRef} 
        onChange={handleImageUpload} 
      />
    </div>
  );
};
export default function Inventory({ appData }: { appData: ReturnType<typeof useAppData> }) {
  const { data, addProduct, deleteProduct, updateProduct, generateInvoiceNumber } = appData;
  const [search, setSearch] = useState('');
  const [investorFilter, setInvestorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSellOpen, setIsSellOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeScannerMode, setActiveScannerMode] = useState<'add' | 'edit' | null>(null);

  // Form states
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    imei: '',
    provider: '',
    investor: 'Duvan' as Investor,
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0,
    salePrice: 0,
    quantity: 1,
    status: 'stock',
    images: [],
    purchaseMethod: 'none',
    warrantyMonths: 0,
    warrantyExpiration: '',
    description: '',
  });

  const [editProductState, setEditProductState] = useState<Product | null>(null);

  // Initialize new product with defaults from settings
  React.useEffect(() => {
    if (isAddOpen) {
      setNewProduct(prev => ({
        ...prev,
        warrantyMonths: data.settings.defaultWarrantyMonths
      }));
    }
  }, [isAddOpen, data.settings.defaultWarrantyMonths]);

  const [sellData, setSellData] = useState<{
    salePrice: number | string;
    saleDate: string;
    buyer: string;
    sellQuantity: number | string;
    saleMethod: PaymentMethod;
    warrantyMonths: number;
    warrantyExpiration: string;
  }>({
    salePrice: '',
    saleDate: new Date().toISOString().split('T')[0],
    buyer: '',
    sellQuantity: 1,
    saleMethod: 'Efectivo',
    warrantyMonths: data.settings.defaultWarrantyMonths,
    warrantyExpiration: '',
  });

  // Calculate warranty expiration when months change
  React.useEffect(() => {
    if (sellData.warrantyMonths > 0) {
      const date = new Date(sellData.saleDate || new Date());
      date.setMonth(date.getMonth() + sellData.warrantyMonths);
      setSellData(prev => ({ ...prev, warrantyExpiration: date.toISOString().split('T')[0] }));
    }
  }, [sellData.warrantyMonths, sellData.saleDate]);

  const filteredProducts = data.products.filter(p => {
    if (p.status === 'sold') return false;

    const matchesSearch = (p.name?.toLowerCase() || '').includes(search.toLowerCase()) || 
                         (p.imei || '').includes(search) ||
                         (p.provider || '').toLowerCase().includes(search.toLowerCase());
    const matchesInvestor = investorFilter === 'all' || p.investor === investorFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesInvestor && matchesStatus;
  });

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.purchasePrice) return;
    addProduct(newProduct as any);
    setNewProduct({
      name: '',
      imei: '',
      provider: '',
      investor: 'Duvan',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: 0,
      salePrice: 0,
      quantity: 1,
      images: [],
      purchaseMethod: 'none',
      warrantyMonths: 0,
      warrantyExpiration: '',
      description: '',
    });
    setIsAddOpen(false);
  };

  const handleEditProduct = async () => {
    if (!editProductState) return;
    try {
      await updateProduct(editProductState.id, editProductState);
      setIsEditOpen(false);
      setEditProductState(null);
    } catch (err: any) {
      alert("Error al actualizar producto: " + err.message);
    }
  };

  const handleSellProduct = async () => {
    const sPrice = typeof sellData.salePrice === 'string' ? parseFloat(sellData.salePrice) : sellData.salePrice;
    const sQty = typeof sellData.sellQuantity === 'string' ? parseInt(sellData.sellQuantity) : sellData.sellQuantity;

    if (!selectedProduct || isNaN(sPrice) || sPrice <= 0) {
      alert("Por favor completa un precio de venta válido.");
      return;
    }
    
    try {
      // El número de factura ahora se genera automáticamente dentro de la transacción en updateProduct
      await updateProduct(selectedProduct.id, {
        ...sellData,
        salePrice: sPrice,
        sellQuantity: isNaN(sQty) ? 1 : sQty,
        status: 'sold',
        warrantyMonths: sellData.warrantyMonths,
        warrantyExpiration: sellData.warrantyExpiration,
        warrantyTerms: data.settings.warrantyTerms,
      });
      setIsSellOpen(false);
      setSelectedProduct(null);
    } catch (err: any) {
      alert("No se pudo completar la venta: " + err.message);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    try {
      await deleteProduct(selectedProduct.id);
      setIsDeleteOpen(false);
      setSelectedProduct(null);
    } catch (err: any) {
      alert("No se pudo eliminar el producto: " + err.message);
    }
  };

  const handleImageUpload = (base64: string, mode: 'add' | 'edit') => {
    if (mode === 'add') {
      setNewProduct(prev => ({ ...prev, images: [...(prev.images || []), base64].slice(0, 4) }));
    } else {
      setEditProductState(prev => prev ? ({ ...prev, images: [...(prev.images || []), base64].slice(0, 4) }) : null);
    }
  };

  const removeImage = (index: number, mode: 'add' | 'edit') => {
    if (mode === 'add') {
      setNewProduct(prev => ({ ...prev, images: (prev.images || []).filter((_, i) => i !== index) }));
    } else {
      setEditProductState(prev => prev ? ({ ...prev, images: (prev.images || []).filter((_, i) => i !== index) }) : null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Controls */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-4 w-full">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <Input
              placeholder="Buscar por nombre, IMEI o proveedor..."
              className="pl-11 bg-white border-none shadow-sm h-12 rounded-2xl ring-offset-background focus-visible:ring-2 focus-visible:ring-slate-900 transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <Select value={investorFilter} onValueChange={setInvestorFilter}>
              <SelectTrigger className="flex-1 lg:w-[180px] bg-white border-none shadow-sm h-12 rounded-2xl font-bold text-xs uppercase tracking-widest px-4">
                <SelectValue placeholder="Inversor" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Duvan">Duvan</SelectItem>
                <SelectItem value="Lina">Lina</SelectItem>
                <SelectItem value="Santiago">Santiago</SelectItem>
                <SelectItem value="Johana">Johana</SelectItem>
                <SelectItem value="Pool">Pool</SelectItem>
                <SelectItem value="Santa Maria">Santa María</SelectItem>
                <SelectItem value="Thomas">Thomas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1 lg:w-[160px] bg-white border-none shadow-sm h-12 rounded-2xl font-bold text-xs uppercase tracking-widest px-4">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="stock">En Stock</SelectItem>
                <SelectItem value="out_of_stock">Agotado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger
            render={
              <Button className="w-full lg:w-fit lg:px-12 bg-slate-900 hover:bg-slate-800 h-12 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-95 ml-auto">
                <Plus className="w-5 h-5 mr-3" /> Nuevo Producto
              </Button>
            }
          />
          {/* ... Dialog content remains mostly same but with rounded-3xl and spacing ... */}
          <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto rounded-3xl p-8 border-none shadow-2xl">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-black tracking-tight uppercase">Registrar Dispositivo</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6">
              <ImageUploader 
                images={newProduct.images || []} 
                onUpload={(b64) => handleImageUpload(b64, 'add')} 
                onRemove={(idx) => removeImage(idx, 'add')} 
              />
              
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre del Dispositivo *</Label>
                <Input id="name" placeholder="Ej: iPhone 15 Pro Max" className="rounded-xl border-slate-100 h-11" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="desc" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción / Detalles</Label>
                <Textarea id="desc" placeholder="Estado, color, detalles adicionales..." className="rounded-xl border-slate-100 min-h-[100px]" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="imei" className="text-[10px] font-black uppercase tracking-widest text-slate-400">IMEI / Serial</Label>
                  <div className="flex gap-2">
                    <Input id="imei" placeholder="15 dígitos" className="rounded-xl border-slate-100 h-11 flex-1" value={newProduct.imei} onChange={e => setNewProduct({...newProduct, imei: e.target.value})} />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => { setActiveScannerMode('add'); setIsScannerOpen(true); }}
                      className="h-11 w-11 rounded-xl border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100"
                    >
                      <Camera className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="provider" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Proveedor</Label>
                  <Input id="provider" placeholder="Origen" className="rounded-xl border-slate-100 h-11" value={newProduct.provider} onChange={e => setNewProduct({...newProduct, provider: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inversor *</Label>
                  <Select value={newProduct.investor} onValueChange={v => setNewProduct({...newProduct, investor: v as Investor})}>
                    <SelectTrigger className="rounded-xl border-slate-100 h-11 font-bold text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 transition-all">
                      <SelectItem value="Duvan">Duvan</SelectItem>
                      <SelectItem value="Lina">Lina</SelectItem>
                      <SelectItem value="Santiago">Santiago</SelectItem>
                      <SelectItem value="Johana">Johana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha Compra</Label>
                  <Input id="date" type="date" className="rounded-xl border-slate-100 h-11" value={newProduct.purchaseDate} onChange={e => setNewProduct({...newProduct, purchaseDate: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="pc" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inversión (u) *</Label>
                  <Input id="pc" type="number" placeholder="0" className="rounded-xl border-slate-100 h-11" value={newProduct.purchasePrice || ''} onChange={e => setNewProduct({...newProduct, purchasePrice: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="qty" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cantidad *</Label>
                  <Input id="qty" type="number" min="1" className="rounded-xl border-slate-100 h-11" value={newProduct.quantity} onChange={e => setNewProduct({...newProduct, quantity: parseInt(e.target.value) || 1})} />
                </div>
              </div>

              <div className="grid gap-2 border-t border-slate-50 pt-4">
                <Label htmlFor="pv" className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Precio Sugerido Venta</Label>
                <Input id="pv" type="number" placeholder="0" className="rounded-xl border-emerald-100 bg-emerald-50/30 h-11 font-black text-emerald-700" value={newProduct.salePrice || ''} onChange={e => setNewProduct({...newProduct, salePrice: parseFloat(e.target.value) || 0})} />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="warranty" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Garantía (Meses)</Label>
                  <Input id="warranty" type="number" min="0" placeholder="0" className="rounded-xl border-slate-100 h-11" value={newProduct.warrantyMonths} onChange={e => setNewProduct({...newProduct, warrantyMonths: parseInt(e.target.value) || 0})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="w-exp" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vencimiento</Label>
                  <Input id="w-exp" type="date" className="rounded-xl border-slate-100 h-11" value={newProduct.warrantyExpiration} onChange={e => setNewProduct({...newProduct, warrantyExpiration: e.target.value})} />
                </div>
              </div>

              <Button onClick={handleAddProduct} className="w-full bg-slate-900 hover:bg-slate-800 h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-900/10 mt-2">
                Finalizar Registro
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block card-premium border-none shadow-sm rounded-[2rem] overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-b border-slate-100">
                <TableHead className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-8 h-14">Detalle Dispositivo</TableHead>
                <TableHead className="text-[10px] uppercase font-black tracking-widest text-slate-400 text-center">Qty</TableHead>
                <TableHead className="text-[10px] uppercase font-black tracking-widest text-slate-400">Identificación</TableHead>
                <TableHead className="text-[10px] uppercase font-black tracking-widest text-slate-400 text-right">Inversión (u)</TableHead>
                <TableHead className="text-[10px] uppercase font-black tracking-widest text-slate-400 text-right">Profit Est.</TableHead>
                <TableHead className="text-[10px] uppercase font-black tracking-widest text-slate-400 text-center">Estado</TableHead>
                <TableHead className="text-[10px] uppercase font-black tracking-widest text-slate-400 text-right pr-8">Operaciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p) => {
                const profitPerUnit = (p.salePrice || 0) - p.purchasePrice;
                const totalProfit = profitPerUnit * (p.quantity || 1);
                return (
                  <TableRow key={p.id} className="group border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border-2 border-white shadow-sm transition-transform group-hover:scale-105 duration-300">
                          {p.images && p.images.length > 0 ? (
                            <img src={p.images[0]} className="w-full h-full object-cover" alt={p.name} />
                          ) : (
                            <div className="text-slate-300 bg-white w-full h-full flex items-center justify-center">
                               <Smartphone className="w-6 h-6 opacity-30" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-black text-slate-900 tracking-tight group-hover:text-primary transition-colors">{p.name}</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                             {p.investor}
                             <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                             {p.purchaseDate}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 text-center">
                      <div className="text-xs font-black bg-white border border-slate-100 shadow-sm px-3 py-1.5 rounded-xl w-fit mx-auto text-slate-900">
                        {p.quantity || 1}
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">IMEI / ID</div>
                      <div className="text-xs font-bold text-slate-600 font-mono tracking-tighter">{p.imei || p.id.slice(0,8).toUpperCase()}</div>
                    </TableCell>
                    <TableCell className="py-5 text-right">
                      <div className="text-sm font-black text-slate-900">{fmt(p.purchasePrice)}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Total: {fmt(p.purchasePrice * (p.quantity || 1))}</div>
                    </TableCell>
                    <TableCell className="py-5 text-right">
                       <div className="text-sm font-black text-emerald-600">+{fmt(totalProfit)}</div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Neto Sugerido</div>
                    </TableCell>
                    <TableCell className="py-5 text-center">
                      <Badge variant={p.status === 'stock' ? 'secondary' : 'default'} className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border-none shadow-sm",
                        p.status === 'stock' ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {p.status === 'stock' ? 'DISPONIBLE' : 'AGOTADO'}
                      </Badge>
                      {p.warrantyMonths ? (
                        <div className="text-[8px] font-black text-blue-400 mt-1.5 uppercase tracking-tighter flex items-center justify-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> {p.warrantyMonths} MESES
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="py-5 text-right pr-8">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl shadow-none hover:shadow-sm transition-all"
                          onClick={() => {
                            setEditProductState(p);
                            setIsEditOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {p.status === 'stock' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-emerald-500 hover:text-white hover:bg-emerald-500 rounded-xl shadow-none hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                            onClick={() => {
                              setSelectedProduct(p);
                              setSellData({
                                salePrice: p.salePrice || 0,
                                saleDate: new Date().toISOString().split('T')[0],
                                buyer: '',
                                sellQuantity: 1,
                                saleMethod: 'Efectivo',
                              });
                              setIsSellOpen(true);
                            }}
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 text-slate-400 hover:text-rose-500 hover:bg-white rounded-xl shadow-none hover:shadow-sm"
                          onClick={() => {
                            setSelectedProduct(p);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Product List - Mobile View (Cards) */}
      <div className="grid grid-cols-1 md:hidden gap-6">
        {filteredProducts.map((p) => {
          const profitPerUnit = (p.salePrice || 0) - p.purchasePrice;
          return (
            <Card key={p.id} className="card-premium border-none shadow-sm overflow-hidden rounded-3xl">
              <div className="flex flex-col">
                <div className="relative aspect-video bg-slate-50 flex items-center justify-center overflow-hidden">
                  {p.images && p.images.length > 0 ? (
                    <img src={p.images[0]} className="w-full h-full object-cover" alt={p.name} />
                  ) : (
                    <Smartphone className="w-12 h-12 text-slate-200" />
                  )}
                  <Badge className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-slate-900 border-none font-black text-[9px] tracking-widest px-3 rounded-full">
                     {p.investor}
                  </Badge>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0">
                      <h3 className="font-black text-lg text-slate-900 tracking-tight truncate">{p.name}</h3>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{p.id.slice(0, 8)}</div>
                    </div>
                    <Badge variant={p.status === 'stock' ? 'secondary' : 'default'} className={cn(
                      "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full",
                      p.status === 'stock' ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {p.status === 'stock' ? 'STOCK' : 'OUT'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="space-y-1">
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Inversión</div>
                      <div className="text-sm font-black text-slate-900">{fmt(p.purchasePrice)}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Stock Disp.</div>
                      <div className="text-sm font-black text-blue-600">{p.quantity} Unid.</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                    <Button 
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest h-12"
                      onClick={() => {
                        setEditProductState(p);
                        setIsEditOpen(true);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                    </Button>
                    {p.status === 'stock' && (
                        <Button 
                            className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20"
                            onClick={() => {
                                setSelectedProduct(p);
                                setSellData({
                                    salePrice: p.salePrice || 0,
                                    saleDate: new Date().toISOString().split('T')[0],
                                    buyer: '',
                                    sellQuantity: 1,
                                    saleMethod: 'Efectivo',
                                });
                                setIsSellOpen(true);
                            }}
                        >
                            <ShoppingCart className="w-5 h-5" />
                        </Button>
                    )}
                    <Button 
                      variant="outline"
                      className="w-12 h-12 border-2 border-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 rounded-2xl transition-colors"
                      onClick={() => {
                        setSelectedProduct(p);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Product Dialog - Empty as it is handled by the Dialog block above */}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black tracking-tight uppercase">Editar Producto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6">
            <ImageUploader 
              images={editProductState?.images || []} 
              onUpload={(b64) => handleImageUpload(b64, 'edit')} 
              onRemove={(idx) => removeImage(idx, 'edit')} 
            />
            
            <div className="grid gap-2">
              <Label htmlFor="e-name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre del Producto</Label>
              <Input id="e-name" className="rounded-xl border-slate-100 h-11" value={editProductState?.name || ''} onChange={e => setEditProductState(prev => prev ? ({...prev, name: e.target.value}) : null)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="e-desc" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción</Label>
              <Textarea id="e-desc" className="rounded-xl border-slate-100 min-h-[100px]" value={editProductState?.description || ''} onChange={e => setEditProductState(prev => prev ? ({...prev, description: e.target.value}) : null)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="e-imei" className="text-[10px] font-black uppercase tracking-widest text-slate-400">IMEI</Label>
                <div className="flex gap-2">
                  <Input id="e-imei" className="rounded-xl border-slate-100 h-11 flex-1" value={editProductState?.imei || ''} onChange={e => setEditProductState(prev => prev ? ({...prev, imei: e.target.value}) : null)} />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={() => { setActiveScannerMode('edit'); setIsScannerOpen(true); }}
                    className="h-11 w-11 rounded-xl border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100"
                  >
                    <Camera className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="e-provider" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Proveedor</Label>
                <Input id="e-provider" className="rounded-xl border-slate-100 h-11" value={editProductState?.provider || ''} onChange={e => setEditProductState(prev => prev ? ({...prev, provider: e.target.value}) : null)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="e-pc" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inversión (u)</Label>
                <Input id="e-pc" type="number" className="rounded-xl border-slate-100 h-11" value={editProductState?.purchasePrice || 0} onChange={e => setEditProductState(prev => prev ? ({...prev, purchasePrice: parseFloat(e.target.value) || 0}) : null)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="e-qty" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cantidad</Label>
                <Input id="e-qty" type="number" className="rounded-xl border-slate-100 h-11" value={editProductState?.quantity || 1} onChange={e => setEditProductState(prev => prev ? ({...prev, quantity: parseInt(e.target.value) || 1}) : null)} />
              </div>
            </div>

            <div className="grid gap-2 border-t border-slate-50 pt-4">
              <Label htmlFor="e-pv" className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Precio Venta Sugerido</Label>
              <Input id="e-pv" type="number" className="rounded-xl border-emerald-100 bg-emerald-50/30 h-11 font-black text-emerald-700" value={editProductState?.salePrice || 0} onChange={e => setEditProductState(prev => prev ? ({...prev, salePrice: parseFloat(e.target.value) || 0}) : null)} />
            </div>

            <div className="grid gap-2 border-t border-slate-50 pt-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado del Producto</Label>
              <Select value={editProductState?.status || 'stock'} onValueChange={v => setEditProductState(prev => prev ? ({...prev, status: v as any}) : null)}>
                <SelectTrigger className="rounded-xl border-slate-100 h-11 font-bold text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100">
                  <SelectItem value="stock">En Stock</SelectItem>
                  <SelectItem value="out_of_stock">Agotado / No disponible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="e-warranty" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Garantía (Meses)</Label>
                <Input id="e-warranty" type="number" min="0" className="rounded-xl border-slate-100 h-11" value={editProductState?.warrantyMonths || 0} onChange={e => setEditProductState(prev => prev ? ({...prev, warrantyMonths: parseInt(e.target.value) || 0}) : null)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="e-w-exp" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vencimiento</Label>
                <Input id="e-w-exp" type="date" className="rounded-xl border-slate-100 h-11" value={editProductState?.warrantyExpiration || ''} onChange={e => setEditProductState(prev => prev ? ({...prev, warrantyExpiration: e.target.value}) : null)} />
              </div>
            </div>
            
            <Button onClick={handleEditProduct} className="w-full bg-slate-900 hover:bg-slate-800 h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-900/10 mt-2">
               Aplicar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => {
        setIsDeleteOpen(open);
        if (!open) setSelectedProduct(null);
      }}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-rose-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Confirmar Eliminación
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <p className="text-slate-600">
              ¿Estás seguro de que deseas eliminar <strong>{selectedProduct?.name}</strong>?
            </p>
            <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
              Esta acción es permanente y no se podrá recuperar el registro del inventario.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>Eliminar Definitivamente</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSellOpen} onOpenChange={setIsSellOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black tracking-tight uppercase">Registrar Venta</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-100">
                  {selectedProduct?.images?.[0] ? (
                    <img src={selectedProduct.images[0]} className="w-full h-full object-cover" alt={selectedProduct.name} />
                  ) : <Smartphone className="w-full h-full p-3 text-slate-200" />}
               </div>
               <div className="min-w-0">
                  <div className="font-black text-slate-900 truncate">{selectedProduct?.name}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stock: {selectedProduct?.quantity}</div>
               </div>
            </div>
            
            {(selectedProduct?.quantity || 1) > 1 && (
              <div className="grid gap-2">
                <Label htmlFor="sell-qty" className="text-[10px] font-black uppercase tracking-widest text-slate-400">¿Cuántas unidades se venden? *</Label>
                <Input 
                  id="sell-qty" 
                  type="number" 
                  min="1" 
                  max={selectedProduct?.quantity || 1}
                  className="rounded-xl border-slate-100 h-11"
                  value={sellData.sellQuantity} 
                  onChange={e => setSellData({...sellData, sellQuantity: e.target.value})}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="sell-price" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Precio de Venta (Total) *</Label>
              <Input 
                id="sell-price" 
                type="number" 
                className="rounded-xl border-slate-100 h-11 font-black text-emerald-600"
                value={sellData.salePrice} 
                onChange={e => setSellData({...sellData, salePrice: e.target.value})}
                placeholder="0"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sell-date" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha</Label>
                <Input 
                  id="sell-date" 
                  type="date" 
                  className="rounded-xl border-slate-100 h-11"
                  value={sellData.saleDate} 
                  onChange={e => setSellData({...sellData, saleDate: e.target.value})} 
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Medodo Pago *</Label>
                <Select value={sellData.saleMethod} onValueChange={v => setSellData({...sellData, saleMethod: v as PaymentMethod})}>
                  <SelectTrigger className="rounded-xl border-slate-100 h-11 font-bold text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100">
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Bancolombia">Bancolombia</SelectItem>
                    <SelectItem value="Nequi">Nequi</SelectItem>
                    <SelectItem value="Banco de Bogota">Banco de Bogota</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-rose-500">Garantía (Meses)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  className="rounded-xl border-slate-100 h-11"
                  value={sellData.warrantyMonths} 
                  onChange={e => setSellData({...sellData, warrantyMonths: parseInt(e.target.value) || 0})} 
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hasta:</Label>
                <Input 
                  type="date" 
                  className="rounded-xl border-slate-100 h-11 bg-slate-50"
                  value={sellData.warrantyExpiration} 
                  readOnly
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="buyer" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre del Comprador</Label>
              <Input 
                id="buyer" 
                placeholder="Identificación / Nombre" 
                className="rounded-xl border-slate-100 h-11"
                value={sellData.buyer} 
                onChange={e => setSellData({...sellData, buyer: e.target.value})} 
              />
            </div>

            <Button onClick={handleSellProduct} className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-600/10 mt-2">
              Confirmar Venta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isScannerOpen && (
        <IMEIScanner 
          onResult={(imei) => {
            if (activeScannerMode === 'add') {
              setNewProduct(prev => ({ ...prev, imei }));
            } else if (activeScannerMode === 'edit') {
              setEditProductState(prev => prev ? ({ ...prev, imei }) : null);
            }
          }}
          onClose={() => {
            setIsScannerOpen(false);
            setActiveScannerMode(null);
          }}
        />
      )}
    </div>
  );
}
