import { useState } from 'react';
import { Menu, Copy, Check, Share2, Save, TrendingUp, ArrowLeftRight } from 'lucide-react';
import LZString from 'lz-string';
import { Button } from '../UI/Button';
import { useTreeMode } from '../../context/TreeModeContext';
import { useProfile } from '../../context/ProfileContext';
import { ProfileIcon } from '../Profile/ProfileHeaderPanel';
import { cn } from '../../lib/utils';
import { AnimatedClock } from '../UI/AnimatedClock';
import { useGlobalStats } from '../../hooks/useGlobalStats';
import { formatCompactNumber } from '../../utils/statsCalculator';
import { useComparison } from '../../context/ComparisonContext';

interface HeaderProps {
    onMenuToggle: () => void;
    onStatsToggle: () => void;
}

export function Header({ onMenuToggle, onStatsToggle }: HeaderProps) {
    const { treeMode } = useTreeMode();
    const { profile, saveSharedProfile } = useProfile();
    const { excludeSubstats, setExcludeSubstats } = useComparison();
    const stats = useGlobalStats(excludeSubstats);
    const [justCopied, setJustCopied] = useState(false);

    const handleShare = () => {
        try {
            const json = JSON.stringify({ ...profile, isShared: true });
            // Use LZ-String compression for shorter URLs
            const compressed = LZString.compressToEncodedURIComponent(json);
            const url = `${window.location.origin}${window.location.pathname}?b62c=${compressed}`;
            navigator.clipboard.writeText(url);
            setJustCopied(true);
            setTimeout(() => setJustCopied(false), 2000);
        } catch (err) {
            console.error('Failed to share profile', err);
        }
    };

    return (
        <header className="h-16 sticky top-0 bg-bg-secondary/80 backdrop-blur-md border-b border-border z-50 flex items-center justify-between px-2 sm:px-4 lg:px-8">
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Combined Menu / Profile Button */}
                <button
                    onClick={onMenuToggle}
                    className="flex items-center gap-2 p-1.5 pr-2.5 sm:pr-3 rounded-xl hover:bg-bg-input border border-border hover:border-accent-primary/30 transition-all active:scale-95 group shadow-sm shrink-0"
                    title="Open Navigation Menu & Profiles"
                >
                    <div className="relative shrink-0">
                        <ProfileIcon iconIndex={profile.iconIndex} size={28} className="border-0 group-hover:scale-105 transition-transform" />
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent-primary border border-bg-secondary rounded-full flex items-center justify-center shadow-sm">
                            <Menu className="w-2.5 h-2.5 text-white" />
                        </span>
                    </div>
                    <span className="font-semibold text-xs text-text-secondary group-hover:text-text-primary truncate max-w-[80px] hidden sm:inline leading-none animate-pulse-subtle">
                        {profile.name}
                    </span>
                </button>
            </div>

            {/* Global Stats - Visible on all screens, adjusting size/layout */}
            <div className="flex-1 px-1 sm:px-4 flex justify-center items-center min-w-0">
                <div className="relative">
                    {/* Clickable Mode Indicator Tag - Overlay floating button */}
                    <button
                        onClick={() => setExcludeSubstats(!excludeSubstats)}
                        className={cn(
                            "absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border flex items-center justify-center shadow-lg active:scale-95 transition-all z-20 hover:scale-110",
                            excludeSubstats
                                ? "bg-purple-600 text-white border-purple-400 hover:bg-purple-500 shadow-purple-500/20"
                                : "bg-orange-600 text-white border-orange-400 hover:bg-orange-500 shadow-orange-500/20"
                        )}
                        title={excludeSubstats ? "New Stats (Substats excluded). Click to switch to Old Stats." : "Old Stats (Substats included). Click to switch to New Stats."}
                    >
                        <ArrowLeftRight className="w-3 h-3" />
                    </button>

                    <div className={cn(
                        "flex items-center gap-1.5 sm:gap-6 pl-5 pr-1.5 sm:pr-3 py-1 sm:py-1.5 rounded-lg border backdrop-blur-sm overflow-x-auto no-scrollbar max-w-full transition-all duration-300",
                        excludeSubstats
                            ? "bg-purple-950/20 border-purple-500/30 text-purple-200 shadow-[0_0_15px_rgba(147,51,234,0.05)]"
                            : "bg-orange-950/20 border-orange-500/30 text-orange-200 shadow-[0_0_15px_rgba(249,115,22,0.05)]"
                    )}>
                        {/* Power */}
                        <div className="flex flex-col items-center shrink-0">
                            <span className={cn(
                                "text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors",
                                excludeSubstats ? "text-purple-400" : "text-orange-400"
                            )}>Pwr</span>
                            <span className="text-xs sm:text-sm font-bold text-text-primary leading-none">
                                {stats ? formatCompactNumber(stats.power) : '-'}
                            </span>
                        </div>

                        {/* Separator */}
                        <div className="w-px h-6 bg-border/50 shrink-0" />

                        {/* Damage */}
                        <div className="flex flex-col items-center shrink-0">
                            <span className="text-[9px] sm:text-[10px] text-red-400 font-bold uppercase tracking-wider">Dmg</span>
                            <span className="text-xs sm:text-sm font-bold text-text-primary leading-none">
                                {stats ? formatCompactNumber(stats.totalDamage) : '-'}
                            </span>
                        </div>

                        {/* Separator */}
                        <div className="w-px h-6 bg-border/50 shrink-0" />

                        {/* Health */}
                        <div className="flex flex-col items-center shrink-0">
                            <span className="text-[9px] sm:text-[10px] text-green-400 font-bold uppercase tracking-wider">HP</span>
                            <span className="text-xs sm:text-sm font-bold text-text-primary leading-none">
                                {stats ? formatCompactNumber(stats.totalHealth) : '-'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                {/* Share / Save Shared Logic */}
                {profile.isShared ? (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={saveSharedProfile}
                        className="gap-2"
                    >
                        <Save className="w-4 h-4" />
                        <span className="hidden sm:inline">Save to My Profiles</span>
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleShare}
                        className={cn("gap-2", justCopied && "text-green-400")}
                    >
                        {justCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                        <span className="hidden sm:inline">{justCopied ? 'Copied!' : 'Share'}</span>
                    </Button>
                )}

                {/* Stats Drawer Toggle */}
                <Button
                    variant="primary"
                    size="sm"
                    onClick={onStatsToggle}
                    className={cn(
                        "gap-2 shadow-lg transition-all duration-300",
                        treeMode === 'my'
                            ? "from-emerald-600 to-green-700 shadow-emerald-500/20"
                            : "from-red-600 to-rose-700 shadow-red-500/20"
                    )}
                >
                    <AnimatedClock className="w-5 h-5" />
                    <span className="hidden sm:inline">Character Stats</span>
                </Button>

            </div>

            {/* ConfirmModal removed - using native window.confirm inside Sidebar */}
        </header>
    );
}
