import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Search, Plus, Trash2, ShoppingCart, Pencil, Camera, X, ImagePlus, Smartphone, ShieldCheck, Users, ExternalLink, Copy, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useCloudinary } from '../hooks/useCloudinary';
import { Investor, Product, PaymentMethod, CoInvestor, Category } from '../types';
import { fmt, cn } from '../lib/utils';
import IMEIScanner from './IMEIScanner';
import { useSearchParams } from 'react-router-dom';

const ImageUploader = ({ 
  images, 
  onUpload, 
  onRemove,
  onReorder,
  uploading
}: { 
  images: string[], 
  onUpload: (urls: string[]) => void, 
  onRemove: (index: number) => void,
  onReorder?: (index: number, direction: 'left' | 'right') => void,
  uploading: boolean
}) => {
  const localFileInputRef = useRef<HTMLInputElement>(null);
  const { uploadMultiple } = useCloudinary();
  const [internalUploading, setInternalUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length >= 4) return;
    const remainingSlots = 4 - images.length;
    const filesArray = Array.from(files).slice(0, remainingSlots) as File[];

    setInternalUploading(true);
    try {
      const urls = await uploadMultiple(filesArray, 'ldiphone/products');
      onUpload(urls);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error al subir imágenes');
    } finally {
      setInternalUploading(false);
    }
    
    if (localFileInputRef.current) localFileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fotos del Producto (Máx 4)</Label>
        <span className="text-[9px] text-muted-foreground font-bold uppercase italic">La primera foto es la principal</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {images.map((img, i) => (
          <div key={i} className={cn(
            "relative group aspect-square rounded-lg overflow-hidden bg-muted border transition-all",
            i === 0 ? "border-primary ring-2 ring-primary/20" : "border-border"
          )}>
            <img src={img} className="w-full h-full object-cover" alt="preview" />
            
            {/* Main Label */}
            {i === 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-[8px] font-black uppercase text-center py-0.5">
                Principal
              </div>
            )}

            {/* Actions */}
            <div className="absolute top-1 right-1 flex flex-col gap-1">
              <button 
                type="button"
                onClick={() => onRemove(i)}
                className="p-1 bg-white/90 rounded-full shadow-sm hover:bg-white text-rose-500 transition-colors"
                title="Eliminar"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Reorder Buttons */}
            {onReorder && images.length > 1 && (
              <div className="absolute inset-x-0 bottom-1 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* We'll show these on hover in a better way if needed, for now just show them if it's possible to move */}
              </div>
            )}

            {/* Overlay reorder controls */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
               {onReorder && i > 0 && (
                 <button
                   type="button"
                   onClick={() => onReorder(i, 'left')}
                   className="p-1.5 bg-white rounded-full text-slate-700 shadow-lg hover:scale-110 transition-transform"
                   title="Mover a la izquierda"
                 >
                   <ArrowLeft className="w-3 h-3" />
                 </button>
               )}
               {onReorder && i < images.length - 1 && (
                 <button
                   type="button"
                   onClick={() => onReorder(i, 'right')}
                   className="p-1.5 bg-white rounded-full text-slate-700 shadow-lg hover:scale-110 transition-transform"
                   title="Mover a la derecha"
                 >
                   <ArrowRight className="w-3 h-3" />
                 </button>
               )}
            </div>
          </div>
        ))}
        {images.length < 4 && (
          <button
            type="button"
            disabled={internalUploading || uploading}
            onClick={() => localFileInputRef.current?.click()}
            className="aspect-square flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-400 gap-1 transition-colors disabled:opacity-50"
          >
            {internalUploading || uploading ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent animate-spin rounded-full" />
            ) : (
              <ImagePlus className="w-5 h-5" />
            )}
            <span className="text-[9px] uppercase font-black">{internalUploading || uploading ? 'Subiendo...' : 'Subir'}</span>
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
  const { uploading } = useCloudinary();
  const [searchParams, setSearchParams] = useSearchParams();
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

  const investors: Investor[] = ['Duvan', 'Lina', 'Santiago', 'Johana', 'Pool', 'Santa Maria', 'Thomas'];

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
    purchaseMethod: 'Efectivo',
    warrantyMonths: 3,
    warrantyExpiration: '',
    description: '',
    category: 'CELULARES',
    isExternal: false,
    coInvestors: []
  });

  const [useCoInvestment, setUseCoInvestment] = useState(false);
  const [coInvList, setCoInvList] = useState<CoInvestor[]>([
    { investor: 'Duvan', percentage: 100, method: 'Efectivo' }
  ]);

  useEffect(() => {
    const dupId = searchParams.get('duplicateProductId');
    if (dupId && data.products.length > 0) {
      const prodToDup = data.products.find(p => p.id === dupId);
      if (prodToDup) {
        handleDuplicate(prodToDup);
        // Clean URL
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, data.products]);

  const addCoInvestor = () => {
    setCoInvList([...coInvList, { investor: 'Lina', percentage: 0, method: 'Efectivo' }]);
  };

  const removeCoInvestor = (idx: number) => {
    setCoInvList(coInvList.filter((_, i) => i !== idx));
  };

  const updateCoInv = (idx: number, updates: Partial<CoInvestor>) => {
    const newList = [...coInvList];
    newList[idx] = { ...newList[idx], ...updates };
    setCoInvList(newList);
  };

  const handleDuplicate = (p: Product) => {
    setNewProduct({
      name: p.name,
      imei: '',
      provider: p.provider || '',
      investor: p.investor,
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: p.purchasePrice,
      salePrice: p.salePrice || 0,
      quantity: 1,
      status: 'stock',
      images: p.images || [],
      purchaseMethod: p.purchaseMethod || 'Efectivo',
      warrantyMonths: p.warrantyMonths || 3,
      warrantyExpiration: '',
      description: p.description || '',
      category: p.category || 'CELULARES',
      isExternal: p.isExternal || false,
      coInvestors: p.coInvestors || []
    });
    
    if (p.coInvestors && p.coInvestors.length > 0) {
      setUseCoInvestment(true);
      setCoInvList(p.coInvestors);
    } else {
      setUseCoInvestment(false);
      setCoInvList([{ investor: 'Duvan', percentage: 100, method: 'Efectivo' }]);
    }

    setIsAddOpen(true);
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.purchasePrice) return;
    
    let finalProduct = { ...newProduct };
    if (useCoInvestment) {
      const totalPct = coInvList.reduce((a, b) => a + b.percentage, 0);
      if (Math.abs(totalPct - 100) > 0.01) {
        alert("La suma de los porcentajes debe ser exactamente 100%");
        return;
      }
      finalProduct.coInvestors = coInvList;
      finalProduct.investor = coInvList[0].investor; // Primary reference
    } else {
      finalProduct.coInvestors = [];
    }

    if (finalProduct.isExternal) {
      finalProduct.investor = 'Duvan'; // Earnings to Duvan
    }

    addProduct(finalProduct as any);
    setIsAddOpen(false);
    // Reset
    setNewProduct({
      name: '', imei: '', provider: '', investor: 'Duvan', 
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: 0, salePrice: 0, quantity: 1, status: 'stock',
      category: 'CELULARES',
      images: [], purchaseMethod: 'Efectivo', warrantyMonths: 3,
      warrantyExpiration: '', description: '', isExternal: false, coInvestors: []
    });
    setUseCoInvestment(false);
    setCoInvList([{ investor: 'Duvan', percentage: 100 }]);
  };

  // ... (keeping search/filter logic same)
  const filteredProducts = data.products.filter(p => {
    if (p.status === 'sold') return false;

    const matchesSearch = (p.name?.toLowerCase() || '').includes(search.toLowerCase()) || 
                         (p.imei || '').includes(search) ||
                         (p.provider || '').toLowerCase().includes(search.toLowerCase()) ||
                         (p.category || '').toLowerCase().includes(search.toLowerCase());
    
    // Check if investorFilter is in any of the coinvestors or the main investor
    const matchesInvestor = investorFilter === 'all' || 
                           (p.investor === investorFilter) || 
                           (p.coInvestors?.some(c => c.investor === investorFilter));
    
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter || (!p.status && statusFilter === 'stock');
    return matchesSearch && matchesInvestor && matchesStatus;
  });

  const [editProductState, setEditProductState] = useState<Product | null>(null);

  const startEditing = (p: Product) => {
    setEditProductState(p);
    if (p.coInvestors && p.coInvestors.length > 0) {
      setUseCoInvestment(true);
      setCoInvList(p.coInvestors);
    } else {
      setUseCoInvestment(false);
      setCoInvList([{ investor: p.investor || 'Duvan', percentage: 100, method: p.purchaseMethod || 'Efectivo' }]);
    }
    setIsEditOpen(true);
  };

  const handleEditProduct = async () => {
    if (!editProductState) return;

    let finalProduct = { ...editProductState };
    if (useCoInvestment) {
      const totalPct = coInvList.reduce((a, b) => a + b.percentage, 0);
      if (Math.abs(totalPct - 100) > 0.01) {
        alert("La suma de los porcentajes debe ser exactamente 100%");
        return;
      }
      finalProduct.coInvestors = coInvList;
      // In a co-investment, we designate the first one as primary for simple filtering
      if (coInvList.length > 0) {
        finalProduct.investor = coInvList[0].investor;
      }
    } else {
      finalProduct.coInvestors = [];
      // investor is already in editProductState from the field
    }

    await updateProduct(editProductState.id, finalProduct);
    setIsEditOpen(false);
  };

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
    warrantyMonths: 3,
    warrantyExpiration: '',
  });

  const sellErrors = {
    price: !sellData.salePrice || Number(sellData.salePrice) <= 0,
    qty: !sellData.sellQuantity || Number(sellData.sellQuantity) <= 0 || Number(sellData.sellQuantity) > (selectedProduct?.quantity || 0)
  };

  const handleSellProduct = async () => {
    const sPrice = typeof sellData.salePrice === 'string' ? parseFloat(sellData.salePrice) : sellData.salePrice;
    const sQty = typeof sellData.sellQuantity === 'string' ? parseInt(sellData.sellQuantity) : sellData.sellQuantity;
    
    if (!selectedProduct) return;

    if (isNaN(sPrice) || sPrice <= 0) {
      alert("Por favor ingresa un precio de venta válido.");
      return;
    }

    if (isNaN(sQty) || sQty <= 0) {
      alert("La cantidad debe ser mayor a 0.");
      return;
    }

    if (sQty > (selectedProduct.quantity || 0)) {
      alert(`No hay suficiente stock disponible. (Stock actual: ${selectedProduct.quantity})`);
      return;
    }
    
    try {
      await updateProduct(selectedProduct.id, {
        ...sellData,
        salePrice: sPrice,
        sellQuantity: sQty,
        status: 'sold',
        warrantyTerms: data.settings.warrantyTerms,
      });
      setIsSellOpen(false);
      setSelectedProduct(null);
    } catch (err: any) {
      alert("Error al procesar la venta: " + err.message);
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

  const handleImageUploadCloudinary = (urls: string[], mode: 'add' | 'edit') => {
    if (mode === 'add') {
      setNewProduct(prev => ({ ...prev, images: [...(prev.images || []), ...urls].slice(0, 4) }));
    } else {
      setEditProductState(prev => prev ? ({ ...prev, images: [...(prev.images || []), ...urls].slice(0, 4) }) : null);
    }
  };

  const removeImage = (index: number, mode: 'add' | 'edit') => {
    if (mode === 'add') {
      setNewProduct(prev => ({ ...prev, images: (prev.images || []).filter((_, i) => i !== index) }));
    } else {
      setEditProductState(prev => prev ? ({ ...prev, images: (prev.images || []).filter((_, i) => i !== index) }) : null);
    }
  };

  const reorderImages = (index: number, direction: 'left' | 'right', mode: 'add' | 'edit') => {
    const list = mode === 'add' ? [...(newProduct.images || [])] : [...(editProductState?.images || [])];
    if (direction === 'left' && index > 0) {
      const temp = list[index - 1];
      list[index - 1] = list[index];
      list[index] = temp;
    } else if (direction === 'right' && index < list.length - 1) {
      const temp = list[index + 1];
      list[index + 1] = list[index];
      list[index] = temp;
    }
    
    if (mode === 'add') {
      setNewProduct(prev => ({ ...prev, images: list }));
    } else {
      setEditProductState(prev => prev ? ({ ...prev, images: list }) : null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Controls */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-4 w-full">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <Input
              placeholder="Buscar por nombre, IMEI o proveedor..."
              className="pl-11 bg-card border-none shadow-sm h-12 rounded-2xl ring-offset-background focus-visible:ring-2 focus-visible:ring-primary transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <Select value={investorFilter} onValueChange={setInvestorFilter}>
              <SelectTrigger className="flex-1 lg:w-[180px] bg-card border-none shadow-sm h-12 rounded-2xl font-bold text-xs uppercase tracking-widest px-4">
                <SelectValue placeholder="Inversor" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border">
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
              <Button className="w-full lg:w-fit lg:px-12 bg-primary text-primary-foreground h-12 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 ml-auto">
                <Plus className="w-5 h-5 mr-3" /> Nuevo Producto
              </Button>
            }
          />
          {/* ... Dialog content remains mostly same but with rounded-3xl and spacing ... */}
          <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto rounded-3xl p-8 border-none shadow-2xl bg-card">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-black tracking-tight uppercase text-foreground">Registrar Dispositivo</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6">
              <ImageUploader 
                images={newProduct.images || []} 
                onUpload={(urls) => handleImageUploadCloudinary(urls, 'add')} 
                onRemove={(idx) => removeImage(idx, 'add')} 
                onReorder={(idx, dir) => reorderImages(idx, dir, 'add')}
                uploading={uploading}
              />
              
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre del Dispositivo *</Label>
                <Input id="name" placeholder="Ej: iPhone 15 Pro Max" className="rounded-xl border-border h-11" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="desc" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción / Detalles</Label>
                <Textarea id="desc" placeholder="Estado, color, detalles adicionales..." className="rounded-xl border-slate-100 min-h-[100px]" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoría</Label>
                  <Select value={newProduct.category} onValueChange={v => setNewProduct({...newProduct, category: v as Category})}>
                    <SelectTrigger className="rounded-xl border-slate-100 h-11 font-bold text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100">
                      <SelectItem value="CELULARES">CELULARES</SelectItem>
                      <SelectItem value="TABLETS">TABLETS</SelectItem>
                      <SelectItem value="RELOJ INTELIGENTES">RELOJ INTELIGENTES</SelectItem>
                      <SelectItem value="AURICULARES">AURICULARES</SelectItem>
                      <SelectItem value="ACCESORIOS">ACCESORIOS</SelectItem>
                      <SelectItem value="Other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              </div>

              <div className="grid gap-2">
                <Label htmlFor="provider" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Proveedor</Label>
                <Input id="provider" placeholder="Origen" className="rounded-xl border-slate-100 h-11" value={newProduct.provider} onChange={e => setNewProduct({...newProduct, provider: e.target.value})} />
              </div>

              <div className="flex flex-wrap gap-6 border-t border-slate-50 pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="is-external" 
                    checked={newProduct.isExternal} 
                    onCheckedChange={(v) => setNewProduct({...newProduct, isExternal: !!v})} 
                  />
                  <Label htmlFor="is-external" className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1.5 cursor-pointer">
                    <ExternalLink className="w-3 h-3" /> Producto Externo (Sin Stock)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="is-co-inv" 
                    checked={useCoInvestment} 
                    onCheckedChange={(v) => setUseCoInvestment(!!v)} 
                  />
                  <Label htmlFor="is-co-inv" className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1.5 cursor-pointer">
                    <Users className="w-3 h-3" /> Inversión Compartida
                  </Label>
                </div>
              </div>

              {!newProduct.isExternal && !useCoInvestment && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inversor *</Label>
                    <Select value={newProduct.investor} onValueChange={v => setNewProduct({...newProduct, investor: v as Investor})}>
                      <SelectTrigger className="rounded-xl border-slate-100 h-11 font-bold text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100 transition-all">
                        {investors.map(inv => <SelectItem key={inv} value={inv}>{inv}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Método Pago</Label>
                    <Select value={newProduct.purchaseMethod} onValueChange={v => setNewProduct({...newProduct, purchaseMethod: v as PaymentMethod})}>
                      <SelectTrigger className="rounded-xl border-slate-100 h-11 font-bold text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100">
                        <SelectItem value="none">Ninguno / Efectivo</SelectItem>
                        <SelectItem value="Bancolombia">Bancolombia</SelectItem>
                        <SelectItem value="Nequi">Nequi</SelectItem>
                        <SelectItem value="Banco de Bogota">Banco de Bogotá</SelectItem>
                        <SelectItem value="Cripto (USDT)">Cripto (USDT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {useCoInvestment && !newProduct.isExternal && (
                <div className="space-y-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-blue-600">Reparto de Inversión (%)</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={addCoInvestor} className="h-7 text-[9px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-100 px-3">
                      <Plus className="w-3 h-3 mr-1" /> Añadir Socio
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {coInvList.map((co, idx) => (
                      <div key={idx} className="space-y-2 p-3 bg-white rounded-2xl border border-blue-50 shadow-sm">
                        <div className="flex gap-2">
                          <Select value={co.investor} onValueChange={v => updateCoInv(idx, { investor: v as Investor })}>
                            <SelectTrigger className="flex-1 rounded-xl border-blue-100 h-10 font-bold text-[11px] bg-slate-50/50"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {investors.map(inv => <SelectItem key={inv} value={inv}>{inv}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <div className="relative w-24">
                            <Input 
                              type="number" 
                              className="rounded-xl border-blue-100 h-10 font-black text-xs pl-3 pr-6 bg-slate-50/50" 
                              value={co.percentage} 
                              onChange={e => updateCoInv(idx, { percentage: parseFloat(e.target.value) || 0 })}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-400">%</span>
                          </div>
                          {coInvList.length > 1 && (
                            <Button variant="ghost" size="icon" onClick={() => removeCoInvestor(idx)} className="h-10 w-10 text-rose-500 hover:bg-rose-50 rounded-xl">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 px-1">
                          <Label className="text-[9px] font-black uppercase text-slate-400 whitespace-nowrap">Origen del Capital:</Label>
                          <Select value={co.method} onValueChange={v => updateCoInv(idx, { method: v as PaymentMethod })}>
                            <SelectTrigger className="flex-1 h-8 rounded-lg border-blue-50 bg-white text-[10px] font-bold"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Efectivo">Efectivo</SelectItem>
                              <SelectItem value="Bancolombia">Bancolombia</SelectItem>
                              <SelectItem value="Nequi">Nequi</SelectItem>
                              <SelectItem value="Banco de Bogota">Banco de Bogotá</SelectItem>
                              {co.investor === 'Duvan' && <SelectItem value="Cripto (USDT)">Cripto (USDT)</SelectItem>}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={cn(
                    "text-[10px] font-black text-center pt-1 uppercase tracking-widest",
                    Math.abs(coInvList.reduce((a, b) => a + b.percentage, 0) - 100) < 0.01 ? "text-emerald-600" : "text-rose-500"
                  )}>
                    Total: {coInvList.reduce((a, b) => a + b.percentage, 0)}% / 100%
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha Compra</Label>
                  <Input id="date" type="date" className="rounded-xl border-slate-100 h-11" value={newProduct.purchaseDate} onChange={e => setNewProduct({...newProduct, purchaseDate: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pc" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Costo Unitario *</Label>
                  <Input id="pc" type="number" placeholder="0" className="rounded-xl border-slate-100 h-11 font-black" value={newProduct.purchasePrice || ''} onChange={e => setNewProduct({...newProduct, purchasePrice: parseFloat(e.target.value) || 0})} />
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
      <Card className="hidden md:block card-premium border-none shadow-sm rounded-[2rem] overflow-hidden bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="text-[10px] uppercase font-black tracking-widest text-muted-foreground pl-8 h-14">Detalle Dispositivo</TableHead>
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
                  <TableRow key={p.id} className="group border-b border-border hover:bg-muted/30 transition-colors">
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-muted flex items-center justify-center shrink-0 border-2 border-card shadow-sm transition-transform group-hover:scale-105 duration-300">
                          {p.images && p.images.length > 0 ? (
                            <img src={p.images[0]} className="w-full h-full object-cover" alt={p.name} />
                          ) : (
                            <div className="text-muted-foreground bg-card w-full h-full flex items-center justify-center">
                               <Smartphone className="w-6 h-6 opacity-30" />
                            </div>
                          )}
                        </div>
                         <div className="space-y-0.5">
                          <div className="font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{p.name}</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex flex-wrap items-center gap-2">
                             {p.isExternal ? (
                               <span className="text-rose-500 flex items-center gap-1"><ExternalLink className="w-2.5 h-2.5" /> Externo</span>
                             ) : p.coInvestors && p.coInvestors.length > 0 ? (
                               p.coInvestors.map((c, i) => (
                                 <span key={i} className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[8px]">
                                   {c.investor} ({c.percentage}%)
                                 </span>
                               ))
                             ) : (
                               <span>{p.investor}</span>
                             )}
                             <span className="w-1 h-1 rounded-full bg-muted"></span>
                             {p.purchaseDate}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 text-center">
                      <div className="text-xs font-black bg-card border border-border shadow-sm px-3 py-1.5 rounded-xl w-fit mx-auto text-foreground">
                        {p.quantity || 1}
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="text-[10px] font-black tracking-widest text-muted-foreground uppercase mb-1">IMEI / ID</div>
                      <div className="text-xs font-bold text-muted-foreground/80 font-mono tracking-tighter">{p.imei || p.id.slice(0,8).toUpperCase()}</div>
                    </TableCell>
                    <TableCell className="py-5 text-right">
                      <div className="text-sm font-black text-foreground">
                        {p.coInvestors && p.coInvestors.length > 0 && investorFilter !== 'all' ? (
                          <>
                            {fmt(p.purchasePrice * (p.coInvestors.find(c => c.investor === investorFilter)?.percentage || 0) / 100)}
                            <span className="ml-1 text-[10px] text-blue-500">({p.coInvestors.find(c => c.investor === investorFilter)?.percentage}%)</span>
                          </>
                        ) : (
                          fmt(p.purchasePrice)
                        )}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        Total {p.quantity > 1 ? '(u)' : 'Costo'}: {
                          p.coInvestors && p.coInvestors.length > 0 && investorFilter !== 'all' 
                          ? fmt((p.purchasePrice * (p.quantity || 1)) * (p.coInvestors.find(c => c.investor === investorFilter)?.percentage || 0) / 100)
                          : fmt(p.purchasePrice * (p.quantity || 1))
                        }
                      </div>
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
                          className="h-10 w-10 text-muted-foreground hover:text-blue-500 hover:bg-card rounded-xl shadow-none hover:shadow-sm transition-all"
                          title="Duplicar publicación"
                          onClick={() => handleDuplicate(p)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-card rounded-xl shadow-none hover:shadow-sm transition-all"
                          onClick={() => startEditing(p)}
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
                <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
                  {p.images && p.images.length > 0 ? (
                    <img src={p.images[0]} className="w-full h-full object-cover" alt={p.name} />
                  ) : (
                    <Smartphone className="w-12 h-12 text-muted-foreground/30" />
                  )}
                  <Badge className="absolute top-4 right-4 bg-card/90 backdrop-blur-md text-foreground border-none font-black text-[9px] tracking-widest px-3 rounded-full">
                     {p.investor}
                  </Badge>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0">
                      <h3 className="font-black text-lg text-foreground tracking-tight truncate">{p.name}</h3>
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">{p.id.slice(0, 8)}</div>
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
                      <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Inversión</div>
                      <div className="text-sm font-black text-foreground">
                        {p.coInvestors && p.coInvestors.length > 0 && investorFilter !== 'all' ? (
                          <>
                            {fmt(p.purchasePrice * (p.coInvestors.find(c => c.investor === investorFilter)?.percentage || 0) / 100)}
                            <span className="ml-1 text-[10px] text-primary">({p.coInvestors.find(c => c.investor === investorFilter)?.percentage}%)</span>
                          </>
                        ) : fmt(p.purchasePrice)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Stock Disp.</div>
                      <div className="text-sm font-black text-blue-600">{p.quantity} Unid.</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-border">
                    <Button 
                      variant="outline"
                      className="w-12 h-12 border-2 border-border text-muted-foreground hover:bg-muted hover:text-primary hover:border-primary/50 rounded-2xl transition-colors"
                      onClick={() => handleDuplicate(p)}
                    >
                      <Copy className="w-5 h-5" />
                    </Button>
                    <Button 
                      className="flex-1 bg-primary text-primary-foreground hover:opacity-90 rounded-2xl font-black uppercase text-[10px] tracking-widest h-12"
                      onClick={() => startEditing(p)}
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
              onUpload={(urls) => handleImageUploadCloudinary(urls, 'edit')} 
              onRemove={(idx) => removeImage(idx, 'edit')} 
              onReorder={(idx, dir) => reorderImages(idx, dir, 'edit')}
              uploading={uploading}
            />
            
            <div className="grid gap-2">
              <Label htmlFor="e-name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre del Producto</Label>
              <Input id="e-name" className="rounded-xl border-border h-11" value={editProductState?.name || ''} onChange={e => setEditProductState(prev => prev ? ({...prev, name: e.target.value}) : null)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="e-desc" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción</Label>
              <Textarea id="e-desc" className="rounded-xl border-border min-h-[100px]" value={editProductState?.description || ''} onChange={e => setEditProductState(prev => prev ? ({...prev, description: e.target.value}) : null)} />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoría</Label>
                <Select value={editProductState?.category || 'CELULARES'} onValueChange={v => setEditProductState(prev => prev ? ({...prev, category: v as Category}) : null)}>
                  <SelectTrigger className="rounded-xl border-slate-100 h-11 font-bold text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100">
                    <SelectItem value="CELULARES">CELULARES</SelectItem>
                    <SelectItem value="TABLETS">TABLETS</SelectItem>
                    <SelectItem value="RELOJ INTELIGENTES">RELOJ INTELIGENTES</SelectItem>
                    <SelectItem value="AURICULARES">AURICULARES</SelectItem>
                    <SelectItem value="ACCESORIOS">ACCESORIOS</SelectItem>
                    <SelectItem value="Other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="e-provider" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Proveedor</Label>
                <Input id="e-provider" className="rounded-xl border-slate-100 h-11" value={editProductState?.provider || ''} onChange={e => setEditProductState(prev => prev ? ({...prev, provider: e.target.value}) : null)} />
              </div>
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

            {/* Ownership Change Section */}
            <div className="space-y-4 border-t border-slate-50 pt-6">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-900">Propiedad y Socios</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="e-is-co-inv" 
                    checked={useCoInvestment} 
                    onCheckedChange={(v) => setUseCoInvestment(!!v)} 
                  />
                  <Label htmlFor="e-is-co-inv" className="text-[10px] font-black uppercase tracking-widest text-blue-600 cursor-pointer">
                    Co-Inversión
                  </Label>
                </div>
              </div>

              {!useCoInvestment ? (
                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inversionista</Label>
                    <Select value={editProductState?.investor} onValueChange={v => setEditProductState(prev => prev ? ({...prev, investor: v as Investor}) : null)}>
                      <SelectTrigger className="rounded-xl border-white h-10 font-bold text-xs shadow-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100">
                        {investors.map(inv => <SelectItem key={inv} value={inv}>{inv}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Medio Pago</Label>
                    <Select value={editProductState?.purchaseMethod} onValueChange={v => setEditProductState(prev => prev ? ({...prev, purchaseMethod: v as PaymentMethod}) : null)}>
                      <SelectTrigger className="rounded-xl border-white h-10 font-bold text-xs shadow-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100">
                        <SelectItem value="none">Ninguno / Efectivo</SelectItem>
                        <SelectItem value="Bancolombia">Bancolombia</SelectItem>
                        <SelectItem value="Nequi">Nequi</SelectItem>
                        <SelectItem value="Banco de Bogota">Banco de Bogotá</SelectItem>
                        <SelectItem value="Cripto (USDT)">Cripto (USDT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-blue-600">Reparto de Inversión (%)</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={addCoInvestor} className="h-7 text-[9px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-100 px-3">
                      <Plus className="w-3 h-3 mr-1" /> Añadir Socio
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {coInvList.map((co, idx) => (
                      <div key={idx} className="space-y-2 p-3 bg-white rounded-2xl border border-blue-50 shadow-sm">
                        <div className="flex gap-2">
                          <Select value={co.investor} onValueChange={v => updateCoInv(idx, { investor: v as Investor })}>
                            <SelectTrigger className="flex-1 rounded-xl border-blue-100 h-10 font-bold text-[11px] bg-slate-50/50"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {investors.map(inv => <SelectItem key={inv} value={inv}>{inv}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <div className="relative w-24">
                            <Input 
                              type="number" 
                              className="rounded-xl border-blue-100 h-10 font-bold text-xs pr-7" 
                              value={co.percentage} 
                              onChange={e => updateCoInv(idx, { percentage: parseFloat(e.target.value) || 0 })}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">%</span>
                          </div>
                          {coInvList.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeCoInvestor(idx)} className="h-10 w-10 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
            
            <Button onClick={handleEditProduct} className="w-full bg-primary text-primary-foreground h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/10 mt-2">
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
            <p className="text-muted-foreground">
              ¿Estás seguro de que deseas eliminar <strong>{selectedProduct?.name}</strong>?
            </p>
            <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg border border-border">
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
            <div className="flex items-center gap-4 bg-muted p-4 rounded-2xl border border-border">
               <div className="w-12 h-12 rounded-xl overflow-hidden bg-card shrink-0 border border-border">
                  {selectedProduct?.images?.[0] ? (
                    <img src={selectedProduct.images[0]} className="w-full h-full object-cover" alt={selectedProduct.name} />
                  ) : <Smartphone className="w-full h-full p-3 text-muted-foreground/30" />}
               </div>
               <div className="min-w-0">
                  <div className="font-black text-foreground truncate">{selectedProduct?.name}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stock: {selectedProduct?.quantity}</div>
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
                  className={cn("rounded-xl border-slate-100 h-11", sellErrors.qty && "border-rose-500 bg-rose-50")}
                  value={sellData.sellQuantity} 
                  onChange={e => setSellData({...sellData, sellQuantity: e.target.value})}
                />
                {sellErrors.qty && (
                  <span className="text-[9px] font-black uppercase text-rose-500 px-1">
                    {Number(sellData.sellQuantity) > (selectedProduct?.quantity || 0) ? 'Excede stock disponible' : 'Cantidad inválida'}
                  </span>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="sell-price" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Precio de Venta (Total) *</Label>
              <Input 
                id="sell-price" 
                type="number" 
                className={cn("rounded-xl border-slate-100 h-11 font-black text-emerald-600", sellErrors.price && "border-rose-500 bg-rose-50")}
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
                    {(selectedProduct?.investor === 'Duvan' || selectedProduct?.isExternal) && <SelectItem value="Cripto (USDT)">Cripto (USDT)</SelectItem>}
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

            <Button 
              onClick={handleSellProduct} 
              disabled={sellErrors.price || sellErrors.qty}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:bg-muted h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-600/10 mt-2"
            >
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
