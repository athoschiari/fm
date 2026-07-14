import { useState, useMemo } from 'react';
import { useGameData } from '../../hooks/useGameData';
import { useTreeModifiers, useClanNodeMax } from '../../hooks/useCalculatedStats';
import { SandboxPanel } from '../../components/UI/SandboxPanel';
import { SpriteIcon } from '../../components/UI/SpriteIcon';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import { Trophy, Swords } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CurrencyReward { Amount: number; Type: string; $type: string; }
interface TierConfig {
    Tier: string;
    RequiredPoints: number;
    WarWonRewards: CurrencyReward[];
    WarLostRewards: CurrencyReward[];
    TierPointsOnWin?: number;
    TierPointsOnLose?: number;
}

// Best-effort currency -> sprite icon; unknown ones fall back to a text chip.
const CURRENCY_ICON: Record<string, string> = {
    Hammers: 'Hammer',
    SkillSummonTickets: 'SkillTicket',
    Eggshells: 'Eggshell',
    TechPotions: 'Potion',
    ClockWinders: 'MountKey',
    GuildPotions: 'GuildPotions',
    Gems: 'GemSquare',
    Coins: 'Coin',
};

export default function WarPrizesCalculator() {
    const { data: tierConfig } = useGameData<Record<string, TierConfig>>('GuildTierConfig.json');

    // Clan tech tree reward multipliers (already effective, see useGameData).
    const treeModifiers = useTreeModifiers();
    const clanMax = useClanNodeMax();
    const profileWin = treeModifiers['ClanWarWinRewards'] || 0;
    const profileLose = treeModifiers['ClanWarLoseRewards'] || 0;
    const profilePotionsWin = treeModifiers['GuildPotionsFromClanWarWin'] || 0;
    const profilePotionsLose = treeModifiers['GuildPotionsFromClanWarLose'] || 0;

    // Sandbox overrides
    const [sandbox, setSandbox] = useState<Record<string, number>>({});
    const winBonus = sandbox.win ?? profileWin;
    const loseBonus = sandbox.lose ?? profileLose;
    const potionsWinBonus = sandbox.potWin ?? profilePotionsWin;
    const potionsLoseBonus = sandbox.potLose ?? profilePotionsLose;

    const sandboxControls = {
        reset: () => setSandbox({}),
        fields: [
            { key: 'win', label: 'Win war rewards', value: winBonus, profileValue: profileWin, min: 0, max: clanMax['ClanWarWinRewards'] || 0.1, step: 0.005, onChange: (v: number) => setSandbox(p => ({ ...p, win: v })) },
            { key: 'lose', label: 'Lost war rewards', value: loseBonus, profileValue: profileLose, min: 0, max: clanMax['ClanWarLoseRewards'] || 0.1, step: 0.005, onChange: (v: number) => setSandbox(p => ({ ...p, lose: v })) },
            { key: 'potWin', label: 'Guild potions (win)', value: potionsWinBonus, profileValue: profilePotionsWin, min: 0, max: clanMax['GuildPotionsFromClanWarWin'] || 1, step: 0.01, onChange: (v: number) => setSandbox(p => ({ ...p, potWin: v })) },
            { key: 'potLose', label: 'Guild potions (lose)', value: potionsLoseBonus, profileValue: profilePotionsLose, min: 0, max: clanMax['GuildPotionsFromClanWarLose'] || 1, step: 0.01, onChange: (v: number) => setSandbox(p => ({ ...p, potLose: v })) },
        ],
    };

    const tiers = useMemo(() => (tierConfig ? Object.values(tierConfig).sort((a, b) => a.RequiredPoints - b.RequiredPoints) : []), [tierConfig]);
    const [tierIdx, setTierIdx] = useState(0);
    const tier = tiers[tierIdx];

    // Apply the multipliers; GuildPotions get an extra win/lose-specific boost.
    const applyBonus = (rewards: CurrencyReward[], baseBonus: number, potionBonus: number) =>
        (rewards || []).map(r => {
            const extra = r.Type === 'GuildPotions' ? potionBonus : 0;
            return { ...r, boosted: r.Amount * (1 + baseBonus + extra) };
        });

    const wonRewards = tier ? applyBonus(tier.WarWonRewards, winBonus, potionsWinBonus) : [];
    const lostRewards = tier ? applyBonus(tier.WarLostRewards, loseBonus, potionsLoseBonus) : [];

    const RewardRow = ({ type, base, boosted }: { type: string; base: number; boosted: number }) => {
        const icon = CURRENCY_ICON[type];
        const changed = Math.abs(boosted - base) > 0.5;
        return (
            <div className="flex items-center justify-between gap-3 py-1.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                    {icon ? <SpriteIcon name={icon} size={22} /> : <span className="w-[22px]" />}
                    <span className="text-xs text-text-secondary truncate">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                    {changed && <span className="text-[10px] text-text-muted line-through">{Math.round(base).toLocaleString()}</span>}
                    <span className={cn('font-bold', changed ? 'text-purple-300' : 'text-white')}>{Math.round(boosted).toLocaleString()}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20 max-w-5xl mx-auto">
            <div className="text-center space-y-2 mb-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent inline-flex items-center gap-3">
                    <Trophy size={32} className="text-accent-primary" />
                    War Prizes Calculator
                </h1>
                <p className="text-text-secondary">Guild War win/lose rewards per tier, boosted by your clan tech tree.</p>
            </div>

            <SandboxPanel fields={sandboxControls.fields} onReset={sandboxControls.reset} />

            {/* Guild tier selector */}
            <Card className="p-4">
                <div className="flex items-center gap-2 flex-wrap justify-center">
                    <span className="text-xs text-text-muted uppercase font-bold mr-2">Guild Tier</span>
                    {tiers.map((t, i) => (
                        <button
                            key={t.Tier}
                            onClick={() => setTierIdx(i)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
                                i === tierIdx ? 'bg-accent-primary text-black border-accent-primary' : 'text-text-muted border-white/10 hover:border-white/30'
                            )}
                        >
                            {t.Tier}
                        </button>
                    ))}
                </div>
            </Card>

            {tier && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6 border-emerald-500/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-emerald-300">
                                <Trophy size={18} /> War Won
                                {winBonus > 0 && <span className="text-[11px] font-mono text-purple-300">+{(winBonus * 100).toFixed(1)}%</span>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {wonRewards.map(r => <RewardRow key={r.Type} type={r.Type} base={r.Amount} boosted={r.boosted} />)}
                            {tier.TierPointsOnWin != null && <div className="text-[11px] text-text-muted mt-3">+{tier.TierPointsOnWin} guild tier points</div>}
                        </CardContent>
                    </Card>

                    <Card className="p-6 border-red-500/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-300">
                                <Swords size={18} /> War Lost
                                {loseBonus > 0 && <span className="text-[11px] font-mono text-purple-300">+{(loseBonus * 100).toFixed(1)}%</span>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {lostRewards.map(r => <RewardRow key={r.Type} type={r.Type} base={r.Amount} boosted={r.boosted} />)}
                            {tier.TierPointsOnLose != null && <div className="text-[11px] text-text-muted mt-3">+{tier.TierPointsOnLose} guild tier points</div>}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
