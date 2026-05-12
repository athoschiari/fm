import { useState, useEffect, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Coffee, ExternalLink, Github } from 'lucide-react';
import { useGameDataContext } from '../../context/GameDataContext';
import { useProfile } from '../../context/ProfileContext';
import { StatsSummaryPanel } from '../Profile/StatsSummaryPanel';
import { cn } from '../../lib/utils';

const FRIENDLY_MESSAGES = (userName: string, hasRealName: boolean) => {
    const baseMessages = [
        `Hey ${userName}, still forging? Go grab a snack! 🥪`,
        `That hammer looks heavy, ${userName}. Take a coffee break! ☕`,
        `Did you know? Every 100 clicks, a developer drinks a double espresso. ⚡`,
        `Forging level 100? You're a legend, ${userName}! 🔨`,
        `If you hear a weird noise, it's just the developer's stomach growling. 🍕`,
        `Don't tell the NPCs, but ${userName} is my favorite user. 🤫`,
        `Success is 10% luck, 20% skill, and 70% caffeine. ☕`,
        `Error 404: Coffee not found in developer's system. Please donate caffeine. ☕`,
        `Rumor has it that ${userName} can forge even without sleep. 💤`,
        `Is it getting hot in here or did you just craft another Ultimate? 🌶️`,
        `You've been here a lot today, ${userName}. Your keyboard misses your family. 😂`,
        `Your hammer is glowing, ${userName}! Is that magic or just friction? 🔥`,
        `Hey ${userName}, I saw that Craft! Absolutely stunning. 🌟`,
        `Warning: Excessive forging may lead to excessive fun. ⚠️`,
        `If this tool was any faster, it would be a time machine. ⏳`,
        `Mastering the forge is a marathon, not a sprint, ${userName}. 🏃‍♂️`,
        `Is that a Mythic in your pocket or are you just happy to see me? 💎`,
        `The forge is hot, the coffee is cold. Perfect balance. ⚖️`,
        `${userName}, your progress is making the NPCs jealous. 😎`,
        `Want to see your name in lights? Join our Wall of Fame! 🏆`,
        `The Wall of Fame is waiting for its next hero... Is it you, ${userName}? ✨`,
        `Help keep the forge running and get your spot in the Hall of Fame! 🌟`,
        `Legend says that supporters get +10% Better Luck (not really, but maybe?) 🍀`,
        `Every coffee donated gives the dev +50 Agility to code faster! 🏃‍♂️💨`,
        `Support the forge and help me keep this tool free for everyone! 🔨❤️`,
        `Your support is the coal that keeps this fire burning, ${userName}! 🔥`,
        `If you find this tool useful, consider buying a coffee for the dev! ☕`,
        `The NPCs told me to tell you: you'd look great on the Wall of Fame. 😉`,
        `Coffee in, code out. Help keep the cycle going, ${userName}! ☕💻`,
        `Be the reason the developer smiles today. Support the forge! 😊`
    ];

    if (!hasRealName) {
        baseMessages.push(`Hey! You can set your name in the profile to personalize these messages! 👤`);
    }

    return baseMessages;
};

