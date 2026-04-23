import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, ShoppingBag, Camera, Menu, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { fmt, cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Catalog() {
  const { data } = useAppData();
  const [search, setSearch] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const publicProducts = data.products.filter(p => 
    p.status === 'stock' && 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative md:hidden">
              <button 
                className="-ml-2 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {isMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border p-1 z-50">
                  <Link to="/" className="flex items-center gap-3 py-3 px-3 hover:bg-slate-50 rounded-md transition-colors" onClick={() => setIsMenuOpen(false)}>
                    <LayoutDashboard className="w-4 h-4 text-slate-500" />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700">Panel de Control</span>
                  </Link>
                  <div className="h-px bg-slate-100 my-1" />
                  <Link to="/warranty" className="flex items-center gap-3 py-3 px-3 hover:bg-slate-50 rounded-md transition-colors" onClick={() => setIsMenuOpen(false)}>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700">Consultar Garantía</span>
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <div className="leading-tight">
                <h1 className="text-lg font-black uppercase tracking-tighter">LDIPHONE Shop</h1>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-1 rounded inline-block">Disponibilidad Inmediata</p>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6 mr-auto ml-12 overflow-hidden">
            <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Admin</Link>
            <Link to="/warranty" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-1">
              Garantías
            </Link>
          </div>

          <div className="relative max-w-[200px] sm:max-w-md w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Buscar..." 
              className="pl-9 h-9 bg-slate-50 border-none shadow-inner rounded-full text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {publicProducts.map((p) => (
              <Card key={p.id} className="group border-none shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden bg-white">
                <div className="aspect-square relative flex items-center justify-center bg-slate-50">
                  {p.images && p.images.length > 0 ? (
                    <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.name} />
                  ) : (
                    <Camera className="w-12 h-12 text-slate-200" />
                  )}
                  {p.images && p.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                      +{p.images.length - 1} fotos
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <div className="mb-1 uppercase text-[10px] font-bold text-slate-400 flex justify-between">
                    <span>{p.investor}</span>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none hover:bg-emerald-50 text-[10px]">DISPONIBLE</Badge>
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-slate-900 leading-snug">{p.name}</h3>
                  {p.warrantyMonths ? (
                    <div className="text-[10px] font-bold text-blue-500 mb-4 uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> {p.warrantyMonths} Meses de Garantía
                    </div>
                  ) : (
                    <div className="mb-4" />
                  )}
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Precio</div>
                      <div className="text-xl font-black text-primary">{fmt(p.salePrice || 0)}</div>
                    </div>
                    <a 
                      href={`https://wa.me/573012949934?text=Hola! Estoy interesado en el ${p.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-all active:scale-90 hover:brightness-110"
                    >
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
                        alt="Contactar"
                        className="w-10 h-10 drop-shadow-md"
                        referrerPolicy="no-referrer"
                      />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {publicProducts.length === 0 && (
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 underline underline-offset-8 decoration-primary/30">No encontramos productos</h3>
              <p className="text-slate-500 mt-2">Intenta con otra búsqueda o contacta al vendedor.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t p-8 text-center mt-12">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">LDIphone Shop © 2026</p>
      </footer>
    </div>
  );
}
