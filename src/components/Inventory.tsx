import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Search, Plus, Trash2, ShoppingCart, Pencil, Camera, X, ImagePlus } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { Investor, Product, PaymentMethod } from '../types';
import { fmt, cn } from '../lib/utils';

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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
  });

  const [editProductState, setEditProductState] = useState<Product | null>(null);

  const [sellData, setSellData] = useState<{
    salePrice: number;
    saleDate: string;
    buyer: string;
    sellQuantity: number;
    saleMethod: PaymentMethod;
  }>({
    salePrice: 0,
    saleDate: new Date().toISOString().split('T')[0],
    buyer: '',
    sellQuantity: 1,
    saleMethod: 'Efectivo',
  });

  const filteredProducts = data.products.filter(p => {
    if (p.status === 'sold') return false;

    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
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
    if (!selectedProduct || !sellData.salePrice) {
      alert("Por favor completa el precio de venta.");
      return;
    }
    
    try {
      const invoiceNumber = await generateInvoiceNumber();
      await updateProduct(selectedProduct.id, {
        ...sellData,
        status: 'sold',
        invoiceNumber: invoiceNumber,
      });
      setIsSellOpen(false);
      setSelectedProduct(null);
    } catch (err: any) {
      alert("No se pudo completar la venta: " + err.message);
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
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar producto, IMEI o proveedor..."
              className="pl-9 bg-white border-none shadow-sm h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={investorFilter} onValueChange={setInvestorFilter}>
              <SelectTrigger className="flex-1 sm:w-[140px] bg-white border-none shadow-sm h-10">
                <SelectValue placeholder="Inversor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Los Inversores</SelectItem>
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
              <SelectTrigger className="flex-1 sm:w-[120px] bg-white border-none shadow-sm h-10">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
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
              <Button className="w-full bg-slate-900 hover:bg-slate-800 h-11 text-base">
                <Plus className="w-5 h-5 mr-2" /> Agregar Producto
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo Producto</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <ImageUploader 
                images={newProduct.images || []} 
                onUpload={(b64) => handleImageUpload(b64, 'add')} 
                onRemove={(idx) => removeImage(idx, 'add')} 
              />
              
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input id="name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Ej: iPhone 15 Pro" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="imei">IMEI</Label>
                  <Input id="imei" value={newProduct.imei} onChange={e => setNewProduct({...newProduct, imei: e.target.value})} placeholder="IMEI" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="provider">Proveedor</Label>
                  <Input id="provider" value={newProduct.provider} onChange={e => setNewProduct({...newProduct, provider: e.target.value})} placeholder="Proveedor" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="investor">Inversor *</Label>
                  <Select value={newProduct.investor || 'Duvan'} onValueChange={v => setNewProduct({...newProduct, investor: v as Investor})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Duvan">Duvan</SelectItem>
                      <SelectItem value="Lina">Lina</SelectItem>
                      <SelectItem value="Santiago">Santiago</SelectItem>
                      <SelectItem value="Johana">Johana</SelectItem>
                      <SelectItem value="Pool">Pool</SelectItem>
                      <SelectItem value="Santa Maria">Santa María</SelectItem>
                      <SelectItem value="Thomas">Thomas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Fecha de Compra</Label>
                  <Input id="date" type="date" value={newProduct.purchaseDate} onChange={e => setNewProduct({...newProduct, purchaseDate: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="pc">P. Compra (u) *</Label>
                  <Input id="pc" type="number" value={newProduct.purchasePrice || 0} onChange={e => setNewProduct({...newProduct, purchasePrice: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pv">P. Venta Sugerido</Label>
                  <Input id="pv" type="number" value={newProduct.salePrice || 0} onChange={e => setNewProduct({...newProduct, salePrice: parseFloat(e.target.value) || 0})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Cantidad inicial *</Label>
                  <Input id="quantity" type="number" min="1" value={newProduct.quantity} onChange={e => setNewProduct({...newProduct, quantity: parseInt(e.target.value) || 1})} />
                </div>
                <div className="grid gap-2">
                  <Label>Medio de Pago (Salida) *</Label>
                  <Select value={newProduct.purchaseMethod || 'none'} onValueChange={v => setNewProduct({...newProduct, purchaseMethod: v as PaymentMethod})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno (No descontar saldo)</SelectItem>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Bancolombia">Bancolombia</SelectItem>
                      <SelectItem value="Nequi">Nequi</SelectItem>
                      <SelectItem value="Banco de Bogota">Banco de Bogota</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="warranty">Garantía (Meses)</Label>
                  <Input id="warranty" type="number" min="0" value={newProduct.warrantyMonths || 0} onChange={e => setNewProduct({...newProduct, warrantyMonths: parseInt(e.target.value) || 0})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="w-exp">Fecha Venc. Garantía</Label>
                  <Input id="w-exp" type="date" value={newProduct.warrantyExpiration || ''} onChange={e => setNewProduct({...newProduct, warrantyExpiration: e.target.value})} />
                </div>
              </div>
            </div>
            <Button onClick={handleAddProduct} className="w-full h-11">Guardar Producto</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Product List - Mobile View (Cards) */}
      <div className="grid grid-cols-1 md:hidden gap-4">
        {filteredProducts.map((p) => {
          const profitPerUnit = p.status === 'sold' ? (p.salePrice || 0) - p.purchasePrice : null;
          const totalProfit = profitPerUnit !== null ? profitPerUnit * (p.quantity || 1) : null;
          return (
            <Card key={p.id} className="border-none shadow-sm overflow-hidden overflow-ellipsis">
              <div className="flex">
                {p.images && p.images.length > 0 ? (
                  <div className="w-24 h-24 shrink-0">
                    <img src={p.images[0]} className="w-full h-full object-cover" alt={p.name} />
                  </div>
                ) : (
                  <div className="w-24 h-24 shrink-0 bg-slate-100 flex items-center justify-center text-slate-300">
                    <Camera className="w-8 h-8" />
                  </div>
                )}
                <div className="p-3 flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="truncate">
                      <h3 className="font-bold text-sm truncate">{p.name}</h3>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">{p.id}</div>
                    </div>
                    <Badge variant={p.status === 'stock' ? 'secondary' : 'default'} className={cn(
                      "text-[8px] uppercase font-bold shrink-0",
                      p.status === 'stock' ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {p.status === 'stock' ? 'En Stock' : 'Agotado'}
                    </Badge>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Disponible</div>
                      <div className="text-xs font-bold text-blue-600">{p.quantity} {p.quantity === 1 ? 'Unidad' : 'Unidades'}</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">P. Compra</div>
                      <div className="text-xs font-mono">{fmt(p.purchasePrice)}</div>
                    </div>
                  </div>

                  {p.warrantyMonths ? (
                    <div className="mt-2 p-1.5 bg-blue-50/50 rounded flex items-center justify-between text-[9px] border border-blue-100">
                      <span className="font-bold text-blue-700">GARANTÍA: {p.warrantyMonths} MESES</span>
                      {p.warrantyExpiration && (
                        <span className="text-blue-500 font-mono">FIN: {p.warrantyExpiration}</span>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="px-3 py-2 bg-slate-50/50 border-t flex justify-between items-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">{p.investor}</div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400"
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
                      className="h-8 w-8 text-emerald-600"
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
                    className="h-8 w-8 text-rose-500"
                    onClick={() => {
                      if (confirm('¿Eliminar producto?')) deleteProduct(p.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] uppercase font-bold pl-6">Producto</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-center">Disponible</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">IMEI / Inversor</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Compra (u)</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Venta (u)</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Ganancia Total</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Estado</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right pr-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p) => {
                const profitPerUnit = p.status === 'sold' ? (p.salePrice || 0) - p.purchasePrice : null;
                const totalProfit = profitPerUnit !== null ? profitPerUnit * (p.quantity || 1) : null;
                return (
                  <TableRow key={p.id} className="group">
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                          {p.images && p.images.length > 0 ? (
                            <img src={p.images[0]} className="w-full h-full object-cover" alt={p.name} />
                          ) : (
                            <Camera className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <div className="text-xs font-bold bg-slate-100 px-2 py-1 rounded w-fit mx-auto">
                        {p.quantity || 1}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-xs font-mono text-slate-500">{p.imei || '—'}</div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{p.investor}</div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-xs font-mono">{fmt(p.purchasePrice)}</div>
                      <div className="text-[10px] text-slate-400">{p.purchaseDate}</div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-xs font-mono">{p.salePrice ? fmt(p.salePrice) : '—'}</div>
                      <div className="text-[10px] text-slate-400">{p.saleDate || '—'}</div>
                    </TableCell>
                    <TableCell className="py-4">
                      {totalProfit !== null ? (
                        <div className={cn("text-xs font-bold font-mono", totalProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                          {fmt(totalProfit)}
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant={p.status === 'stock' ? 'secondary' : 'default'} className={cn(
                        "text-[9px] uppercase font-bold px-1.5 py-0.5",
                        p.status === 'stock' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-rose-50 text-rose-600 border-rose-100"
                      )}>
                        {p.status === 'stock' ? 'En Stock' : 'Agotado'}
                      </Badge>
                      {p.warrantyMonths ? (
                        <div className="text-[9px] font-bold text-blue-500 mt-1 uppercase">Garantía: {p.warrantyMonths} Meses</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-600 hover:bg-slate-100"
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
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
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
                          className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          onClick={() => deleteProduct(p.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Product Dialog - Empty as it is handled by the Dialog block above */}

      {/* Edit Product Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <ImageUploader 
              images={editProductState?.images || []} 
              onUpload={(b64) => handleImageUpload(b64, 'edit')} 
              onRemove={(idx) => removeImage(idx, 'edit')} 
            />
            
            <div className="grid gap-2">
              <Label htmlFor="e-name">Nombre del Producto</Label>
              <Input id="e-name" value={editProductState?.name || ''} onChange={e => setEditProductState(prev => prev ? ({...prev, name: e.target.value}) : null)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="e-imei">IMEI</Label>
                <Input id="e-imei" value={editProductState?.imei || ''} onChange={e => setEditProductState(prev => prev ? ({...prev, imei: e.target.value}) : null)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="e-provider">Proveedor</Label>
                <Input id="e-provider" value={editProductState?.provider || ''} onChange={e => setEditProductState(prev => prev ? ({...prev, provider: e.target.value}) : null)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="e-pc">Precio Compra (u)</Label>
                <Input id="e-pc" type="number" value={editProductState?.purchasePrice || 0} onChange={e => setEditProductState(prev => prev ? ({...prev, purchasePrice: parseFloat(e.target.value) || 0}) : null)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="e-qty">Cantidad</Label>
                <Input id="e-qty" type="number" value={editProductState?.quantity || 1} onChange={e => setEditProductState(prev => prev ? ({...prev, quantity: parseInt(e.target.value) || 1}) : null)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="e-pv">Precio Venta Sugerido</Label>
              <Input id="e-pv" type="number" value={editProductState?.salePrice || 0} onChange={e => setEditProductState(prev => prev ? ({...prev, salePrice: parseFloat(e.target.value) || 0}) : null)} />
            </div>

            <div className="grid gap-2">
              <Label>Estado del Producto</Label>
              <Select value={editProductState?.status || 'stock'} onValueChange={v => setEditProductState(prev => prev ? ({...prev, status: v as any}) : null)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">En Stock</SelectItem>
                  <SelectItem value="out_of_stock">Agotado / No disponible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="grid gap-2">
                <Label htmlFor="e-warranty">Garantía (Meses)</Label>
                <Input id="e-warranty" type="number" min="0" value={editProductState?.warrantyMonths || 0} onChange={e => setEditProductState(prev => prev ? ({...prev, warrantyMonths: parseInt(e.target.value) || 0}) : null)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="e-w-exp">Fecha Venc. Garantía</Label>
                <Input id="e-w-exp" type="date" value={editProductState?.warrantyExpiration || ''} onChange={e => setEditProductState(prev => prev ? ({...prev, warrantyExpiration: e.target.value}) : null)} />
              </div>
            </div>
          </div>
          <Button onClick={handleEditProduct} className="w-full h-11 bg-slate-900">Aplicar Cambios</Button>
        </DialogContent>
      </Dialog>

      {/* Sell Dialog */}
      <Dialog open={isSellOpen} onOpenChange={setIsSellOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Venta</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             {/* ... sell logic ... */}
             <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-slate-500">{selectedProduct?.name}</span>
              <Badge variant="outline" className="bg-slate-50 text-slate-600">
                Disponibles: {selectedProduct?.quantity || 1}
              </Badge>
            </div>
            
            {(selectedProduct?.quantity || 1) > 1 && (
              <div className="grid gap-2">
                <Label htmlFor="sell-qty">¿Cuántos vas a vender? *</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    id="sell-qty" 
                    type="number" 
                    min="1" 
                    max={selectedProduct?.quantity || 1}
                    value={sellData.sellQuantity} 
                    onChange={e => setSellData({...sellData, sellQuantity: Math.min(selectedProduct?.quantity || 1, Math.max(1, parseInt(e.target.value) || 1))})} 
                  />
                  <div className="text-[10px] text-slate-400 font-bold uppercase w-24">Unidades</div>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="sell-price">Precio de Venta (unitario) *</Label>
              <Input 
                id="sell-price" 
                type="number" 
                value={sellData.salePrice || 0} 
                onChange={e => setSellData({...sellData, salePrice: parseFloat(e.target.value) || 0})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sell-date">Fecha de Venta</Label>
                <Input 
                  id="sell-date" 
                  type="date" 
                  value={sellData.saleDate} 
                  onChange={e => setSellData({...sellData, saleDate: e.target.value})} 
                />
              </div>
              <div className="grid gap-2">
                <Label>¿A qué cuenta entra? *</Label>
                <Select value={sellData.saleMethod} onValueChange={v => setSellData({...sellData, saleMethod: v as PaymentMethod})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Bancolombia">Bancolombia</SelectItem>
                    <SelectItem value="Nequi">Nequi</SelectItem>
                    <SelectItem value="Banco de Bogota">Banco de Bogota</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="buyer">Nombre del Comprador</Label>
              <Input 
                id="buyer" 
                placeholder="Opcional" 
                value={sellData.buyer} 
                onChange={e => setSellData({...sellData, buyer: e.target.value})} 
              />
            </div>
          </div>
          <Button onClick={handleSellProduct} className="w-full bg-emerald-600 hover:bg-emerald-700">Confirmar Venta</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
