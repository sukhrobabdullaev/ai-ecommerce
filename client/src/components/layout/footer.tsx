import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-muted/50 border-t">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="ai-gradient h-8 w-8 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">AI</span>
                            </div>
                            <span className="font-bold text-xl">Ecommerce</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            The future of shopping is here. Experience AI-powered e-commerce with natural language search,
                            personalized recommendations, and voice-enabled shopping.
                        </p>
                        <div className="flex space-x-4">
                            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Facebook className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Twitter className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Instagram className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Linkedin className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Quick Links</h3>
                        <div className="space-y-2">
                            <Link href="/products" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                                All Products
                            </Link>
                            <Link href="/categories" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                                Categories
                            </Link>
                            <Link href="/deals" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                                Deals & Offers
                            </Link>
                            <Link href="/new-arrivals" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                                New Arrivals
                            </Link>
                            <Link href="/trending" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                                Trending
                            </Link>
                        </div>
                    </div>

                    {/* Customer Service */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Customer Service</h3>
                        <div className="space-y-2">
                            <Link href="/help" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                                Help Center
                            </Link>
                            <Link href="/shipping" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                                Shipping Info
                            </Link>
                            <Link href="/returns" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                                Returns & Exchanges
                            </Link>
                            <Link href="/size-guide" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                                Size Guide
                            </Link>
                            <Link href="/contact" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                                Contact Us
                            </Link>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Contact Info</h3>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">support@aiecommerce.com</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">+1 (555) 123-4567</span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <span className="text-sm text-muted-foreground">
                                    123 AI Street<br />
                                    Tech City, TC 12345
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t mt-8 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-sm text-muted-foreground">
                            © 2024 AI Ecommerce. All rights reserved.
                        </p>
                        <div className="flex space-x-6">
                            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                Privacy Policy
                            </Link>
                            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                Terms of Service
                            </Link>
                            <Link href="/cookies" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                Cookie Policy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