export default function AppShell() {
    const { selectedVersion } = useGameDataContext();
    const { profile } = useProfile();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [isHoveringCoffee, setIsHoveringCoffee] = useState(false);

    const donationLabel = useMemo(() => {
        const labels = [
            "Forge Fuel", "Buy Coffee", "Dev Juice", "Hammer Lube", 
            "Caffeine", "Boost Dev", "Fuel Me", "Coffee!", "Espresso",
            "Mythic Brew", "Forge Coal", "Mana Potion", "Binary Beans", 
            "Dev Energy", "Tips & Treats"
        ];
        return labels[Math.floor(Math.random() * labels.length)];
    }, []);

    const donationTooltip = useMemo(() => {
        const tooltips = [
            "FORGE NEEDS FUEL! ☕", "DEV NEEDS CAFFEINE! ⚡", "KEEP THE FIRE BURNING! 🔥",
            "UPGRADE MY COFFEE! ☕✨", "HAMMER NEEDS LUBE! 🔨", "ADD SOME FUEL! 🚀",
            "DONATE A BEAN! 🫘", "STAY AWAKE MODE! ⏱️"
        ];
        return tooltips[Math.floor(Math.random() * tooltips.length)];
    }, []);

    useEffect(() => {
        // Track visit frequency
        const visitCount = parseInt(localStorage.getItem('fm_visit_count') || '0') + 1;
        localStorage.setItem('fm_visit_count', visitCount.toString());

        const lastToastTime = parseInt(localStorage.getItem('fm_last_toast_time') || '0');
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        const userName = profile.name || 'Forge Master';
        const messages = FRIENDLY_MESSAGES(userName, !!profile.name);

        // Show toast if frequent visitor (every 3rd session/refresh) and it's been an hour
        if (visitCount > 1 && visitCount % 3 === 0 && (now - lastToastTime) > oneHour) {
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];
            
            setTimeout(() => {
                toast(
                    <div className="flex flex-col gap-0.5 select-none">
                        <div className="font-black text-[10px] uppercase tracking-widest text-[#FFDD00] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FFDD00] animate-pulse" />
                            Support the Forge
                        </div>
                        <div className="font-bold text-sm leading-tight text-white">
                            {randomMsg}
                        </div>
                        <div className="text-[9px] mt-1 font-black uppercase text-white/40 flex items-center gap-1">
                            Click to support the developer <span className="animate-bounce text-xs">☕❤️</span>
                        </div>
                    </div>,
                    { 
                        icon: <div className="text-xl">🛠️</div>,
                        autoClose: 10000,
                        position: "bottom-left",
                        onClick: () => window.open('https://www.buymeacoffee.com/1vcian', '_blank'),
                        className: "!bg-bg-secondary/90 !backdrop-blur-md !text-white border border-[#FFDD00]/30 shadow-[0_8px_32px_rgba(0,0,0,0.5)] cursor-pointer hover:border-[#FFDD00]/60 transition-all font-sans rounded-2xl",
                        progressClassName: "!bg-[#FFDD00]"
                    }
                );
                localStorage.setItem('fm_last_toast_time', now.toString());
            }, 5000);
        }

        // Expose test function to window for the user
        (window as any).__triggerTestToast = () => {
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];
            toast(
                <div className="flex flex-col gap-0.5 select-none">
                    <div className="font-black text-[10px] uppercase tracking-widest text-[#FFDD00] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FFDD00] animate-pulse" />
                        Support the Forge
                    </div>
                    <div className="font-bold text-sm leading-tight text-white">
                        {randomMsg}
                    </div>
                    <div className="text-[9px] mt-1 font-black uppercase text-white/40 flex items-center gap-1">
                        Click to support the developer <span className="animate-bounce text-xs">☕❤️</span>
                    </div>
                </div>,
                { 
                    icon: <div className="text-xl">🛠️</div>,
                    autoClose: 10000,
                    position: "bottom-left",
                    onClick: () => window.open('https://www.buymeacoffee.com/1vcian', '_blank'),
                    className: "!bg-bg-secondary/90 !backdrop-blur-md !text-white border border-[#FFDD00]/30 shadow-[0_8px_32px_rgba(0,0,0,0.5)] cursor-pointer hover:border-[#FFDD00]/60 transition-all font-sans rounded-2xl",
                    progressClassName: "!bg-[#FFDD00]"
                }
            );
        };

        return () => {
            delete (window as any).__triggerTestToast;
        };
    }, [profile.name]);

    const CoffeeFountain = () => (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
            {Array.from({ length: 5 }).map((_, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                    animate={{ 
                        opacity: [0, 1, 1, 0],
                        scale: [0.5, 1.2, 0.8],
                        x: (i % 2 === 0 ? 1 : -1) * (Math.random() * 30 + 15),
                        y: -(Math.random() * 80 + 40),
                    }}
                    transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                    }}
                    className="absolute left-1/2 top-1/2 text-lg"
                >
                    {i % 2 === 0 ? '☕' : '🔥'}
                </motion.span>
            ))}
        </div>
    );

    return (
        <div className="flex h-screen bg-bg-primary text-text-primary overflow-hidden font-sans text-left">
            {/* Sidebar Navigation */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content Area */}
            <div className={cn(
                "flex-1 flex flex-col h-full overflow-hidden relative lg:ml-64 transition-all duration-500 ease-in-out",
                isStatsOpen && "lg:pr-[450px]"
            )}>
                {/* Header */}
                <Header
                    onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    onStatsToggle={() => setIsStatsOpen(!isStatsOpen)}
                />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-20">
                    <Outlet />

                    {/* Footer */}
                    <footer className="mt-12 py-6 border-t border-border text-center text-text-muted text-sm">
                        <div className="flex flex-col gap-2 items-center justify-center">
                            <p>Forge Master Calculator &copy; {new Date().getFullYear()}</p>
                            <div className="flex items-center justify-center gap-4">
                                <a
                                    href="https://1vcian.me"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-accent-primary hover:text-accent-secondary transition-colors"
                                >
                                    Visit My Website <ExternalLink className="w-3 h-3" />
                                </a>
                                <span className="text-border">|</span>
                                <a
                                    href="https://github.com/1vcian/fm"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-text-secondary hover:text-white transition-colors"
                                >
                                    GitHub <Github className="w-3 h-3" />
                                </a>
                            </div>
                            {selectedVersion && (
                                <div className="mt-2 text-xs opacity-70">
                                    Data Version: {selectedVersion}
                                </div>
                            )}
                        </div>
                    </footer>
                </main>

                {/* Stats Drawer */}
                <div
                    className={cn(
                        "fixed inset-0 bg-black/60 backdrop-blur-md z-[60] transition-opacity duration-300 lg:hidden",
                        isStatsOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                    onClick={() => setIsStatsOpen(false)}
                />
                <div
                    className={cn(
                        "fixed top-0 right-0 bottom-0 w-full sm:w-[450px] bg-bg-primary border-l border-border z-[70] transition-transform duration-500 ease-out shadow-2xl",
                        isStatsOpen ? "translate-x-0" : "translate-x-full"
                    )}
                >
                    <div className="h-full flex flex-col overflow-hidden">
                        <StatsSummaryPanel onClose={() => setIsStatsOpen(false)} />
                    </div>
                </div>

                {/* Buy Me A Coffee - Fixed Floating Button */}
                <motion.a
                    href="https://www.buymeacoffee.com/1vcian"
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setIsHoveringCoffee(true)}
                    onMouseLeave={() => setIsHoveringCoffee(false)}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="fixed bottom-8 right-8 z-[100] group flex items-center gap-3 overflow-visible px-5 md:px-6 py-3 md:py-4 rounded-full bg-[#FFDD00] text-black font-extrabold shadow-[0_8px_25px_-5px_rgba(255,221,0,0.4)] hover:shadow-[0_12px_35px_-5px_rgba(255,221,0,0.6)] transition-shadow duration-300"
                >
                    <AnimatePresence>
                        {isHoveringCoffee && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                animate={{ opacity: 1, y: -50, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                className="absolute bottom-full right-0 mb-4 bg-white text-black px-4 py-2 rounded-2xl shadow-xl text-xs whitespace-nowrap font-black border-2 border-[#FFDD00] origin-bottom-right"
                            >
                                {donationTooltip}
                                <div className="absolute top-full right-6 -mt-1 w-3 h-3 bg-white border-r-2 border-b-2 border-[#FFDD00] rotate-45" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isHoveringCoffee && <CoffeeFountain />}
                    
                    <div className="absolute inset-0 rounded-full animate-shimmer pointer-events-none opacity-30 bg-gradient-to-r from-transparent via-white to-transparent" />

                    <div className="relative flex items-center gap-2.5 z-10">
                        <Coffee className="w-6 h-6 group-hover:rotate-[15deg] transition-transform duration-300" />
                        <span className="text-sm md:text-base tracking-tight uppercase">
                            {donationLabel}
                        </span>
                    </div>
                </motion.a>
            </div>
        </div>
    );
}
