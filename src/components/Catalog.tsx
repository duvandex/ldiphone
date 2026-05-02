import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, ShoppingBag, Camera, Menu, ShieldCheck, LayoutDashboard, ChevronRight, Apple, Smartphone, X, ChevronLeft, Send, Tablet, Watch, Headphones, CreditCard } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useCloudinary } from '../hooks/useCloudinary';
import { fmt, cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Product } from '../types';

export default function Catalog() {
  const { data, user, updateSettings } = useAppData();
  const { uploadImage } = useCloudinary();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isUploading, setIsUploading] = useState<number | null>(null);

  const isAuthenticated = !!user;

  const handlePaymentImageUpload = (index: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      setIsUploading(index);
      try {
        const cloudinaryUrl = await uploadImage(file, 'ldiphone/payments');
        const currentMethods = [...(data.settings.paymentMethods || [])];
        while (currentMethods.length <= index) {
          currentMethods.push('');
        }
        currentMethods[index] = cloudinaryUrl;
        await updateSettings({ paymentMethods: currentMethods });
      } catch (error) {
        console.error('Error subiendo imagen:', error);
        alert('Error al subir la imagen. Intenta de nuevo.');
      } finally {
        setIsUploading(null);
      }
    };
    input.click();
  };

  const removePaymentImage = async (index: number) => {
    if (!confirm('¿Eliminar este medio de pago?')) return;
    const currentMethods = [...(data.settings.paymentMethods || [])];
    currentMethods[index] = '';
    await updateSettings({ paymentMethods: currentMethods });
  };

  const publicProducts = data.products
    .filter(p => 
      (p.status === 'stock' || p.status === 'reserved' || !p.status) && 
      (p.name?.toLowerCase() || '').includes(search.toLowerCase()) &&
      (category === 'all' || 
       p.category === category || 
       (p.name?.toLowerCase().includes(category.toLowerCase())))
    )
    .sort((a, b) => (b.salePrice || 0) - (a.salePrice || 0));

  const categories = [
    { id: 'all', name: 'TODO', icon: ShoppingBag },
    { id: 'CELULARES', name: 'CELULARES', icon: Smartphone },
    { id: 'TABLETS', name: 'TABLETS', icon: Tablet },
    { id: 'RELOJ INTELIGENTES', name: 'RELOJ INTELIGENTES', icon: Watch },
    { id: 'AURICULARES', name: 'AURICULARES', icon: Headphones },
    { id: 'ACCESORIOS', name: 'ACCESORIOS', icon: Apple },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  const getWhatsAppLink = (p: Product) => {
    const message = `Hola! Estoy interesado en este equipo que vi en su catálogo:%0A%0A📱 *${p.name}*%0A💰 *Precio:* ${fmt(p.salePrice || 0)}%0A📍 *Ref:* ${p.id.slice(0, 8)}%0A%0A¿Sigue disponible?`;
    return `https://wa.me/573012949934?text=${message}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
      <header className={cn(
        "glass sticky z-50 px-4 py-3 border-b border-border shadow-sm transition-all duration-300",
        isAuthenticated ? "top-14" : "top-0"
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative md:hidden">
              <button 
                className="-ml-2 p-2 hover:bg-muted rounded-full transition-all active:scale-90"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className="w-5 h-5 text-muted-foreground" />
              </button>
              
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-3 w-64 bg-card rounded-3xl shadow-2xl border border-border p-2 z-50 origin-top-left"
                  >
                    <Link to="/" className="flex items-center gap-3 py-3 px-4 hover:bg-muted rounded-2xl transition-colors" onClick={() => setIsMenuOpen(false)}>
                      <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                      <span className="font-black text-xs uppercase tracking-widest text-foreground">Explorar Admin</span>
                    </Link>
                    <div className="h-px bg-border my-1 mx-2" />
                    <Link to="/warranty" className="flex items-center gap-3 py-3 px-4 hover:bg-muted rounded-2xl transition-colors" onClick={() => setIsMenuOpen(false)}>
                      <ShieldCheck className="w-4 h-4 text-blue-500" />
                      <span className="font-black text-xs uppercase tracking-widest text-foreground">Ver Garantías</span>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <div className="hidden sm:block leading-none">
                <h1 className="text-xl font-black tracking-tighter text-foreground uppercase">{data.settings.companyName}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Premium Stock</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 mr-auto ml-12 shrink-0">
            <Link to="/warranty" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">Seguimiento</Link>
            <Link to="/catalog" className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground border-b-2 border-primary pb-1">Dispositivos</Link>
          </div>

          <div className="relative max-w-[240px] sm:max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <Input 
              placeholder="¿Qué buscas hoy?..." 
              className="pl-11 h-10 bg-muted/50 border-none shadow-inner rounded-full text-xs font-bold text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-card transition-all shadow-muted/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-card pt-16 pb-24 overflow-hidden border-b border-border">
        <div className="absolute inset-0 z-0 opacity-40">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-muted/20 rounded-full translate-x-1/2 -translate-y-1/2"></div>
           <div className="absolute bottom-0 left-0 w-[800px] h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <Badge variant="outline" className="rounded-full border-border bg-card px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground shadow-sm shadow-muted">
               Catálogo Premium 2026
            </Badge>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-none">
              Tu próximo dispositivo.<br/>
              <span className="text-muted-foreground/30">Sin complicaciones.</span>
            </h2>

            <p className="max-w-2xl text-muted-foreground font-medium text-lg md:text-xl leading-relaxed">
              Explora nuestra colección selecta de dispositivos con garantía extendida y soporte personalizado. Calidad Apple garantizada.
            </p>

            <div className="pt-12 w-full max-w-4xl">
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-4 w-full">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground whitespace-nowrap">Medios de Pago</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border"></div>
                </div>
                
                <div className="flex flex-wrap justify-center gap-6">
                  {[0, 1].map((index) => {
                    const imageUrl = data.settings.paymentMethods?.[index];
                    return (
                      <div key={index} className="relative group">
                        <div className={cn(
                          "w-40 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all",
                          imageUrl ? "border-transparent bg-card shadow-sm" : "border-border bg-muted/20"
                        )}>
                          {imageUrl ? (
                            <img src={imageUrl} alt={`Pago ${index + 1}`} className="w-full h-full object-contain p-4" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="flex flex-col items-center gap-2 opacity-20 text-foreground">
                              <CreditCard className="w-6 h-6" />
                              <span className="text-[8px] font-black uppercase tracking-widest">Disponible</span>
                            </div>
                          )}
                        </div>

                        {isAuthenticated && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl gap-2 backdrop-blur-sm">
                            <button 
                              onClick={() => handlePaymentImageUpload(index)}
                              className="p-2 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform shadow-lg"
                              disabled={isUploading === index}
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                            {imageUrl && (
                              <button 
                                onClick={() => removePaymentImage(index)}
                                className="p-2 bg-rose-500 rounded-full text-white hover:scale-110 transition-transform shadow-lg"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                        
                        {isUploading === index && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
                            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent animate-spin rounded-full" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Grid */}
      <main className="flex-1 px-4 py-12 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Categories */}
          <div className="flex items-center gap-3 mb-12 overflow-x-auto pb-4 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap transition-all duration-300 font-black text-[10px] uppercase tracking-widest",
                  category === cat.id 
                    ? "bg-primary text-primary-foreground shadow-xl shadow-primary/10 scale-105" 
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted border border-border"
                )}
              >
                <cat.icon className="w-4 h-4" />
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
               Colección Disponible
               <span className="h-px w-12 bg-border"></span>
            </h3>
            <p className="text-[10px] font-bold text-muted-foreground italic">{publicProducts.length} resultados encontrados</p>
          </div>

          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {publicProducts.map((p) => (
              <motion.div key={p.id} variants={item}>
                <Card className="group card-premium rounded-3xl overflow-hidden border-none h-full flex flex-col bg-card">
                  <div 
                    className="aspect-video relative flex items-center justify-center bg-muted/30 overflow-hidden cursor-pointer"
                    onClick={() => {
                        setSelectedProduct(p);
                        setActiveImageIndex(0);
                    }}
                  >
                    {p.images && p.images.length > 0 ? (
                      <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-20 group-hover:opacity-40 transition-opacity">
                         <Smartphone className="w-16 h-16 text-foreground" />
                      </div>
                    )}
                    
                    <Badge variant={p.status === 'stock' ? 'secondary' : p.status === 'reserved' ? 'outline' : 'default'} className={cn(
                      "absolute top-4 right-4 text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border-none shadow-lg backdrop-blur-md",
                      p.status === 'stock' ? "bg-blue-50/90 text-blue-600" : 
                      p.status === 'reserved' ? "bg-orange-50/90 text-orange-600" :
                      "bg-rose-50/90 text-rose-600"
                    )}>
                      {p.status === 'stock' ? 'STOCK' : p.status === 'reserved' ? 'SEPARADO' : 'OUT'}
                    </Badge>

                    {p.images && p.images.length > 1 && (
                      <div className="absolute bottom-4 right-4 bg-black/40 text-white text-[9px] font-bold px-3 py-1.5 rounded-full backdrop-blur-lg border border-white/10 group-hover:bg-primary transition-colors uppercase tracking-widest">
                        +{p.images.length} FOTOS
                      </div>
                    )}
                  </div>

                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="mb-4">
                       <h3 className="font-black text-xl tracking-tight text-foreground leading-tight group-hover:text-primary transition-colors cursor-pointer" onClick={() => { setSelectedProduct(p); setActiveImageIndex(0); }}>{p.name}</h3>
                       <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Ref: {p.id.slice(0, 8)}</div>
                    </div>

                    {p.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed font-medium h-8">
                        {p.description}
                      </p>
                    )}
                    
                    <div className="space-y-4 mt-auto pt-4 border-t border-border">
                        {p.warrantyMonths && (
                            <div className="text-[9px] font-black text-primary uppercase flex items-center gap-1.5 tracking-widest bg-primary/10 w-fit px-2 py-1 rounded-md">
                                <ShieldCheck className="w-3.5 h-3.5" /> {p.warrantyMonths} MESES GARANTÍA
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Precio Especial</span>
                                <span className="text-2xl font-black text-foreground tracking-tighter">{fmt(p.salePrice || 0)}</span>
                            </div>
                            
                            <a 
                                href={getWhatsAppLink(p)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-emerald-500 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-110 active:scale-95 transition-all text-white group/wa"
                            >
                                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {publicProducts.length === 0 && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-32 border-4 border-dashed border-border rounded-[3rem]"
            >
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground/30">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-foreground tracking-tight">No encontramos lo que buscas</h3>
              <p className="text-muted-foreground mt-2 font-medium">Contáctanos directamente, puede que tengamos stock entrando pronto.</p>
              <Button variant="outline" className="mt-8 rounded-full h-12 px-8 font-black uppercase text-[10px] tracking-widest border-2" onClick={() => setSearch('')}>
                 Limpiar Búsqueda
              </Button>
            </motion.div>
          )}
        </div>
      </main>

      {/* Product View Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
         <DialogContent className="sm:max-w-5xl p-0 overflow-hidden border-none rounded-[2rem] gap-0 shadow-2xl">
            <DialogHeader className="sr-only">
                <DialogTitle>{selectedProduct?.name}</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
                <div className="flex flex-col md:flex-row h-full max-h-[90vh] md:max-h-[80vh]">
                    {/* Image Gallery */}
                    <div className="w-full md:w-1/2 bg-muted/10 relative group flex flex-col border-r border-border/50">
                        <div className="flex-1 relative overflow-hidden bg-slate-950 flex items-center justify-center min-h-[350px] md:min-h-0">
                            <AnimatePresence mode="wait">
                                <motion.img 
                                    key={activeImageIndex}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.05 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    src={selectedProduct.images?.[activeImageIndex] || ''} 
                                    className="w-full h-full object-contain pointer-events-none"
                                    alt={selectedProduct.name}
                                />
                            </AnimatePresence>
                            
                            {selectedProduct.images && selectedProduct.images.length > 1 && (
                                <>
                                    <button 
                                        onClick={() => setActiveImageIndex(prev => prev > 0 ? prev - 1 : selectedProduct.images!.length - 1)}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-all shadow-xl z-10 active:scale-90"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => setActiveImageIndex(prev => prev < selectedProduct.images!.length - 1 ? prev + 1 : 0)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-all shadow-xl z-10 active:scale-90"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {selectedProduct.images && selectedProduct.images.length > 1 && (
                            <div className="p-4 bg-muted/5 flex justify-center gap-3 overflow-x-auto no-scrollbar border-t border-border/10">
                                {selectedProduct.images.map((img, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => setActiveImageIndex(i)}
                                        className={cn(
                                            "w-16 h-16 rounded-xl overflow-hidden border-2 transition-all p-0.5 shrink-0 bg-white shadow-sm",
                                            activeImageIndex === i ? "border-primary scale-110 shadow-primary/20" : "border-transparent opacity-40 hover:opacity-100"
                                        )}
                                    >
                                        <img src={img} className="w-full h-full object-cover rounded-lg" alt="" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col bg-card overflow-y-auto custom-scrollbar">
                        <div className="mb-8">
                            <Badge className={cn(
                                "border-none text-[9px] font-black uppercase tracking-[0.2em] mb-4 px-4 py-1.5 rounded-full shadow-sm",
                                selectedProduct.status === 'reserved' ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"
                            )}>
                                {selectedProduct.status === 'reserved' ? 'EQUIPO SEPARADO' : 'STOCK DISPONIBLE'}
                            </Badge>
                            <h2 className="text-4xl font-black text-foreground tracking-tighter leading-none mb-4">{selectedProduct.name}</h2>
                            <div className="flex items-center gap-4">
                                <div className="text-4xl font-black text-primary tracking-tighter">{fmt(selectedProduct.salePrice || 0)}</div>
                                {selectedProduct.status === 'stock' && (
                                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3">En stock inmediato</Badge>
                                )}
                            </div>
                            
                            {selectedProduct.status === 'reserved' && (
                                <div className="mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
                                    <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none mb-1">Estado de Reserva</p>
                                        <p className="text-xs font-bold text-orange-700 leading-tight">Este equipo ya cuenta con un abono inicial y está siendo procesado para entrega.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-8">
                           <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Especificaciones</h4>
                                <div className="h-px flex-1 bg-border/50"></div>
                              </div>
                              <p className="text-[15px] text-foreground/80 font-medium leading-relaxed whitespace-pre-wrap">
                                 {selectedProduct.description || 'Sin descripción disponible para este equipo.'}
                              </p>
                           </div>
                           
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {selectedProduct.warrantyMonths && (
                                    <div className="p-5 bg-muted/20 rounded-2xl border border-border/50 flex flex-col gap-3">
                                        <div className="flex items-center gap-2 text-primary">
                                            <ShieldCheck className="w-5 h-5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Garantía LD</span>
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-foreground leading-none">{selectedProduct.warrantyMonths} MESES</p>
                                            <p className="text-[9px] text-muted-foreground font-bold uppercase mt-1">Cobertura técnica total</p>
                                        </div>
                                    </div>
                                )}
                                <div className="p-5 bg-muted/20 rounded-2xl border border-border/50 flex flex-col gap-3">
                                    <div className="flex items-center gap-2 text-emerald-500">
                                        <Smartphone className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Calidad Apple</span>
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-foreground leading-none">ORIGINAL</p>
                                        <p className="text-[9px] text-muted-foreground font-bold uppercase mt-1">Componentes certificados</p>
                                    </div>
                                </div>
                           </div>
                        </div>

                        <div className="pt-10 space-y-4">
                            <a 
                                href={getWhatsAppLink(selectedProduct)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex items-center justify-center gap-4 font-black uppercase text-sm tracking-widest shadow-2xl shadow-emerald-600/30 transition-all active:scale-[0.98] group"
                            >
                                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                </svg>
                                COMPRAR POR WHATSAPP
                            </a>
                            <button 
                                onClick={() => setSelectedProduct(null)}
                                className="w-full h-14 bg-muted hover:bg-muted/80 text-muted-foreground rounded-2xl flex items-center justify-center font-black uppercase text-[10px] tracking-[0.2em] transition-colors"
                            >
                                SEGUIR NAVEGANDO
                            </button>
                        </div>
                    </div>
                </div>
            )}
         </DialogContent>
      </Dialog>

      {/* Trust Banner */}
      <section className="bg-muted/30 py-16 border-t border-border">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-2">
                    <Apple className="w-6 h-6" />
                </div>
                <h4 className="text-foreground font-black uppercase tracking-widest text-xs">Original Apple Only</h4>
                <p className="text-muted-foreground text-sm font-medium">Garantizamos la autenticidad de cada componente y dispositivo.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-2">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-foreground font-black uppercase tracking-widest text-xs">Garantía Extendida</h4>
                <p className="text-muted-foreground text-sm font-medium">Hasta 12 meses de cobertura técnica en fallos de fabricación.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-2">
                    <Smartphone className="w-6 h-6" />
                </div>
                <h4 className="text-foreground font-black uppercase tracking-widest text-xs">Test de Calidad</h4>
                <p className="text-muted-foreground text-sm font-medium">Cada equipo pasa por un riguroso test de 32 puntos funcionales.</p>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
                <Logo size="sm" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{data.settings.companyName} © 2026</p>
            </div>
            <div className="flex gap-8">
                <a href="#" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Términos</a>
                <a href="#" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Privacidad</a>
                <a href="#" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Instagram</a>
            </div>
        </div>
      </footer>
    </div>
  );
}
