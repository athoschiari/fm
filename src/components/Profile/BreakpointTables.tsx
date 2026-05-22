import { memo, useState } from 'react';
import { useGameData } from '../../hooks/useGameData';

interface BreakpointTablesProps {
    weaponAttackDuration: number;
    weaponWindupTime: number;
    currentAttackSpeedMultiplier: number; // e.g. 1.5
    realCycleTime?: number;
    realWindup?: number;
    doubleDamageChance?: number; // e.g. 0.25 (25%)
}

interface BreakpointMilestone {
    reqBonus: number;
    type: 'primary_cycle' | 'windup' | 'double_delay' | 'double_cycle';
    targetValue: number;
    label: string;
    details: string;
}

export const BreakpointTables = memo(({
    weaponAttackDuration,
    weaponWindupTime,
    currentAttackSpeedMultiplier,
    realCycleTime: providedRealCycleTime,
    realWindup: providedRealWindup,
    doubleDamageChance
}: BreakpointTablesProps) => {
    const [showDetailedTables, setShowDetailedTables] = useState(false);
    const { data: secondaryStatLibrary } = useGameData<any>('SecondaryStatLibrary.json');
    
    const maxAttackSpeedSubstat = secondaryStatLibrary?.AttackSpeed?.UpperRange || 0.4;
    const maxPossibleSpeedBonus = (maxAttackSpeedSubstat * 12 * 100) + 0.1;

    const currentBonus = (currentAttackSpeedMultiplier - 1) * 100;

    // Calculate current real-time values if not provided
    const realCycleTime = providedRealCycleTime !== undefined ? providedRealCycleTime : (() => {
        const steppedW = Math.floor((weaponWindupTime / currentAttackSpeedMultiplier) * 10) / 10;
        const steppedR = Math.floor((Math.max(0, weaponAttackDuration - weaponWindupTime) / currentAttackSpeedMultiplier) * 10) / 10;
        return Math.max(0.4, steppedW + steppedR + 0.2);
    })();

    const realWindup = providedRealWindup !== undefined ? providedRealWindup : (Math.floor((weaponWindupTime / currentAttackSpeedMultiplier) * 10) / 10);

    const baseW = weaponWindupTime || 0.5;
    const baseR = Math.max(0, weaponAttackDuration - baseW);
    const baseD = baseW * 0.25;

    // Current Double Hit Delay
    const currentDDelay = Math.max(0.1, Math.ceil((baseD / currentAttackSpeedMultiplier) * 10) / 10);
    const currentDoubleCycle = realCycleTime + currentDDelay;

    // Gather all milestones from all 4 categories
    const milestones: BreakpointMilestone[] = [];

    // 1. Primary Cycle Breakpoints
    const primaryTargets = [2.5, 2.4, 2.3, 2.2, 2.1, 2.0, 1.9, 1.8, 1.7, 1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3];
    primaryTargets.filter(t => t <= weaponAttackDuration + 0.201).forEach(target => {
        const targetPhases = target - 0.2;
        let low = 1.0, high = 15.0;
        for (let i = 0; i < 20; i++) {
            const mid = (low + high) / 2;
            const sum = Math.floor((baseW / mid) * 10) / 10 + Math.floor((baseR / mid) * 10) / 10;
            if (sum <= targetPhases + 0.001) high = mid;
            else low = mid;
        }
        const reqBonus = (high - 1) * 100;
        if (reqBonus <= maxPossibleSpeedBonus) {
            milestones.push({
                reqBonus,
                type: 'primary_cycle',
                targetValue: target,
                label: `Primary Cycle → ${target.toFixed(1)}s`,
                details: `Anim phases: ${targetPhases.toFixed(1)}s (+0.2s post-atk)`
            });
        }
    });

    // 2. Rhythmic Windup Steps
    const windupTargets = [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0];
    windupTargets.filter(t => t <= weaponWindupTime + 0.001).forEach(target => {
        let low = 1.0, high = 15.0;
        for (let i = 0; i < 20; i++) {
            const mid = (low + high) / 2;
            const stepped = Math.floor((baseW / mid) * 10) / 10;
            if (stepped <= target + 0.001) high = mid;
            else low = mid;
        }
        const reqBonus = (high - 1) * 100;
        if (reqBonus <= maxPossibleSpeedBonus) {
            milestones.push({
                reqBonus,
                type: 'windup',
                targetValue: target,
                label: `Windup Step → ${target.toFixed(1)}s`,
                details: target === 0.3 ? `Optimal fluidness (Meta bracket)` : `Windup phase`
            });
        }
    });

    // 3. Double Hit Delay Steps
    const delayTargets = [0.3, 0.2, 0.1, 0.0];
    delayTargets.filter(t => t <= baseD + 0.09).forEach(target => {
        let reqBonus = 0;
        if (target === 0.0) {
            reqBonus = Math.max(0, (20 * baseD - 1) * 100);
        } else {
            let low = 1.0, high = 15.0;
            for (let i = 0; i < 25; i++) {
                const mid = (low + high) / 2;
                const delay = Math.max(0.1, Math.ceil((baseD / mid) * 10) / 10);
                if (delay <= target + 0.001) high = mid;
                else low = mid;
            }
            reqBonus = (high - 1) * 100;
        }
        if (reqBonus <= maxPossibleSpeedBonus) {
            milestones.push({
                reqBonus,
                type: 'double_delay',
                targetValue: target,
                label: `Double Hit Delay → ${target.toFixed(1)}s`,
                details: target === 0.0 ? `Instant double attack (Unconfirmed)` : `Sequential pause`
            });
        }
    });

    // 4. Double Attack Cycle Breakpoints
    const doubleCycleTargets = [3.0, 2.9, 2.8, 2.7, 2.6, 2.5, 2.4, 2.3, 2.2, 2.1, 2.0, 1.9, 1.8, 1.7, 1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4];
    doubleCycleTargets.filter(t => t <= weaponAttackDuration + 0.5).forEach(target => {
        const targetPhases = target - 0.2;
        let low = 1.0, high = 15.0;
        for (let i = 0; i < 25; i++) {
            const mid = (low + high) / 2;
            const sum = Math.floor((baseW / mid) * 10) / 10 +
                Math.floor((baseR / mid) * 10) / 10 +
                Math.max(0.1, Math.ceil((baseD / mid) * 10) / 10);
            if (sum <= targetPhases + 0.001) high = mid;
            else low = mid;
        }
        const reqBonus = (high - 1) * 100;
        if (reqBonus <= maxPossibleSpeedBonus) {
            milestones.push({
                reqBonus,
                type: 'double_cycle',
                targetValue: target,
                label: `Double Cycle → ${target.toFixed(1)}s`,
                details: `Primary cycle + double delay`
            });
        }
    });

    // Group milestones by reqBonus (rounded to 1 decimal place to handle floating points)
    const groupedMap = new Map<string, BreakpointMilestone[]>();
    milestones.forEach(m => {
        const key = m.reqBonus.toFixed(1);
        if (!groupedMap.has(key)) {
            groupedMap.set(key, []);
        }
        groupedMap.get(key)!.push(m);
    });

    // Convert grouped map to sorted array
    const groupedMilestones = Array.from(groupedMap.entries())
        .map(([reqBonusStr, items]) => ({
            reqBonus: parseFloat(reqBonusStr),
            items
        }))
        .sort((a, b) => a.reqBonus - b.reqBonus);

    // Identify the "Next" threshold
    let foundNext = false;
    const finalGrouped = groupedMilestones.map(group => {
        const isReached = currentBonus >= group.reqBonus - 0.01;
        let isNext = false;
        if (!isReached && !foundNext) {
            isNext = true;
            foundNext = true;
        }
        return {
            ...group,
            isReached,
            isNext
        };
    });

    // Sub-table impossibility trackers
    let renderedImpossiblePrimary = false;
    let renderedImpossibleWindup = false;
    let renderedImpossibleDoubleDelay = false;
    let renderedImpossibleDouble = false;

    return (
        <div className="space-y-8">
            {/* 60 FPS Engine Disclaimer Header */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    60 FPS Engine Discretization Rules
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                    The game updates and triggers combat actions in discrete steps of <strong>0.1 seconds</strong> (exactly <strong>6 frames</strong> at 60 FPS). 
                    As a result, your Attack Speed bonus only improves actual DPS when it provides enough speed multiplier to push your animation phase durations down past a 0.1s threshold. 
                    Any extra attack speed between these steps is mathematically "wasted" (does not affect combat frequency).
                </p>
                {doubleDamageChance !== undefined && doubleDamageChance < 0.3 && (
                    <p className="text-[10px] text-amber-400/80 bg-amber-500/5 border border-amber-500/10 p-2 rounded leading-relaxed mt-1">
                        <strong>Note:</strong> You have a relatively low Double Attack chance (<strong>{Math.round(doubleDamageChance * 100)}%</strong>). 
                        The breakpoints marked with a dashed purple left border (Double Hit Delay and Double Cycle) are only relevant when Double Damage procs. 
                        Focus on Primary Cycle and Windup targets first.
                    </p>
                )}
            </div>

            {/* Unified Timeline Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-wide">Unified Breakpoint Timeline</h3>
                        <p className="text-[10px] text-white/40">Chronological attack speed targets and what they unlock (calculated up to max gear limits of +{(maxPossibleSpeedBonus - 0.1).toFixed(0)}%)</p>
                    </div>
                    <button 
                        onClick={() => setShowDetailedTables(!showDetailedTables)}
                        className="px-3 py-1.5 rounded-lg border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 text-[10px] uppercase font-bold text-purple-300 transition-all active:scale-95 animate-pulse"
                    >
                        {showDetailedTables ? 'Hide Details' : 'Show Detailed Phase Tables'}
                    </button>
                </div>

                <div className="overflow-x-auto custom-scrollbar border border-white/5 rounded-lg bg-black/25">
                    <table className="w-full text-left font-mono text-[10px] md:text-xs">
                        <thead>
                            <tr className="text-white/30 uppercase text-[9px] border-b border-white/5">
                                <th className="p-3 font-sans font-bold w-[120px]">Req. Speed</th>
                                <th className="p-3 font-sans font-bold">Unlocked Milestones</th>
                                <th className="p-3 font-sans font-bold text-right w-[100px]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {finalGrouped.map(({ reqBonus, items, isReached, isNext }) => {
                                const hasDouble = items.some(item => item.type === 'double_delay' || item.type === 'double_cycle');
                                const isOnlyDouble = items.every(item => item.type === 'double_delay' || item.type === 'double_cycle');

                                let rowStyle = `group transition-colors ${
                                    isReached 
                                        ? 'text-green-400/80 hover:bg-green-500/[0.02]' 
                                        : isNext 
                                            ? 'text-purple-400 bg-purple-400/5 hover:bg-purple-400/[0.08]' 
                                            : 'text-white/40 hover:bg-white/[0.01]'
                                }`;

                                if (hasDouble) {
                                    rowStyle += ' border-l-2 border-dashed border-l-purple-500/40 bg-purple-950/[0.03]';
                                }

                                return (
                                    <tr key={reqBonus} className={rowStyle}>
                                        <td className="p-3 font-bold align-top">
                                            +{reqBonus.toFixed(1)}%
                                        </td>
                                        <td className="p-3 space-y-1.5">
                                            {items.map((item, idx) => {
                                                let badgeColor = 'text-white/60 bg-white/5';
                                                if (item.type === 'primary_cycle') badgeColor = 'text-orange-400 bg-orange-400/10 border border-orange-400/20';
                                                if (item.type === 'windup') badgeColor = 'text-blue-400 bg-blue-400/10 border border-blue-400/20';
                                                if (item.type === 'double_delay') badgeColor = 'text-purple-400 bg-purple-400/10 border border-purple-400/20';
                                                if (item.type === 'double_cycle') badgeColor = 'text-fuchsia-400 bg-fuchsia-400/10 border border-fuchsia-400/20';

                                                const isDoubleItem = item.type === 'double_delay' || item.type === 'double_cycle';
                                                const doublePct = doubleDamageChance !== undefined ? Math.round(doubleDamageChance * 100) : null;

                                                return (
                                                    <div key={idx} className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-3">
                                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] uppercase font-sans font-bold ${badgeColor}`}>
                                                            {item.label}
                                                        </span>
                                                        <span className="text-[9px] text-white/40 font-sans italic">
                                                            {item.details}
                                                        </span>
                                                        {isDoubleItem && (() => {
                                                            let doubleImpactText = 'Double Attack';
                                                            let doubleImpactStyle = 'text-purple-400/60 bg-purple-400/5';

                                                            if (doublePct !== null) {
                                                                if (doublePct < 15) {
                                                                    doubleImpactText = `Low Impact (Double Chance: ${doublePct}%)`;
                                                                    doubleImpactStyle = 'text-white/40 bg-white/5 border border-white/10';
                                                                } else if (doublePct < 45) {
                                                                    doubleImpactText = `Medium Impact (Double Chance: ${doublePct}%)`;
                                                                    doubleImpactStyle = 'text-blue-400 bg-blue-400/10 border border-blue-400/20';
                                                                } else if (doublePct < 75) {
                                                                    doubleImpactText = `High Impact (Double Chance: ${doublePct}%)`;
                                                                    doubleImpactStyle = 'text-purple-400 bg-purple-400/10 border border-purple-400/20';
                                                                } else {
                                                                    doubleImpactText = `Very High Impact (Double Chance: ${doublePct}%)`;
                                                                    doubleImpactStyle = 'text-green-400 bg-green-400/10 border border-green-400/20';
                                                                }
                                                            }

                                                            return (
                                                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-sans font-medium uppercase tracking-wide inline-block ${doubleImpactStyle}`}>
                                                                    {doubleImpactText}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                );
                                            })}
                                        </td>
                                        <td className="p-3 text-right font-bold text-[9px] align-top">
                                            {isReached ? (
                                                <span className="text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded uppercase font-sans">Reached</span>
                                            ) : isNext ? (
                                                <div className="space-y-0.5">
                                                    <span className="text-purple-400 bg-purple-400/20 px-1.5 py-0.5 rounded uppercase font-sans animate-pulse">Next</span>
                                                    <div className="text-[8px] text-purple-400/60 font-sans italic">+{((reqBonus - currentBonus)).toFixed(1)}% more</div>
                                                </div>
                                            ) : (
                                                <span className="text-white/20 bg-white/5 px-1.5 py-0.5 rounded uppercase font-sans">Locked</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detailed Phase Tables Grid (Expandable) */}
            {showDetailedTables && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-white/10 pt-8 animate-fadeIn">
                    {/* Primary Cycle Table */}
                    <div className="space-y-4">
                        <div className="text-[9px] uppercase text-orange-400/60 font-bold tracking-wider">Primary Weapon Cycle</div>
                        <div className="overflow-x-auto custom-scrollbar border border-white/5 rounded-lg bg-black/25">
                            <table className="w-full text-left font-mono text-[10px] md:text-xs">
                                <thead>
                                    <tr className="text-white/30 uppercase text-[9px] border-b border-white/5">
                                        <th className="p-2.5 font-sans font-bold">Target Cycle</th>
                                        <th className="p-2.5 font-sans font-bold">Req. Speed</th>
                                        <th className="p-2.5 font-sans font-bold text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {[2.5, 2.4, 2.3, 2.2, 2.1, 2.0, 1.9, 1.8, 1.7, 1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3]
                                        .filter(target => target <= weaponAttackDuration + 0.201)
                                        .map(target => {
                                            let reqBonus = 0;
                                            const targetPhases = target - 0.2;

                                            let low = 1.0, high = 15.0;
                                            for (let i = 0; i < 20; i++) {
                                                const mid = (low + high) / 2;
                                                const sum = Math.floor((baseW / mid) * 10) / 10 + Math.floor((baseR / mid) * 10) / 10;
                                                if (sum <= targetPhases + 0.001) high = mid;
                                                else low = mid;
                                            }
                                            reqBonus = (high - 1) * 100;
                                            
                                            const isImpossible = reqBonus > maxPossibleSpeedBonus;
                                            if (isImpossible) {
                                                if (renderedImpossiblePrimary) return null;
                                                renderedImpossiblePrimary = true;
                                            }

                                            const isReached = currentBonus >= reqBonus - 0.01;
                                            const isNext = !isReached && !isImpossible && (target >= realCycleTime - 0.11);

                                            return (
                                                <tr key={target} className={`group ${isReached ? 'text-green-400/80' : isImpossible ? 'text-red-500/40' : isNext ? 'text-orange-400 bg-orange-400/5' : 'text-white/40'}`}>
                                                    <td className="p-2.5 font-bold">
                                                        {target.toFixed(1)}s
                                                        {Math.abs(target - realCycleTime) < 0.01 && <span className="text-[8px] bg-orange-500/20 px-1 rounded uppercase font-sans text-orange-400 ml-1">Current</span>}
                                                    </td>
                                                    <td className="p-2.5">+{reqBonus.toFixed(1)}%</td>
                                                    <td className="p-2.5 text-right font-bold text-[9px]">
                                                        {isReached ? 'REACHED' : isImpossible ? 'IMPOSSIBLE' : `+${(reqBonus - currentBonus).toFixed(1)}%`}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Rhythmic Windup Table */}
                    <div className="space-y-4">
                        <div className="text-[9px] uppercase text-blue-400/60 font-bold tracking-wider">Rhythmic Windup Steps</div>
                        <div className="overflow-x-auto custom-scrollbar border border-white/5 rounded-lg bg-black/25">
                            <table className="w-full text-left font-mono text-[10px] md:text-xs">
                                <thead>
                                    <tr className="text-white/30 uppercase text-[9px] border-b border-white/5">
                                        <th className="p-2.5 font-sans font-bold">Windup Step</th>
                                        <th className="p-2.5 font-sans font-bold">Req. Speed</th>
                                        <th className="p-2.5 font-sans font-bold text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {[0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0]
                                        .filter(target => target <= weaponWindupTime + 0.001)
                                        .map(target => {
                                            let reqBonus = 0;
                                            let low = 1.0, high = 15.0;
                                            for (let i = 0; i < 20; i++) {
                                                const mid = (low + high) / 2;
                                                const stepped = Math.floor((baseW / mid) * 10) / 10;
                                                if (stepped <= target + 0.001) high = mid;
                                                else low = mid;
                                            }
                                            reqBonus = (high - 1) * 100;
                                            
                                            const isImpossible = reqBonus > maxPossibleSpeedBonus;
                                            if (isImpossible) {
                                                if (renderedImpossibleWindup) return null;
                                                renderedImpossibleWindup = true;
                                            }

                                            const isReached = currentBonus >= reqBonus - 0.01;
                                            const isNext = !isReached && !isImpossible && (target >= realWindup - 0.11);

                                            return (
                                                <tr key={target} className={`group ${isReached ? 'text-green-400/80' : isImpossible ? 'text-red-500/40' : isNext ? 'text-orange-400 bg-orange-400/5' : 'text-white/40'}`}>
                                                    <td className="p-2.5 font-bold">
                                                        {target.toFixed(1)}s
                                                        {Math.abs(target - realWindup) < 0.01 && <span className="text-[8px] bg-orange-500/20 px-1 rounded uppercase font-sans text-orange-400 ml-1">Current</span>}
                                                        {target === 0.3 && <span className="ml-1 text-[7px] text-blue-400 font-sans uppercase">Meta</span>}
                                                        {target === 0.0 && <span className="ml-1 text-[7px] text-orange-400/80 font-sans uppercase font-bold border border-orange-400/20 px-1 rounded">Math correct, needs testing</span>}
                                                    </td>
                                                    <td className="p-2.5">+{reqBonus.toFixed(1)}%</td>
                                                    <td className="p-2.5 text-right font-bold text-[9px]">
                                                        {isReached ? 'REACHED' : isImpossible ? 'IMPOSSIBLE' : `+${(reqBonus - currentBonus).toFixed(1)}%`}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Double Hit Delay Steps Table */}
                    <div className="space-y-4">
                        <div className="text-[9px] uppercase text-purple-400/60 font-bold tracking-wider">Double Hit Delay Steps</div>
                        <div className="overflow-x-auto custom-scrollbar border border-white/5 rounded-lg bg-black/25">
                            <table className="w-full text-left font-mono text-[10px] md:text-xs">
                                <thead>
                                    <tr className="text-white/30 uppercase text-[9px] border-b border-white/5">
                                        <th className="p-2.5 font-sans font-bold">Delay Step</th>
                                        <th className="p-2.5 font-sans font-bold">Req. Speed</th>
                                        <th className="p-2.5 font-sans font-bold text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {[0.3, 0.2, 0.1, 0.0]
                                        .filter(target => target <= baseD + 0.09)
                                        .map(target => {
                                            let reqBonus = 0;
                                            
                                            if (target === 0.0) {
                                                reqBonus = Math.max(0, (20 * baseD - 1) * 100);
                                            } else {
                                                let low = 1.0, high = 15.0;
                                                for (let i = 0; i < 25; i++) {
                                                    const mid = (low + high) / 2;
                                                    const delay = Math.max(0.1, Math.ceil((baseD / mid) * 10) / 10);
                                                    if (delay <= target + 0.001) high = mid;
                                                    else low = mid;
                                                }
                                                reqBonus = (high - 1) * 100;
                                            }
                                            
                                            const isImpossible = reqBonus > maxPossibleSpeedBonus;
                                            if (isImpossible) {
                                                if (renderedImpossibleDoubleDelay) return null;
                                                renderedImpossibleDoubleDelay = true;
                                            }

                                            const isReached = currentBonus >= reqBonus - 0.01;
                                            const isNext = !isReached && !isImpossible && (target >= currentDDelay - 0.11);

                                            return (
                                                <tr key={target} className={`group ${isReached ? 'text-green-400/80' : isImpossible ? 'text-red-500/40' : isNext ? 'text-purple-400 bg-purple-400/5' : 'text-white/40'}`}>
                                                    <td className="p-2.5 font-bold">
                                                        {target.toFixed(1)}s
                                                        {Math.abs(target - currentDDelay) < 0.01 && <span className="text-[8px] bg-purple-500/20 px-1 rounded uppercase font-sans text-purple-400 ml-1">Current</span>}
                                                        {target === 0.0 && <span className="ml-1 text-[7px] text-purple-400/80 font-sans uppercase font-bold border border-purple-400/20 px-1 rounded">Unconfirmed</span>}
                                                    </td>
                                                    <td className="p-2.5">+{reqBonus.toFixed(1)}%</td>
                                                    <td className="p-2.5 text-right font-bold text-[9px]">
                                                        {isReached ? 'REACHED' : isImpossible ? 'IMPOSSIBLE' : `+${(reqBonus - currentBonus).toFixed(1)}%`}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Double Attack Cycle Table */}
                    <div className="space-y-4">
                        <div className="text-[9px] uppercase text-purple-400/60 font-bold tracking-wider">Double Attack Cycle Breakpoints</div>
                        <div className="overflow-x-auto custom-scrollbar border border-white/5 rounded-lg bg-black/25">
                            <table className="w-full text-left font-mono text-[10px] md:text-xs">
                                <thead>
                                    <tr className="text-white/30 uppercase text-[9px] border-b border-white/5">
                                        <th className="p-2.5 font-sans font-bold">Target Cycle</th>
                                        <th className="p-2.5 font-sans font-bold">Req. Speed</th>
                                        <th className="p-2.5 font-sans font-bold text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {[3.0, 2.9, 2.8, 2.7, 2.6, 2.5, 2.4, 2.3, 2.2, 2.1, 2.0, 1.9, 1.8, 1.7, 1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4]
                                        .filter(target => target <= weaponAttackDuration + 0.5)
                                        .map(target => {
                                            let reqBonus = 0;
                                            const targetPhases = target - 0.2;

                                            let low = 1.0, high = 15.0;
                                            for (let i = 0; i < 25; i++) {
                                                const mid = (low + high) / 2;
                                                const sum = Math.floor((baseW / mid) * 10) / 10 +
                                                    Math.floor((baseR / mid) * 10) / 10 +
                                                    Math.max(0.1, Math.ceil((baseD / mid) * 10) / 10);
                                                if (sum <= targetPhases + 0.001) high = mid;
                                                else low = mid;
                                            }
                                            reqBonus = (high - 1) * 100;
                                            
                                            const isImpossible = reqBonus > maxPossibleSpeedBonus;
                                            if (isImpossible) {
                                                if (renderedImpossibleDouble) return null;
                                                renderedImpossibleDouble = true;
                                            }

                                            const isReached = currentBonus >= reqBonus - 0.01;
                                            const isNext = !isReached && !isImpossible && (target >= currentDoubleCycle - 0.11);

                                            return (
                                                <tr key={target} className={`group ${isReached ? 'text-green-400/80' : isImpossible ? 'text-red-500/40' : isNext ? 'text-purple-400 bg-purple-400/5' : 'text-white/40'}`}>
                                                    <td className="p-2.5 font-bold">
                                                        {target.toFixed(1)}s
                                                        {Math.abs(target - currentDoubleCycle) < 0.01 && <span className="text-[8px] bg-purple-500/20 px-1 rounded uppercase font-sans text-purple-400 ml-1">Current</span>}
                                                    </td>
                                                    <td className="p-2.5">+{reqBonus.toFixed(1)}%</td>
                                                    <td className="p-2.5 text-right font-bold text-[9px]">
                                                        {isReached ? 'REACHED' : isImpossible ? 'IMPOSSIBLE' : `+${(reqBonus - currentBonus).toFixed(1)}%`}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Explanation Section */}
            <BreakpointExplanation />
        </div>
    );
});

export const BreakpointExplanation = memo(() => (
    <div className="mt-8 space-y-4 text-[11px] text-white/50 leading-relaxed border-t border-white/10 pt-6 font-sans">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Metric Descriptions & Formulas</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div>
                    <span className="text-orange-400 font-bold uppercase block mb-0.5 text-[10px]">Primary Weapon Cycle</span>
                    <span className="font-mono text-[9px] bg-white/5 px-1 py-0.5 rounded text-orange-300 block w-fit mb-1 font-bold">
                        steppedCycle = Math.floor(Windup / speedMult * 10)/10 + Math.floor(Recovery / speedMult * 10)/10 + 0.2
                    </span>
                    The total frequency of normal attacks. Windup and Recovery scale down independently and are rounded down to the nearest 0.1s step (6 frames). 
                    A fixed 0.2s post-attack interval is added.
                </div>
                <div>
                    <span className="text-blue-400 font-bold uppercase block mb-0.5 text-[10px]">Rhythmic Windup Steps</span>
                    <span className="font-mono text-[9px] bg-white/5 px-1 py-0.5 rounded text-blue-300 block w-fit mb-1 font-bold">
                        steppedWindup = Math.floor((Windup / speedMult) * 10) / 10
                    </span>
                    Dictates animation startup time. Dropping windup speed reduces character lock during attacks. The <strong>0.3s Meta bracket</strong> is the golden standard for weapon responsiveness.
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <span className="text-purple-400 font-bold uppercase block mb-0.5 text-[10px]">Double Hit Delay Steps</span>
                    <span className="font-mono text-[9px] bg-white/5 px-1 py-0.5 rounded text-purple-300 block w-fit mb-1 font-bold">
                        steppedDelay = Math.max(0.1, Math.ceil(((Windup * 0.25) / speedMult) * 10) / 10)
                    </span>
                    The delay before firing the second attack when Double Damage procs. Because double attacks replay the windup animation at 4x speed, the base delay is exactly 25% of windup time. 
                    Unlike other phases, this uses <strong>Math.ceil</strong> rounding to model how expiration timers function in a discrete tick system. Capped at a minimum of 0.1s.
                </div>
                <div>
                    <span className="text-fuchsia-400 font-bold uppercase block mb-0.5 text-[10px]">Double Attack Cycle</span>
                    <span className="font-mono text-[9px] bg-white/5 px-1 py-0.5 rounded text-fuchsia-300 block w-fit mb-1 font-bold">
                        DoubleCycle = steppedCycle + steppedDelay
                    </span>
                    The total duration of a complete sequence when a Double Attack triggers. Useful for optimizing total sustained DPS.
                </div>
            </div>
        </div>
    </div>
));
