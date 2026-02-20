import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook } from 'lucide-react';

export function Footer() {
    return (
        <footer className="border-t border-white/5 py-16 px-6 relative overflow-hidden bg-black/50">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16">
                    {/* Brand Column */}
                    <div className="md:col-span-5 flex flex-col items-start">
                        <Link to="/" className="inline-block mb-6">
                            <img src="/clubin-logo-header.webp" alt="Clubin" className="h-10 md:h-12 w-auto drop-shadow-lg opacity-90 hover:opacity-100 transition-opacity" />
                        </Link>
                        <p className="text-white/50 text-sm md:text-base leading-relaxed font-manrope font-light max-w-sm mb-8">
                            Experience nightlife without the hassle. The ultimate platform to manage events, guestlists, and reach thousands of users seamlessly.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:-translate-y-1 transition-all duration-300">
                                <Instagram className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:-translate-y-1 transition-all duration-300">
                                <Facebook className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:-translate-y-1 transition-all duration-300">
                                <Twitter className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Links Space Adjuster */}
                    <div className="hidden md:block md:col-span-3"></div>

                    {/* Links Columns */}
                    <div className="md:col-span-4 grid grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-white font-bold font-inter mb-6 uppercase tracking-wider text-xs">Product</h4>
                            <ul className="flex flex-col gap-4 text-sm text-white/50 font-manrope">
                                <li><Link to="/clubs" className="hover:text-white transition-colors">Browse Clubs</Link></li>
                                <li><Link to="/list-your-club" className="hover:text-[#a484d7] transition-colors">List Your Club</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold font-inter mb-6 uppercase tracking-wider text-xs">Legal</h4>
                            <ul className="flex flex-col gap-4 text-sm text-white/50 font-manrope">
                                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-white/40 text-xs sm:text-sm font-manrope order-2 md:order-1">
                        © {new Date().getFullYear()} Clubin. All rights reserved.
                    </div>
                    <div className="flex items-center gap-2 text-white/40 text-xs sm:text-sm font-manrope order-1 md:order-2">
                        <span>Built with</span>
                        <span className="text-red-500 animate-pulse">❤️</span>
                        <span>for nightlife lovers</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
