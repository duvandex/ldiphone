import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, ShoppingBag, Camera, Menu, ShieldCheck, LayoutDashboard, ChevronRight, Apple, Smartphone, X, ChevronLeft, Send, Tablet, Watch, Headphones, CreditCard } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { fmt, cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Product } from '../types';

export default function Catalog() {
  const { data, user, updateSettings } = useAppData();
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
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const currentMethods = [...(data.settings.paymentMethods || [])];
        
        // Ensure array has enough slots
        while (currentMethods.length <= index) {
          currentMethods.push('');
        }
        
        currentMethods[index] = base64;
        await updateSettings({ paymentMethods: currentMethods });
        setIsUploading(null);
      };
      reader.readAsDataURL(file);
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
      (p.status === 'stock' || !p.status) && 
      (p.name?.toLowerCase() || '').includes(search.toLowerCase()) &&
      (category === 'all' || 
       p.category === category || 
       (p.name?.toLowerCase().includes(category.toLowerCase())))
    )
    .sort((a, b) => (b.salePrice || 0) - (a.salePrice || 0));

  const categories = [
    { id: 'all', name: 'Todo', icon: ShoppingBag },
    { id: 'Celulares', name: 'Celulares', icon: Smartphone },
    { id: 'Tablet', name: 'Tablet', icon: Tablet },
    { id: 'Watch', name: 'Watch', icon: Watch },
    { id: 'Auriculares', name: 'Auriculares', icon: Headphones },
    { id: 'Accesorio', name: 'Accesorio', icon: Apple },
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Header */}
      <header className="glass sticky top-0 z-50 px-4 py-3 border-b shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative md:hidden">
              <button 
                className="-ml-2 p-2 hover:bg-slate-100 rounded-full transition-all active:scale-90"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className="w-5 h-5 text-slate-700" />
              </button>
              
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-50 origin-top-left"
                  >
                    <Link to="/" className="flex items-center gap-3 py-3 px-4 hover:bg-slate-50 rounded-2xl transition-colors" onClick={() => setIsMenuOpen(false)}>
                      <LayoutDashboard className="w-4 h-4 text-slate-500" />
                      <span className="font-black text-xs uppercase tracking-widest text-slate-700">Explorar Admin</span>
                    </Link>
                    <div className="h-px bg-slate-50 my-1 mx-2" />
                    <Link to="/warranty" className="flex items-center gap-3 py-3 px-4 hover:bg-slate-50 rounded-2xl transition-colors" onClick={() => setIsMenuOpen(false)}>
                      <ShieldCheck className="w-4 h-4 text-blue-500" />
                      <span className="font-black text-xs uppercase tracking-widest text-slate-700">Ver Garantías</span>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <div className="hidden sm:block leading-none">
                <h1 className="text-xl font-black tracking-tighter text-slate-900">LDIPHONE</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Collective</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 mr-auto ml-12 shrink-0">
            <Link to="/warranty" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors">Seguimiento</Link>
            <Link to="/catalog" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 border-b-2 border-slate-900 pb-1">Dispositivos</Link>
          </div>

          <div className="relative max-w-[240px] sm:max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <Input 
              placeholder="¿Qué buscas hoy?..." 
              className="pl-11 h-10 bg-slate-100/50 border-none shadow-inner rounded-full text-xs font-bold text-slate-900 ring-offset-background placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:bg-white transition-all shadow-slate-200/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-white pt-16 pb-24 overflow-hidden border-b">
        <div className="absolute inset-0 z-0 opacity-40">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2"></div>
           <div className="absolute bottom-0 left-0 w-[800px] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <Badge variant="outline" className="rounded-full border-slate-200 bg-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 shadow-sm shadow-slate-100">
               Catálogo Premium 2026
            </Badge>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 leading-none">
              Tu próximo dispositivo.<br/>
              <span className="text-slate-300">Sin complicaciones.</span>
            </h2>

            <p className="max-w-2xl text-slate-500 font-medium text-lg md:text-xl leading-relaxed">
              Explora nuestra colección selecta de dispositivos con garantía extendida y soporte personalizado. Calidad Apple garantizada.
            </p>

            <div className="pt-12 w-full max-w-4xl">
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-4 w-full">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 whitespace-nowrap">Medios de Pago</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200"></div>
                </div>
                
                <div className="flex flex-wrap justify-center gap-6">
                  {[0, 1].map((index) => {
                    const imageUrl = data.settings.paymentMethods?.[index];
                    return (
                      <div key={index} className="relative group">
                        <div className={cn(
                          "w-40 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all",
                          imageUrl ? "border-transparent bg-white shadow-sm" : "border-slate-100 bg-slate-50/50"
                        )}>
                          {imageUrl ? (
                            <img src={imageUrl} alt={`Pago ${index + 1}`} className="w-full h-full object-contain p-4" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="flex flex-col items-center gap-2 opacity-20">
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
                    ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10 scale-105" 
                    : "bg-white text-slate-400 hover:text-slate-900 hover:bg-slate-50 border border-slate-100"
                )}
              >
                <cat.icon className="w-4 h-4" />
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
               Colección Disponible
               <span className="h-px w-12 bg-slate-200"></span>
            </h3>
            <p className="text-[10px] font-bold text-slate-400 italic">{publicProducts.length} resultados encontrados</p>
          </div>

          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {publicProducts.map((p) => (
              <motion.div key={p.id} variants={item}>
                <Card className="group card-premium rounded-3xl overflow-hidden border-none h-full flex flex-col">
                  <div 
                    className="aspect-[4/5] relative flex items-center justify-center bg-slate-50 overflow-hidden cursor-pointer"
                    onClick={() => {
                        setSelectedProduct(p);
                        setActiveImageIndex(0);
                    }}
                  >
                    {p.images && p.images.length > 0 ? (
                      <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-20 group-hover:opacity-40 transition-opacity">
                         <Smartphone className="w-20 h-20 text-slate-900" />
                         <span className="text-[10px] font-black tracking-widest uppercase">LDIphone Shop</span>
                      </div>
                    )}
                    
                    {p.images && p.images.length > 1 && (
                      <div className="absolute bottom-4 right-4 bg-black/40 text-white text-[9px] font-bold px-3 py-1.5 rounded-full backdrop-blur-lg border border-white/10 group-hover:bg-slate-900 transition-colors uppercase tracking-widest">
                        +{p.images.length} FOTOS
                      </div>
                    )}
                  </div>

                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="font-black text-xl tracking-tight text-slate-900 leading-none group-hover:text-primary transition-colors cursor-pointer" onClick={() => { setSelectedProduct(p); setActiveImageIndex(0); }}>{p.name}</h3>
                       <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black h-5 uppercase tracking-widest px-1.5 shrink-0">DISPONIBLE</Badge>
                    </div>

                    {p.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed font-medium h-8">
                        {p.description}
                      </p>
                    )}
                    
                    <div className="space-y-4 mt-auto pt-4 border-t border-slate-50">
                        {p.warrantyMonths && (
                            <div className="text-[9px] font-black text-blue-600 uppercase flex items-center gap-1.5 tracking-widest bg-blue-50 w-fit px-2 py-1 rounded-md">
                                <ShieldCheck className="w-3.5 h-3.5" /> {p.warrantyMonths} MESES GARANTÍA
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Precio Especial</span>
                                <span className="text-2xl font-black text-slate-900 tracking-tighter">{fmt(p.salePrice || 0)}</span>
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
                className="text-center py-32 border-4 border-dashed border-slate-100 rounded-[3rem]"
            >
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">No encontramos lo que buscas</h3>
              <p className="text-slate-500 mt-2 font-medium">Contáctanos directamente, puede que tengamos stock entrando pronto.</p>
              <Button variant="outline" className="mt-8 rounded-full h-12 px-8 font-black uppercase text-[10px] tracking-widest border-2" onClick={() => setSearch('')}>
                 Limpiar Búsqueda
              </Button>
            </motion.div>
          )}
        </div>
      </main>

      {/* Product View Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
         <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-none rounded-[2rem] gap-0">
            {selectedProduct && (
                <div className="flex flex-col md:flex-row h-full max-h-[90vh] md:max-h-nonw overflow-y-auto md:overflow-hidden">
                    {/* Image Gallery */}
                    <div className="w-full md:w-3/5 bg-slate-900 relative group aspect-square md:aspect-auto">
                        <AnimatePresence mode="wait">
                            <motion.img 
                                key={activeImageIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                src={selectedProduct.images?.[activeImageIndex] || ''} 
                                className="w-full h-full object-contain"
                                alt={selectedProduct.name}
                            />
                        </AnimatePresence>
                        
                        {selectedProduct.images && selectedProduct.images.length > 1 && (
                            <>
                                <button 
                                    onClick={() => setActiveImageIndex(prev => prev > 0 ? prev - 1 : selectedProduct.images!.length - 1)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button 
                                    onClick={() => setActiveImageIndex(prev => prev < selectedProduct.images!.length - 1 ? prev + 1 : 0)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                                <div className="absolute bottom-6 inset-x-0 flex justify-center gap-2">
                                    {selectedProduct.images.map((_, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => setActiveImageIndex(i)}
                                            className={cn(
                                                "w-2 h-2 rounded-full transition-all",
                                                activeImageIndex === i ? "bg-white w-6" : "bg-white/30"
                                            )}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Details */}
                    <div className="w-full md:w-2/5 p-8 flex flex-col bg-white">
                        <div className="mb-6">
                            <Badge className="bg-blue-50 text-blue-600 border-none text-[9px] font-black uppercase tracking-widest mb-3 px-2 py-1">Stock Disponible</Badge>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight">{selectedProduct.name}</h2>
                            <div className="text-3xl font-black text-emerald-600 tracking-tighter mt-2">{fmt(selectedProduct.salePrice || 0)}</div>
                        </div>

                        <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                           <div className="space-y-2">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción</h4>
                              <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                                 {selectedProduct.description || 'Sin descripción disponible para este equipo.'}
                              </p>
                           </div>
                           
                           {selectedProduct.warrantyMonths && (
                               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                   <div className="flex items-center gap-2 text-blue-600">
                                       <ShieldCheck className="w-4 h-4" />
                                       <span className="text-[10px] font-black uppercase tracking-widest">Garantía Asegurada</span>
                                   </div>
                                   <p className="text-sm font-black text-slate-900">{selectedProduct.warrantyMonths} MESES DE COBERTURA</p>
                                   <p className="text-[9px] text-slate-400 font-medium uppercase leading-tight">Certificado oficial en cada compra.</p>
                               </div>
                           )}
                        </div>

                        <div className="pt-8 space-y-3">
                            <a 
                                href={getWhatsAppLink(selectedProduct)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-600/20 transition-all active:scale-95"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                </svg>
                                COMPRAR POR WHATSAPP
                            </a>
                            <button 
                                onClick={() => setSelectedProduct(null)}
                                className="w-full h-12 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center font-black uppercase text-[10px] tracking-widest transition-colors"
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
      <section className="bg-slate-950 py-16">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-2">
                    <Apple className="w-6 h-6" />
                </div>
                <h4 className="text-white font-black uppercase tracking-widest text-xs">Original Apple Only</h4>
                <p className="text-slate-500 text-sm font-medium">Garantizamos la autenticidad de cada componente y dispositivo.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-2">
                    <ShieldCheck className="w-6 h-6 text-blue-400" />
                </div>
                <h4 className="text-white font-black uppercase tracking-widest text-xs">Garantía Extendida</h4>
                <p className="text-slate-500 text-sm font-medium">Hasta 12 meses de cobertura técnica en fallos de fabricación.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-2">
                    <Smartphone className="w-6 h-6" />
                </div>
                <h4 className="text-white font-black uppercase tracking-widest text-xs">Test de Calidad</h4>
                <p className="text-slate-500 text-sm font-medium">Cada equipo pasa por un riguroso test de 32 puntos funcionales.</p>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
                <Logo size="sm" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Premium Apple Stock © 2026</p>
            </div>
            <div className="flex gap-8">
                <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Términos</a>
                <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Privacidad</a>
                <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Instagram</a>
            </div>
        </div>
      </footer>
    </div>
  );
}
