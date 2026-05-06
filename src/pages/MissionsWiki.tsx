import { useMemo, useState } from 'react';
import { useGameData } from '../hooks/useGameData';
import { Card } from '../components/UI/Card';
import { GameIcon } from '../components/UI/GameIcon';
import { Target, Trophy, Sword, Settings, Clock, Users, Shield, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

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
    PossibleWeapons: { Item1: number; Item2: number }[];
    PossibleHelmets: { Item1: number; Item2: number }[];
    PossibleArmours: { Item1: number; Item2: number }[];
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
    if (type === 'Coins') return 'Coin';
    if (type === 'SkillSummonTickets') return 'SkillTicket';
    if (type === 'TechPotions') return 'Potion';
    if (type === 'Eggshells') return 'Eggshell';
    if (type === 'Hammers') return 'Hammer';
    if (type === 'ClockWinders') return 'MountKey';
    if (type === 'Gems') return 'GemIcon';
    if (type === 'GuildPotions') return 'GuildPotions';
    return type;
}

function formatStage(lvl: number): string {
    if (lvl <= 0) return 'None';
    const world = Math.floor((lvl - 1) / 10) + 1;
    const stage = ((lvl - 1) % 10) + 1;
    return `${world}-${stage}`;
}

export default function MissionsWiki() {
    const [activeTab, setActiveTab] = useState<'overview' | 'battles' | 'rewards' | 'levels'>('overview');
    
    const { data: battleLibrary } = useGameData<Record<string, MissionBattle>>('MissionBattleLibrary.json');
    const { data: levelLibrary } = useGameData<Record<string, MissionLevel>>('MissionLevelLibrary.json');
    const { data: rewardLibrary } = useGameData<Record<string, MissionReward>>('MissionRewardLibrary.json');
    const { data: allMemberRewardLibrary } = useGameData<Record<string, MissionAllMemberReward>>('MissionAllMemberRewardLibrary.json');
    const { data: baseConfig } = useGameData<MissionBaseConfig>('MissionBaseConfig.json');
    const { data: rallyTimeLibrary } = useGameData<Record<string, MissionRallyTime>>('MissionRallyTimeLibrary.json');

    const loading = !battleLibrary || !levelLibrary || !rewardLibrary || !baseConfig;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted animate-pulse">
                <Target className="w-12 h-12 mb-4 opacity-20" />
                <p>Loading Mission configurations...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20 px-4 sm:px-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-border pb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary p-0.5 shadow-[0_0_30px_rgba(var(--color-accent-primary),0.3)] flex-shrink-0">
                    <div className="w-full h-full bg-bg-primary rounded-[14px] flex items-center justify-center">
                        <Target size={32} className="text-accent-primary" />
                    </div>
                </div>
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-primary bg-[length:200%_auto] animate-gradient-x bg-clip-text text-transparent uppercase tracking-tighter">
                        Mission Wiki
                    </h1>
                    <p className="text-sm font-medium text-text-secondary mt-1 text-left">
                        Complete guide to Guild Missions, Battles, and Rewards.
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap bg-bg-secondary/40 p-1 rounded-xl border border-border w-fit mx-auto sm:mx-0 shadow-lg gap-1">
                <TabButton 
                    active={activeTab === 'overview'} 
                    onClick={() => setActiveTab('overview')} 
                    icon={Settings} 
                    label="Overview" 
                />
                <TabButton 
                    active={activeTab === 'battles'} 
                    onClick={() => setActiveTab('battles')} 
                    icon={() => <GameIcon name="Battle" className="w-3.5 h-3.5" />} 
                    label="Battles" 
                />
                <TabButton 
                    active={activeTab === 'rewards'} 
                    onClick={() => setActiveTab('rewards')} 
                    icon={() => <GameIcon name="Star" className="w-3.5 h-3.5" />} 
                    label="Rewards" 
                />
                <TabButton 
                    active={activeTab === 'levels'} 
                    onClick={() => setActiveTab('levels')} 
                    icon={() => <GameIcon name="Lightning" className="w-3.5 h-3.5" />} 
                    label="Levels" 
                />
            </div>

            {/* Content Sections */}
            <div className="space-y-6">
                {activeTab === 'overview' && baseConfig && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <InfoCard 
                            title="Daily Energy" 
                            value={baseConfig.DailyEnergy} 
                            gameIcon="Lightning" 
                            description="Attempts per day"
                        />
                        <InfoCard 
                            title="Support Members" 
                            value={baseConfig.MaxSupportMembers} 
                            gameIcon="RallyIcon" 
                            description="Max members per mission"
                        />
                        <InfoCard 
                            title="Refresh Cost" 
                            value={baseConfig.RefreshGemCost} 
                            gameIcon="GemSquare" 
                            suffix=" Gems"
                            description="To reset available missions"
                        />
                        <InfoCard 
                            title="Refresh Count" 
                            value={baseConfig.RefreshMissionCount} 
                            gameIcon="Battle" 
                            description="Missions refreshed"
                        />
                        <InfoCard 
                            title="Battle Timer" 
                            value={baseConfig.MissionBattleMatchTimerSeconds} 
                            gameIcon="Timer" 
                            suffix="s"
                            description="Time to complete battle"
                        />
                        <InfoCard 
                            title="Multiplier" 
                            value={baseConfig.HealthAndDamageLevelMultiplier} 
                            gameIcon="Sword" 
                            description="Scaling per mission level"
                        />

                        {rallyTimeLibrary && (
                            <Card className="col-span-1 md:col-span-2 lg:col-span-3 p-6 bg-bg-secondary/20">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <GameIcon name="RallyIcon" className="w-6 h-6" /> Rally Times
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {Object.values(rallyTimeLibrary).map(rally => (
                                        <div key={rally.Id} className="bg-bg-primary/50 p-4 rounded-xl border border-border flex justify-between items-center group hover:border-accent-primary/50 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-text-muted font-bold uppercase text-[10px]">Option {rally.Id + 1}</span>
                                                <span className="text-xl font-black text-white">{rally.TimeInSeconds}s</span>
                                            </div>
                                            <GameIcon name="Timer" className="w-8 h-8 opacity-20 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {activeTab === 'battles' && battleLibrary && (
                    <Card className="overflow-hidden border-border/50">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-bg-secondary/80">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">ID</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Mission Title</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Min Stage</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1">
                                            <GameIcon name="Sword" className="w-3 h-3" /> Base Dmg
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">
                                            <div className="flex items-center gap-1">
                                                <GameIcon name="BronzeShield" className="w-3 h-3" /> Base HP
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Units</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {Object.values(battleLibrary).map(battle => (
                                        <tr key={battle.MissionId} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-sm font-black text-accent-primary">#{battle.MissionId}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-white uppercase">{battle.MissionTitleId.replace(/([A-Z])/g, ' $1').trim()}</td>
                                            <td className="px-6 py-4 text-sm font-mono text-text-secondary">{formatStage(battle.MinLevel)}</td>
                                            <td className="px-6 py-4 text-sm font-mono text-red-400 font-bold">{battle.BaseDamage.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-sm font-mono text-green-400 font-bold">{battle.BaseHealth.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-sm font-mono text-blue-400 font-bold">{battle.UnitCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {activeTab === 'rewards' && rewardLibrary && (
                    <div className="space-y-6">
                        <div className="bg-bg-secondary/20 p-4 rounded-xl border border-border/50 text-xs text-text-secondary flex items-start gap-3 shadow-inner">
                            <GameIcon name="GoldShield" className="w-5 h-5 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-bold text-white uppercase tracking-tight">Mission Ownership Bonus</p>
                                <p>Rewards listed are base values per member. The <span className="text-accent-primary font-bold">Mission Owner</span> receives <span className="text-white font-bold">{baseConfig?.MissionOwnerRewardsCount || 4}x</span> the rewards shown below.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.values(rewardLibrary).map(reward => (
                                <Card key={reward.Level} className="p-5 space-y-4 hover:border-accent-primary/30 transition-colors group">
                                    <div className="flex justify-between items-center border-b border-border/30 pb-3">
                                        <div className="flex items-center gap-2">
                                            <GameIcon name="Star" className="w-5 h-5" />
                                            <span className="text-xl font-black text-white">LEVEL {reward.Level}</span>
                                        </div>
                                        {allMemberRewardLibrary?.[reward.Level] && (
                                            <div className="flex items-center gap-1.5 bg-accent-primary/10 px-2 py-1 rounded-md border border-accent-primary/20">
                                                <GameIcon name="Hammer" className="w-4 h-4" />
                                                <span className="text-xs font-bold text-accent-primary">+{allMemberRewardLibrary[reward.Level].Hammers}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {reward.Rewards.map((r, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-bg-input/50 p-2 rounded-lg border border-border/10">
                                                <div className="flex items-center gap-2">
                                                    <GameIcon name={getRewardIcon(r.Type)} className="w-5 h-5" />
                                                    <span className="text-xs font-medium text-text-secondary">{r.Type.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                </div>
                                                <span className="font-mono font-bold text-white">{r.Amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'levels' && levelLibrary && (
                    <Card className="overflow-hidden border-border/50">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-bg-secondary/80">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Mission Tier</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Min Stage</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Max Stage</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Hammer Thief Min Stage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {Object.values(levelLibrary).map(lvl => (
                                        <tr key={lvl.Index} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-sm font-black text-accent-primary">
                                                <div className="flex items-center gap-2">
                                                    <GameIcon name="Lightning" className="w-4 h-4" />
                                                    Tier {lvl.Index}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-mono text-white">{formatStage(lvl.MinLevel)}</td>
                                            <td className="px-6 py-4 text-sm font-mono text-white">{formatStage(lvl.MaxLevel)}</td>
                                            <td className="px-6 py-4 text-sm font-mono text-accent-secondary font-bold">{formatStage(lvl.MinHammerThiefLevel)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300",
                active
                    ? "bg-accent-primary text-black shadow-lg"
                    : "text-text-muted hover:text-text-primary hover:bg-white/5"
            )}
        >
            <Icon size={14} className={active ? "text-black" : "text-accent-primary"} />
            {label}
        </button>
    );
}

function InfoCard({ title, value, icon: Icon, gameIcon, description, suffix = '' }: { title: string, value: any, icon?: any, gameIcon?: string, description: string, suffix?: string }) {
    return (
        <Card className="p-5 space-y-1 bg-bg-secondary/20 border-border/30 group hover:border-accent-primary/30 transition-colors">
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{title}</span>
                {gameIcon ? (
                    <GameIcon name={gameIcon} className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                ) : Icon ? (
                    <Icon size={16} className="text-accent-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                ) : null}
            </div>
            <div className="text-2xl font-black text-white">
                {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value}{suffix}
            </div>
            <p className="text-[10px] text-text-secondary font-medium leading-tight">
                {description}
            </p>
        </Card>
    );
}

function DropChance({ label, chance }: { label: string, chance: number }) {
    return (
        <div className="flex items-center gap-2 bg-bg-input px-2 py-1 rounded border border-border/20">
            <span className="text-[9px] font-bold text-text-muted uppercase">{label}</span>
            <span className={cn(
                "text-xs font-mono font-bold",
                chance >= 1 ? "text-green-400" : chance > 0 ? "text-yellow-400" : "text-red-400"
            )}>
                {(chance * 100).toFixed(0)}%
            </span>
        </div>
    );
}
