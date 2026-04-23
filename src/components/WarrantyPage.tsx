import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Hash, User, ShoppingBag, ChevronLeft, ShieldCheck, Calendar } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { fmt } from '../lib/utils';
import Logo from './Logo';

export default function WarrantyPage() {
  const { id } = useParams();
  const { data } = useAppData();
  const [search, setSearch] = useState('');
  
  // Try to find by ID (direct link) or by search (Invoice/IMEI)
  const product = data.products.find(p => 
    (id && p.id === id) || 
    (!id && search && (p.invoiceNumber === search || p.imei === search))
  ) && data.products.find(p => (id && p.id === id) || (!id && search && (p.invoiceNumber === search || p.imei === search)))?.status === 'sold' 
    ? data.products.find(p => (id && p.id === id) || (!id && search && (p.invoiceNumber === search || p.imei === search)))
    : null;

  if (!id && !product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-md w-full border-none shadow-xl">
          <CardHeader className="text-center">
            <Logo size="lg" className="mb-4" />
            <CardTitle className="text-xl font-bold uppercase tracking-tight">Consulta de Garantía</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">IMEI o Número de Factura</Label>
              <div className="flex gap-2">
                <Input 
                  id="search"
                  placeholder="Ej: LDI-15 o 3546..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-50 border-none uppercase"
                />
              </div>
            </div>
            {!product && search.length > 3 && (
              <p className="text-center text-xs font-bold text-rose-500">No se encontró ningún registro</p>
            )}
            <div className="pt-4 border-t">
              <Link to="/catalog">
                <Button variant="ghost" className="w-full text-slate-400 text-xs font-bold uppercase">Volver al Catálogo</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-md w-full text-center p-8 border-none shadow-sm">
          <Hash className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Garantía No Encontrada</h2>
          <p className="text-slate-500 mb-6 text-sm">No pudimos encontrar un registro de garantía válido.</p>
          <Link to="/catalog">
            <Button variant="outline" className="w-full">Volver al Catálogo</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/catalog" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> VOLVER
        </Link>

        {/* Certificate Header */}
        <Card className="border-none shadow-sm overflow-hidden bg-primary text-primary-foreground">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="w-16 h-16 mx-auto mb-4 opacity-40 text-emerald-400" />
            <h1 className="text-2xl font-black uppercase tracking-tight">Certificado de Garantía</h1>
            <p className="opacity-70 mt-1 font-mono text-sm">Factura No. {product.invoiceNumber}</p>
          </CardContent>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-slate-400 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Información del Producto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-[10px] uppercase font-bold text-slate-400">Producto</Label>
                <div className="text-lg font-bold">{product.name}</div>
              </div>
              <div>
                <Label className="text-[10px] uppercase font-bold text-slate-400">IMEI / Serie</Label>
                <div className="text-sm font-mono">{product.imei || 'No registrado'}</div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Cantidad</Label>
                  <div className="text-sm font-bold">{product.quantity}</div>
                </div>
                <div className="flex-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Valor Unitario</Label>
                  <div className="text-sm font-mono font-bold text-emerald-600">{fmt(product.salePrice || 0)}</div>
                </div>
              </div>
              {product.warrantyMonths ? (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mt-2">
                   <div className="text-[10px] uppercase font-bold text-blue-400">Garantía Limitada</div>
                   <div className="text-sm font-black text-blue-700">{product.warrantyMonths} MESES</div>
                   {product.warrantyExpiration && (
                     <div className="text-[9px] font-bold text-blue-500 mt-1 uppercase">VENCE: {product.warrantyExpiration}</div>
                   )}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Detalles de Cobertura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                <div>
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Fecha de Venta</Label>
                  <div className="text-sm font-bold">{product.saleDate}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                <div>
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Comprador</Label>
                  <div className="text-sm font-bold">{product.buyer || 'Cliente General'}</div>
                </div>
              </div>
              <div className="pt-2">
                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50 text-xs font-bold py-1 px-3">
                  Garantía Activa ({product.warrantyMonths || 6} Meses)
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Terms */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase text-slate-400">Condiciones de Garantía</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-3">
            <p>1. La garantía cubre fallos técnicos de fábrica por un periodo de {product.warrantyMonths || 6} meses desde la fecha de compra.</p>
            <p>2. No incluye daños causados por humedad, golpes, sobrecargas eléctricas o manipulación por terceros.</p>
            <p>3. El producto debe presentarse con sus sellos de seguridad intactos.</p>
          </CardContent>
        </Card>

        {/* Images if any */}
        {product.images && product.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {product.images.map((img, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden bg-white shadow-sm border p-1">
                <img src={img} className="w-full h-full object-cover rounded-lg" alt={`Product ${i}`} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
