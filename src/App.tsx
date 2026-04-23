import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ShoppingCart, CreditCard, Receipt, TrendingDown, Wallet, ExternalLink, LogOut, Lock } from 'lucide-react';
import { cn } from './lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Label } from './components/ui/label';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Investors from './components/Investors';
import Sales from './components/Sales';
import Debtors from './components/Debtors';
import Liabilities from './components/Liabilities';
import InvoiceView from './components/InvoiceView';
import Finance from './components/Finance';
import Catalog from './components/Catalog';
import WarrantyPage from './components/WarrantyPage';
import { useAppData } from './hooks/useAppData';

function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.toLowerCase() === 'duvanmarinj@gmail.com' && password === 'Thomas1228$') {
      if (rememberMe) {
        localStorage.setItem('ldiphone_auth', 'true');
      } else {
        sessionStorage.setItem('ldiphone_auth', 'true');
      }
      onLogin();
    } else {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto bg-slate-900 text-white p-3 rounded-2xl w-fit mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tight">Acceso Restringido</CardTitle>
          <p className="text-slate-500 text-sm">Ingresa tus credenciales para continuar</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="usuario@ejemplo.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="remember" 
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <Label htmlFor="remember" className="text-sm font-medium cursor-pointer">Mantener sesión iniciada</Label>
            </div>

            {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}
            <Button type="submit" className="w-full bg-slate-900 h-11 text-base">
              Iniciar Sesión
            </Button>
            <div className="pt-4 border-t text-center">
              <Link to="/catalog" className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">
                Volver al Catálogo Público
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Navigation({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  
  // Hide navigation on public routes
  if (location.pathname === '/catalog' || location.pathname.startsWith('/warranty') || location.pathname.startsWith('/view-invoice')) {
    return null;
  }
  
  const navItems = [
    { path: '/', label: 'Resumen', icon: LayoutDashboard },
    { path: '/investors', label: 'Inversores', icon: Users },
    { path: '/inventory', label: 'Inventario', icon: Package },
    { path: '/sales', label: 'Ventas', icon: ShoppingCart },
    { path: '/finance', label: 'Cuentas/Gastos', icon: Wallet },
    { path: '/debtors', label: 'Cuentas x Cobrar', icon: CreditCard },
    { path: '/liabilities', label: 'Pasivos', icon: TrendingDown },
    { path: '/cat', label: 'Catálogo', icon: ExternalLink, external: true },
  ];

  return (
    <nav className="flex items-center gap-1 p-2 bg-white border-b overflow-x-auto no-scrollbar sticky top-0 z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        if (item.external) {
          return (
            <Link
              key={item.path}
              to="/catalog"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors whitespace-nowrap"
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        }

        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
              isActive 
                ? "bg-slate-100 text-slate-900 border border-slate-200" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </Link>
        );
      })}
      
      <button
        onClick={onLogout}
        className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-rose-500 hover:bg-rose-50 transition-colors whitespace-nowrap"
      >
        <LogOut className="w-4 h-4" />
        Salir
      </button>
    </nav>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="p-4 max-w-7xl mx-auto">
      {children}
    </main>
  );
}

export default function App() {
  const appData = useAppData();
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('ldiphone_auth') === 'true' || 
    sessionStorage.getItem('ldiphone_auth') === 'true'
  );

  const handleLogout = () => {
    localStorage.removeItem('ldiphone_auth');
    sessionStorage.removeItem('ldiphone_auth');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        {isAuthenticated && <Navigation onLogout={handleLogout} />}
        <Routes>
          {/* Public Routes */}
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/warranty" element={<WarrantyPage />} />
          <Route path="/warranty/:id" element={<WarrantyPage />} />
          <Route path="/view-invoice/:id" element={<InvoiceView appData={appData} isPublic />} />
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={() => setIsAuthenticated(true)} />
          } />
          
          {/* Admin Routes (Protected) */}
          <Route path="/" element={
            !isAuthenticated ? <Navigate to="/login" replace /> : <AdminLayout><Dashboard appData={appData} /></AdminLayout>
          } />
          <Route path="/investors" element={
            !isAuthenticated ? <Navigate to="/login" replace /> : <AdminLayout><Investors appData={appData} /></AdminLayout>
          } />
          <Route path="/inventory" element={
            !isAuthenticated ? <Navigate to="/login" replace /> : <AdminLayout><Inventory appData={appData} /></AdminLayout>
          } />
          <Route path="/sales" element={
            !isAuthenticated ? <Navigate to="/login" replace /> : <AdminLayout><Sales appData={appData} /></AdminLayout>
          } />
          <Route path="/finance" element={
            !isAuthenticated ? <Navigate to="/login" replace /> : <AdminLayout><Finance appData={appData} /></AdminLayout>
          } />
          <Route path="/debtors" element={
            !isAuthenticated ? <Navigate to="/login" replace /> : <AdminLayout><Debtors appData={appData} /></AdminLayout>
          } />
          <Route path="/liabilities" element={
            !isAuthenticated ? <Navigate to="/login" replace /> : <AdminLayout><Liabilities appData={appData} /></AdminLayout>
          } />
          <Route path="/invoice" element={
            !isAuthenticated ? <Navigate to="/login" replace /> : <AdminLayout><InvoiceView appData={appData} /></AdminLayout>
          } />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
        </Routes>
      </div>
    </Router>
  );
}
