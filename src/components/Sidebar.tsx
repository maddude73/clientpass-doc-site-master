import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, FileText, Settings, LogOut, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientPassLogo } from '@/components/ClientPassLogo';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Use dynamic active provider from AI Gateway
    const getActiveProvider = () => {
        // Get from localStorage if available (set by AI Configuration page)
        const storedConfig = localStorage.getItem('aiGatewayConfig');
        let activeProvider = 'openai'; // default

        if (storedConfig) {
            try {
                const config = JSON.parse(storedConfig);
                activeProvider = config.activeProvider || 'openai';
            } catch (e) {
                console.warn('Failed to parse AI Gateway config from localStorage');
            }
        }

        // Map provider names to display info
        switch (activeProvider) {
            case 'openai':
                return { name: 'OpenAI', color: 'text-green-400' };
            case 'google':
                return { name: 'Gemini', color: 'text-blue-400' };
            case 'anthropic':
                return { name: 'Claude', color: 'text-orange-400' };
            case 'ollama':
                return { name: 'Ollama', color: 'text-purple-400' };
            default:
                return { name: 'AI Gateway', color: 'text-gray-400' };
        }
    };

    const [activeProvider, setActiveProvider] = useState(getActiveProvider());

    // Listen for localStorage changes to update provider display
    useEffect(() => {
        const handleStorageChange = () => {
            setActiveProvider(getActiveProvider());
        };

        // Listen for storage events (from other tabs/windows)
        window.addEventListener('storage', handleStorageChange);

        // Also listen for manual updates within this tab
        const interval = setInterval(() => {
            const current = getActiveProvider();
            setActiveProvider(prev => {
                if (prev.name !== current.name || prev.color !== current.color) {
                    return current;
                }
                return prev;
            });
        }, 1000); // Check every second

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast({
                title: "Error signing out",
                description: error.message,
                variant: "destructive",
            });
        } else {
            navigate('/auth');
        }
    };

    const navItems = [
        { path: '/docs', icon: FileText, label: 'Documentation' },
        { path: '/ai-config', icon: Settings, label: 'AI Configuration' },
    ]; const isActive = (path: string) => location.pathname === path;

    return (
        <>
            {/* Mobile hamburger button */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 md:hidden"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 h-full text-white
          transition-all duration-300 ease-in-out z-40 shadow-xl
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
                style={{ backgroundColor: '#008080' }}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-primary-foreground/20">
                        <div className="flex items-center justify-between">
                            {!isCollapsed && (
                                <div className="flex flex-col gap-2 flex-1">
                                    <div className="invert brightness-0 dark:invert-0 dark:brightness-100 w-[192px]">
                                        <img
                                            src="/clientpass-logo.png"
                                            alt="ClientPass"
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <Sparkles className={`h-3 w-3 ${activeProvider.color}`} />
                                        <span className="text-primary-foreground/70">
                                            AI: <span className={activeProvider.color}>{activeProvider.name}</span>
                                        </span>
                                    </div>
                                </div>
                            )}
                            {isCollapsed && (
                                <Sparkles className={`h-5 w-5 ${activeProvider.color}`} />
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="hidden md:flex hover:bg-primary-foreground/10"
                            >
                                {isCollapsed ? (
                                    <ChevronRight className="h-5 w-5" />
                                ) : (
                                    <ChevronLeft className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileOpen(false)}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${active
                                            ? 'bg-primary-foreground/20 text-primary-foreground shadow-lg'
                                            : 'hover:bg-primary-foreground/10 text-primary-foreground/80 hover:text-primary-foreground'
                                        }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                                >
                                    <Icon className="h-5 w-5 flex-shrink-0" />
                                    {!isCollapsed && (
                                        <span className="font-medium">{item.label}</span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-primary-foreground/20">
                        <Button
                            variant="ghost"
                            onClick={handleSignOut}
                            className={`
                w-full text-primary-foreground/80 hover:text-primary-foreground hover:bg-red-600/20
                ${isCollapsed ? 'px-2' : 'justify-start'}
              `}
                        >
                            <LogOut className="h-5 w-5 flex-shrink-0" />
                            {!isCollapsed && <span className="ml-3">Sign Out</span>}
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </>
    );
};
