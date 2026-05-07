import { useMemo, useState } from 'react';
import { useGameData } from '../hooks/useGameData';
import { Card } from '../components/UI/Card';
import { GameIcon } from '../components/UI/GameIcon';
import { Target, Trophy, Sword, Settings, Clock, Users, Shield, Zap, Info, Gift, Hammer as HammerIcon, ChevronRight, Search, Activity, Heart, TrendingUp, Star } from 'lucide-react';
import { cn } from '../lib/utils';
import { useGameDataContext } from '../context/GameDataContext';
import { AGES } from '../utils/constants';
import { getItemImage, getItemName } from '../utils/itemAssets';
import { formatNumber } from '../utils/format';

interface Reward {
    Amount: number;
    Type: string;
    $type: string;
}

interface MissionBattle {
    MissionId: number;
    MissionTitleId: string;
    MinLevel: number;
    BaseDamage: number;
    BaseHealth: number;
    UnitCount: number;
    MapAge: number;
    ChanceToHaveWeapon: number;
    ChanceToHaveHelmet: number;
    ChanceToHaveArmour: number;
    PossibleWeapons: { Item1: number; Item2: number }[] | null;
    PossibleHelmets: { Item1: number; Item2: number }[] | null;
    PossibleArmours: { Item1: number; Item2: number }[] | null;
}

interface MissionLevel {
    Index: number;
    MinHammerThiefLevel: number;
    MinLevel: number;
    MaxLevel: number;
}

interface MissionReward {
    Level: number;
    Rewards: Reward[];
}

interface MissionAllMemberReward {
    Level: number;
    Hammers: number;
}

interface MissionBaseConfig {
    DailyEnergy: number;
    MaxSupportMembers: number;
    RefreshGemCost: number;
    RefreshMissionCount: number;
    MissionBattleMatchTimerSeconds: number;
    HealthAndDamageLevelMultiplier: number;
    MissionOwnerRewardsCount: number;
}

interface MissionRallyTime {
    Id: number;
    TimeInSeconds: number;
}

function getRewardIcon(type: string): string {
    const map: Record<string, string> = {
        'Coins': 'Coin',
        'SkillSummonTickets': 'SkillTicket',
        'TechPotions': 'Potion',
        'Eggshells': 'Eggshell',
        'Hammers': 'Hammer',
        'ClockWinders': 'MountKey',
        'Gems': 'GemIcon',
        'GuildPotions': 'GuildPotions'
    };
    return map[type] || type;
}

function formatStage(lvl: number): string {
    if (lvl <= 0) return 'None';
    const world = Math.floor((lvl - 1) / 10) + 1;
    const stage = ((lvl - 1) % 10) + 1;
    return `${world}-${stage}`;
}

