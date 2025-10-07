'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  User,
  LogOut,
  Settings,
  ShoppingCart,
  MessageSquare,
  BarChart3,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuthStore } from '@/store/auth-store';
import { useChatStore } from '@/store/chat-store';
import { useCartStore } from '@/store/cart-store';
import { AuthForm } from '@/components/auth/auth-form';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CartSidebar } from '@/components/cart/cart-sidebar';
import { CartBadge } from '@/components/cart/cart-badge';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const { user, isAuthenticated, logout } = useAuthStore();
  const { currentSession, selectedSystem } = useChatStore();

  const { openCart } = useCartStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const navigation = [
    { name: 'Home', href: '/', active: pathname === '/' },
    { name: 'Products', href: '/products', active: pathname.startsWith('/products') },
    // { name: 'Cart', href: '/cart', active: pathname === '/cart' },
    { name: 'Wishlist', href: '/wishlist', active: pathname === '/wishlist' },
  ];


  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="rounded-lg bg-primary p-1">
                <ShoppingCart className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="hidden font-bold sm:inline-block">AI Commerce</span>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products or ask AI..."
                  className="pl-10 pr-4"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>

            {/* Navigation & User Menu - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Navigation Links */}
              <nav className="flex items-center space-x-2">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={item.active ? "default" : "ghost"}
                      size="sm"
                      className="relative"
                    >
                      {item.name}
                      {item.name === 'AI Chat' && currentSession && (
                        <Badge className="ml-2 h-4 w-4 rounded-full p-0 text-xs">
                          <MessageSquare className="h-2 w-2" />
                        </Badge>
                      )}
                    </Button>
                  </Link>
                ))}
              </nav>

              {/* Cart Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={openCart}
                className="relative"
              >
                <ShoppingCart className="h-4 w-4" />
                <CartBadge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs" />
              </Button>

              {/* AI System Indicator */}
              {currentSession && (
                <Badge variant="outline" className="text-xs">
                  {selectedSystem.replace('_', ' ')}
                </Badge>
              )}

              {/* User Menu */}
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm font-medium">
                      {user.name || user.email}
                    </div>
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      {user.email}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" onClick={() => openAuthModal('login')}>
                    Sign In
                  </Button>
                  <Button onClick={() => openAuthModal('register')}>
                    Sign Up
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 py-4">
                  {/* Mobile Search */}
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search products or ask AI..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </form>

                  {/* Mobile Navigation */}
                  <nav className="flex flex-col space-y-2">
                    {navigation.map((item) => (
                      <Link key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                        <Button
                          variant={item.active ? "default" : "ghost"}
                          className="w-full justify-start"
                        >
                          {item.name}
                        </Button>
                      </Link>
                    ))}

                    {/* Mobile Cart Button */}
                    <Button
                      variant="ghost"
                      onClick={() => { openCart(); setMobileMenuOpen(false); }}
                      className="w-full justify-start"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Cart
                      <CartBadge className="ml-auto h-5 w-5 rounded-full p-0 text-xs" />
                    </Button>
                  </nav>

                  {/* Mobile User Section */}
                  {isAuthenticated && user ? (
                    <div className="space-y-2 pt-4 border-t">
                      <div className="px-3 py-2">
                        <p className="font-medium">{user.name || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/research" onClick={() => setMobileMenuOpen(false)}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Research Dashboard
                        </Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-2 pt-4 border-t">
                      <Button onClick={() => { openAuthModal('login'); setMobileMenuOpen(false); }}>
                        Sign In
                      </Button>
                      <Button variant="outline" onClick={() => { openAuthModal('register'); setMobileMenuOpen(false); }}>
                        Sign Up
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md p-0 gap-0">
          <AuthForm
            mode={authMode}
            onModeChange={setAuthMode}
            onSuccess={() => setShowAuthModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Cart Sidebar */}
      <CartSidebar />
    </>
  );
}