export default function MissionsWiki() {
    const { selectedVersion } = useGameDataContext();
    const [activeTab, setActiveTab] = useState<'missions' | 'progression'>('missions');
    const [clanPoints, setClanPoints] = useState(60);
    const [searchTerm, setSearchTerm] = useState('');
    
    const { data: battleLibrary } = useGameData<Record<string, MissionBattle>>('MissionBattleLibrary.json');
    const { data: levelLibrary } = useGameData<Record<string, MissionLevel>>('MissionLevelLibrary.json');
    const { data: rewardLibrary } = useGameData<Record<string, MissionReward>>('MissionRewardLibrary.json');
    const { data: allMemberRewardLibrary } = useGameData<Record<string, MissionAllMemberReward>>('MissionAllMemberRewardLibrary.json');
    const { data: baseConfig } = useGameData<MissionBaseConfig>('MissionBaseConfig.json');
    const { data: autoMapping } = useGameData<any>('AutoItemMapping.json');

    const loading = !battleLibrary || !levelLibrary || !rewardLibrary || !baseConfig;

    const currentClanLevelInfo = useMemo(() => {
        if (!levelLibrary) return null;
        return levelLibrary[clanPoints.toString()] || levelLibrary["1"];
    }, [levelLibrary, clanPoints]);

    const currentAllMemberReward = useMemo(() => {
        if (!allMemberRewardLibrary) return null;
        return allMemberRewardLibrary[clanPoints.toString()];
    }, [allMemberRewardLibrary, clanPoints]);

    const currentRewards = useMemo(() => {
        if (!rewardLibrary) return null;
        return rewardLibrary[clanPoints.toString()];
    }, [rewardLibrary, clanPoints]);

    const filteredMissions = useMemo(() => {
        if (!battleLibrary) return [];
        return Object.values(battleLibrary)
            .filter(m => m.MissionTitleId.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.MinLevel - b.MinLevel);
    }, [battleLibrary, searchTerm]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted animate-pulse">
                <Target className="w-12 h-12 mb-4 opacity-20" />
                <p>Forging Mission Data...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-20 px-4 sm:px-0">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-border pb-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-text-primary flex items-center gap-3">
                        <Target className="w-8 h-8 text-accent-primary" />
                        Mission Wiki
                    </h1>
                    <p className="text-text-secondary text-sm sm:text-base font-medium">Complete guide to Guild Missions, drops and scaling rewards.</p>
                </div>

                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                        <input
                            placeholder="Search missions..."
                            className="w-full bg-bg-input border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-accent-primary outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-bg-secondary/40 p-1 rounded-lg border border-border gap-1 shadow-inner">
                        <button 
                            onClick={() => setActiveTab('missions')}
                            className={cn(
                                "px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition-all",
                                activeTab === 'missions' ? "bg-accent-primary text-black" : "text-text-muted hover:text-text-primary"
                            )}
                        >
                            Missions
                        </button>
                        <button 
                            onClick={() => setActiveTab('progression')}
                            className={cn(
                                "px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition-all",
                                activeTab === 'progression' ? "bg-accent-primary text-black" : "text-text-muted hover:text-text-primary"
                            )}
                        >
                            Progression
                        </button>
                    </div>
                </div>
            </div>

            {/* Clan Points Slider - Style like Pets Level Slider */}
            <Card className="p-4 bg-bg-secondary/40 border-accent-primary/20">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="p-2 bg-accent-primary/10 rounded-lg">
                            <Trophy className="w-5 h-5 text-accent-primary" />
                        </div>
                        <span className="text-sm font-black text-text-secondary uppercase tracking-widest">Clan Points:</span>
                    </div>
                    <div className="flex-1 w-full flex items-center gap-4">
                        <input
                            type="range"
                            min={1}
                            max={60}
                            value={clanPoints}
                            onChange={(e) => setClanPoints(parseInt(e.target.value))}
                            className="flex-1 h-1.5 bg-bg-input rounded-lg appearance-none cursor-pointer accent-accent-primary"
                        />
                        <div className="min-w-[40px] font-mono font-black text-accent-primary text-lg text-center">
                            {clanPoints}
                        </div>
                    </div>
                    <div className="h-6 w-px bg-border/50 hidden sm:block" />
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black text-text-muted uppercase leading-none mb-1">Max Stage</span>
                            <span className="text-sm font-black text-white">{formatStage(currentClanLevelInfo?.MaxLevel || 0)}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black text-accent-primary uppercase leading-none mb-1">Shared Hammers</span>
                            <span className="text-sm font-black text-accent-primary">{currentAllMemberReward?.Hammers || 0}</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Main Content Area */}
            {activeTab === 'missions' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredMissions.map((battle) => {
                        const isUnlocked = (currentClanLevelInfo?.MaxLevel || 0) >= battle.MinLevel;
                        return (
                            <Card key={battle.MissionId} className={cn(
                                "flex flex-col relative overflow-hidden transition-all duration-300 group",
                                isUnlocked ? "hover:border-accent-primary/50" : "opacity-50 grayscale border-dashed border-border/50"
                            )}>
                                {/* Glow Effect */}
                                {isUnlocked && (
                                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-accent-primary/5 opacity-0 group-hover:opacity-100 blur-3xl transition-opacity pointer-events-none" />
                                )}

                                {/* Header Card */}
                                <div className="p-4 border-b border-border/50 flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded-full uppercase">ID {battle.MissionId}</span>
                                            <span className="text-[10px] font-bold text-text-muted uppercase">Min Stage {formatStage(battle.MinLevel)}</span>
                                        </div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-accent-primary transition-colors">
                                            {battle.MissionTitleId.replace(/([A-Z])/g, ' $1').trim()}
                                        </h3>
                                    </div>
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
                                        isUnlocked ? "bg-bg-secondary border-accent-primary/30" : "bg-bg-input border-border"
                                    )}>
                                        <Target className={cn("w-5 h-5", isUnlocked ? "text-accent-primary" : "text-text-muted")} />
                                    </div>
                                </div>

                                {/* Stats Body */}
                                <div className="p-4 bg-bg-secondary/20 space-y-4 flex-1">
                                    <div className="grid grid-cols-2 gap-2">
                                        <StatMini icon={Sword} label="Base ATK" value={battle.BaseDamage} color="red" />
                                        <StatMini icon={Heart} label="Base HP" value={battle.BaseHealth} color="green" />
                                    </div>

                                    {/* Drops Section */}
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Gift size={14} className="text-accent-secondary" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Item Drops</span>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <CompactDropSection 
                                                label="Weapon" 
                                                chance={battle.ChanceToHaveWeapon} 
                                                items={battle.PossibleWeapons} 
                                                autoMapping={autoMapping} 
                                                version={selectedVersion} 
                                            />
                                            <CompactDropSection 
                                                label="Helmet" 
                                                chance={battle.ChanceToHaveHelmet} 
                                                items={battle.PossibleHelmets} 
                                                autoMapping={autoMapping} 
                                                version={selectedVersion} 
                                            />
                                            <CompactDropSection 
                                                label="Armour" 
                                                chance={battle.ChanceToHaveArmour} 
                                                items={battle.PossibleArmours} 
                                                autoMapping={autoMapping} 
                                                version={selectedVersion} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Badge */}
                                <div className="px-4 py-2 bg-bg-input/50 flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-text-muted uppercase">Units: {battle.UnitCount}</span>
                                    {!isUnlocked && (
                                        <span className="font-black text-red-400 uppercase flex items-center gap-1">
                                            <Clock size={10} /> Needs Stage {formatStage(battle.MinLevel)}
                                        </span>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Progression Dashboard */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Current Level Rewards */}
                        <Card className="lg:col-span-2 p-6 bg-gradient-to-br from-bg-card to-bg-secondary border-accent-primary/20">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-accent-primary/10 rounded-2xl">
                                    <Gift className="w-8 h-8 text-accent-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Level {clanPoints} Base Rewards</h2>
                                    <p className="text-xs text-text-secondary">Participants receive these items. Owners receive <span className="text-white font-bold">{baseConfig?.MissionOwnerRewardsCount}x</span> multiplier.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {currentRewards?.Rewards.map((r, idx) => (
                                    <div key={idx} className="bg-bg-primary/50 p-4 rounded-xl border border-border/50 flex flex-col items-center text-center group hover:border-accent-primary/50 transition-all">
                                        <GameIcon name={getRewardIcon(r.Type)} className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
                                        <div className="text-[10px] font-black text-text-muted uppercase mb-1">{r.Type.replace(/([A-Z])/g, ' $1').trim()}</div>
                                        <div className="text-lg font-black text-white">{formatNumber(r.Amount)}</div>
                                    </div>
                                ))}
                                <div className="bg-accent-primary/5 p-4 rounded-xl border border-accent-primary/30 flex flex-col items-center text-center">
                                    <GameIcon name="Hammer" className="w-10 h-10 mb-2" />
                                    <div className="text-[10px] font-black text-accent-primary uppercase mb-1">Shared Hammers</div>
                                    <div className="text-lg font-black text-white">{currentAllMemberReward?.Hammers || 0}</div>
                                </div>
                            </div>
                        </Card>

                        {/* Config Info Card */}
                        <Card className="p-6 space-y-4">
                            <h3 className="text-sm font-black text-text-secondary uppercase tracking-widest border-b border-border pb-3 flex items-center gap-2">
                                <Settings size={14} /> Mission Rules
                            </h3>
                            <div className="space-y-3">
                                <RuleItem label="Daily Energy" value={baseConfig.DailyEnergy} icon={Zap} />
                                <RuleItem label="Max Support" value={baseConfig.MaxSupportMembers} icon={Users} />
                                <RuleItem label="Refresh Cost" value={baseConfig.RefreshGemCost} suffix=" Gems" icon={Star} />
                                <RuleItem label="Battle Timer" value={baseConfig.MissionBattleMatchTimerSeconds} suffix="s" icon={Clock} />
                            </div>
                        </Card>
                    </div>

                    {/* Full Progression Table */}
                    <Card className="overflow-hidden border-border/50">
                        <div className="p-4 border-b border-border bg-bg-secondary/40 flex justify-between items-center">
                             <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp size={14} /> Clan Tier Progression
                            </h3>
                            <span className="text-[10px] text-text-muted font-bold uppercase">Showing 1-60 Points</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-bg-secondary/80">
                                    <tr>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-text-muted">Clan Points</th>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-text-muted">Hammer Thief</th>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-text-muted">Min Stage</th>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-text-muted">Max Stage</th>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">Hammers</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {Object.values(levelLibrary || {}).map(lvl => {
                                        const isCurrent = lvl.Index === clanPoints;
                                        const hammers = allMemberRewardLibrary?.[lvl.Index]?.Hammers || 0;
                                        return (
                                            <tr key={lvl.Index} className={cn(
                                                "hover:bg-white/5 transition-colors",
                                                isCurrent && "bg-accent-primary/10 border-l-4 border-l-accent-primary"
                                            )}>
                                                <td className="px-6 py-3">
                                                    <span className={cn("text-sm font-black", isCurrent ? "text-accent-primary" : "text-white")}>
                                                        {lvl.Index} Pts
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-xs font-mono text-accent-secondary">{formatStage(lvl.MinHammerThiefLevel)}</td>
                                                <td className="px-6 py-3 text-xs font-mono text-white/70">{formatStage(lvl.MinLevel)}</td>
                                                <td className="px-6 py-3 text-xs font-mono text-white font-bold">{formatStage(lvl.MaxLevel)}</td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center justify-center gap-2 bg-accent-primary/5 rounded py-1 px-2 border border-accent-primary/10">
                                                        <HammerIcon size={12} className="text-accent-primary" />
                                                        <span className="text-xs font-black text-white">{hammers}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

function StatMini({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: 'red' | 'green' | 'blue' }) {
    const colors = {
        red: "text-red-400 bg-red-400/5 border-red-400/20",
        green: "text-green-400 bg-green-400/5 border-green-400/20",
        blue: "text-blue-400 bg-blue-400/5 border-blue-400/20"
    };
    return (
        <div className={cn("flex flex-col p-2 rounded-lg border", colors[color])}>
            <div className="flex items-center gap-1 text-[8px] font-black uppercase opacity-70">
                <Icon size={10} /> {label}
            </div>
            <div className="text-sm font-black tracking-tight">{formatNumber(value)}</div>
        </div>
    );
}

function RuleItem({ label, value, suffix = '', icon: Icon }: { label: string, value: any, suffix?: string, icon: any }) {
    return (
        <div className="flex justify-between items-center py-1">
            <div className="flex items-center gap-2 text-text-secondary text-xs font-medium">
                <Icon size={12} className="text-text-muted" />
                {label}
            </div>
            <span className="text-xs font-black text-white">{value}{suffix}</span>
        </div>
    );
}

function CompactDropSection({ label, chance, items, autoMapping, version }: { label: string, chance: number, items: { Item1: number, Item2: number }[] | null, autoMapping: any, version: string | null }) {
    if (!items || items.length === 0) return null;
    
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-text-muted uppercase">{label}</span>
                <span className={cn(
                    "text-[8px] font-black px-1.5 py-0.5 rounded",
                    chance >= 1 ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                )}>
                    {(chance * 100).toFixed(0)}%
                </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {items.slice(0, 4).map((item, i) => {
                    const ageName = AGES[item.Item1] || AGES[0];
                    const iconPath = getItemImage(ageName, label, item.Item2, autoMapping, version);
                    const itemName = getItemName(ageName, label, item.Item2, autoMapping);
                    
                    return (
                        <div key={i} className="group/drop relative w-8 h-8 rounded-lg bg-bg-primary/50 border border-border/50 flex items-center justify-center hover:border-accent-primary transition-colors" title={itemName || ''}>
                            {iconPath ? (
                                <img src={iconPath} alt={itemName || ''} className="w-6 h-6 object-contain pixelated" />
                            ) : (
                                <div className="text-[10px] text-text-muted font-black">?</div>
                            )}
                            {/* Tooltip simple */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-[8px] font-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10">
                                {itemName}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
