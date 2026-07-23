/**
 * Substat Optimizer
 * The exact allocation search the Substats Calculator's "Maximize" buttons run, extracted
 * so the profile Comparison panel can reuse the identical calculation. A lookahead greedy
 * ascent seeds a random-restart local search over substat point allocations, scoring each
 * candidate through the shared StatEngine (calculateStats).
 */
import { UserProfile } from '../types/Profile';
import { calculateStats, LibraryData, AggregatedStats } from './statEngine';

export type SubstatObjective =
    | 'dps'
    | 'hps'
    | 'hybrid'      // maximize DPS * HPS — the calculator's "Maximize DPS & HPS" / "Balanced"
    | 'power'
    | 'damage'
    | 'health'
    | 'lifesteal';  // maximize lifesteal/sec — has no button in the calculator, profile-only

export interface SubstatOptimizeParams {
    objective: SubstatObjective;
    /** Roll quality each allocated point is worth, 0..100 (100 = a perfect max roll). Default 100. */
    perfection?: number;
    /** 'real' uses the stepped breakpoint DPS/HPS, 'theor' the smooth model. Default 'real'. */
    optimizeType?: 'real' | 'theor';
    /** Fold skill DPS/HPS into the objective. Default false, matching the calculator's default. */
    includeSkills?: boolean;
    /** Substat point budget. Default derived from the profile's own slot counts (calculator-style). */
    totalPool?: number;
    /** Random restarts for the local search. Default 20 (the calculator's value). */
    maxRestarts?: number;
}

export interface SubstatOptimizeResult {
    /** Best allocation found: statId -> number of points. */
    allocations: Record<string, number>;
    /** Full stats (substats ON) of that allocation, ready for DPS/HPS derivation. */
    stats: AggregatedStats;
}

const ITEM_SLOTS: (keyof UserProfile['items'])[] = ['Weapon', 'Helmet', 'Body', 'Gloves', 'Belt', 'Necklace', 'Ring', 'Shoe'];

/** Points a single stat can hold: 8 items + 3 pets + 1 mount. */
const MAX_PER_STAT = 12;

/**
 * Derive the substat point budget the same way the calculator's pre-fill does: each category's
 * config is the most substats any single piece in it carries, times the number of pieces.
 */
function derivePool(profile: UserProfile): number {
    let maxItem = 1, maxPet = 1, maxMount = 1;
    for (const slot of ITEM_SLOTS) {
        const it = profile.items[slot];
        if (it?.secondaryStats && it.secondaryStats.length > maxItem) maxItem = it.secondaryStats.length;
    }
    for (const pet of profile.pets.active) {
        if (pet?.secondaryStats && pet.secondaryStats.length > maxPet) maxPet = pet.secondaryStats.length;
    }
    const mount = profile.mount.active;
    if (mount?.secondaryStats && mount.secondaryStats.length > maxMount) maxMount = mount.secondaryStats.length;
    return maxItem * 8 + maxPet * 3 + maxMount * 1;
}

/**
 * Find the substat allocation that maximizes `objective`, returning the allocation and the
 * resulting stats. Returns null if the required libraries aren't loaded yet.
 *
 * The profile is never mutated: a deep clone with all substats cleared is used as the scoring
 * base, and the simulated allocation is injected onto the Weapon slot (substats are player-level
 * multipliers, so the slot they sit on doesn't matter to the totals).
 */
export function optimizeSubstats(
    profile: UserProfile,
    libs: LibraryData,
    secondaryStatLibrary: Record<string, any>,
    params: SubstatOptimizeParams
): SubstatOptimizeResult | null {
    if (!secondaryStatLibrary || !libs.itemBalancingConfig || !libs.itemBalancingLibrary) return null;

    const { objective } = params;
    const perfection = params.perfection ?? 100;
    const optimizeType = params.optimizeType ?? 'real';
    const includeSkills = params.includeSkills ?? false;
    const maxRestarts = params.maxRestarts ?? 20;
    const totalPool = params.totalPool ?? derivePool(profile);

    const statList = Object.keys(secondaryStatLibrary);

    // Base profile with every substat cleared. calculateStats does not mutate it, so a single
    // clone is reused across the thousands of scoring calls below.
    const base: UserProfile = JSON.parse(JSON.stringify(profile));
    if (!base.items.Weapon) {
        base.items.Weapon = { age: 1, idx: 0, level: 1, rarity: 'Legendary', secondaryStats: [] } as any;
    }
    for (const slot of ITEM_SLOTS) {
        if (slot !== 'Weapon' && base.items[slot]) base.items[slot]!.secondaryStats = [];
    }
    base.pets.active.forEach((pet: any) => { pet.secondaryStats = []; });
    if (base.mount.active) base.mount.active.secondaryStats = [];

    const injectAndCalc = (allocs: Record<string, number>): AggregatedStats => {
        const simulated = Object.entries(allocs)
            .filter(([, count]) => count > 0)
            .map(([statId, count]) => ({ statId, value: count * (secondaryStatLibrary[statId]?.UpperRange || 0) * perfection }));
        base.items.Weapon!.secondaryStats = simulated;
        return calculateStats(base, libs);
    };

    const getScore = (allocs: Record<string, number>): number => {
        const stats = injectAndCalc(allocs);

        const cappedCrit = Math.min(stats.criticalChance, 1);
        const cappedDouble = Math.min(stats.doubleDamageChance, 1);
        const critMult = 1 + cappedCrit * (stats.criticalDamage - 1);
        const doubleMult = 1 + cappedDouble;
        const aps = 1 / (stats.weaponAttackDuration / stats.attackSpeedMultiplier);
        const weaponTheor = stats.totalDamage * aps * critMult * doubleMult;
        const weaponReal = stats.realWeaponDps;

        const skillDps = includeSkills ? stats.skillDps + (stats.skillBuffDps || 0) : 0;
        const theorDps = weaponTheor + skillDps;
        const realDps = weaponReal + skillDps;

        const blockChance = Math.min(stats.blockChance || 0, 0.95);
        const skillHps = includeSkills ? stats.skillHps : 0;
        const theorHps = (stats.totalHealth * stats.healthRegen + weaponTheor * stats.lifeSteal + skillHps) / (1 - blockChance);
        const realHps = (stats.totalHealth * stats.healthRegen + weaponReal * stats.lifeSteal + skillHps) / (1 - blockChance);

        const dps = optimizeType === 'real' ? realDps : theorDps;
        const hps = optimizeType === 'real' ? realHps : theorHps;
        const weaponForLifesteal = optimizeType === 'real' ? weaponReal : weaponTheor;

        switch (objective) {
            case 'dps': return dps;
            case 'hps': return hps;
            case 'lifesteal': return weaponForLifesteal * stats.lifeSteal;
            case 'power': {
                const powerDmgMulti = stats.powerDamageMultiplier || 8.0;
                return ((stats.totalDamage - 10) * powerDmgMulti + (stats.totalHealth - 80)) * 3;
            }
            case 'damage': return stats.totalDamage;
            case 'health': return stats.totalHealth;
            case 'hybrid':
            default: return dps * hps;
        }
    };

    // --- Lookahead greedy ascent -------------------------------------------------------------
    const currentAllocs: Record<string, number> = {};
    let remainingPoints = totalPool;
    while (remainingPoints > 0) {
        let bestStat = '';
        let bestPointsToAdd = 0;
        let bestIncreasePerPoint = -1;
        const baseScore = getScore(currentAllocs);

        for (const stat of statList) {
            const currentPoints = currentAllocs[stat] || 0;
            const maxToAdd = Math.min(remainingPoints, MAX_PER_STAT - currentPoints);
            if (maxToAdd <= 0) continue;

            // Lookahead: adding 1..maxToAdd points can leap a breakpoint that a single point misses.
            let localBestIncreasePerPoint = -1;
            let localBestPoints = 0;
            for (let k = 1; k <= maxToAdd; k++) {
                const tempAllocs = { ...currentAllocs, [stat]: currentPoints + k };
                const increasePerPoint = (getScore(tempAllocs) - baseScore) / k;
                if (increasePerPoint > localBestIncreasePerPoint) {
                    localBestIncreasePerPoint = increasePerPoint;
                    localBestPoints = k;
                }
            }

            if (localBestIncreasePerPoint > bestIncreasePerPoint) {
                bestIncreasePerPoint = localBestIncreasePerPoint;
                bestStat = stat;
                bestPointsToAdd = localBestPoints;
            }
        }

        if (bestStat && bestIncreasePerPoint > 0) {
            currentAllocs[bestStat] = (currentAllocs[bestStat] || 0) + bestPointsToAdd;
            remainingPoints -= bestPointsToAdd;
        } else {
            // No improving move: dump the rest onto any stat with room so the pool is spent.
            const fallbackStat = statList.find(s => (currentAllocs[s] || 0) < MAX_PER_STAT);
            if (fallbackStat) {
                currentAllocs[fallbackStat] = (currentAllocs[fallbackStat] || 0) + 1;
                remainingPoints -= 1;
            } else {
                break;
            }
        }
    }

    // --- Random-restart local search ---------------------------------------------------------
    // Submodular synergies (e.g. 1 pt Cooldown + 1 pt AttackSpeed) can trap a pure greedy pass;
    // hill-climbing several random seeds recovers those combined optima.
    let globalBestAllocs = { ...currentAllocs };
    let globalBestScore = getScore(globalBestAllocs);

    const startingPoints: Record<string, number>[] = [currentAllocs];
    for (let i = 0; i < maxRestarts; i++) {
        const randomAlloc: Record<string, number> = {};
        let pointsLeft = totalPool;
        const availableStats = [...statList];
        while (pointsLeft > 0 && availableStats.length > 0) {
            const idx = Math.floor(Math.random() * availableStats.length);
            const s = availableStats[idx];
            const maxCanAdd = Math.min(pointsLeft, MAX_PER_STAT - (randomAlloc[s] || 0));
            if (maxCanAdd <= 0) { availableStats.splice(idx, 1); continue; }
            const add = Math.floor(Math.random() * maxCanAdd) + 1;
            randomAlloc[s] = (randomAlloc[s] || 0) + add;
            pointsLeft -= add;
            if (randomAlloc[s] === MAX_PER_STAT) availableStats.splice(idx, 1);
        }
        startingPoints.push(randomAlloc);
    }

    for (const startAlloc of startingPoints) {
        const localAllocs = { ...startAlloc };
        let improved = true;
        while (improved) {
            improved = false;
            let bestSwapScore = getScore(localAllocs);
            let bestSwap: { remove: string; add: string; count: number } | null = null;

            const currentStats = Object.keys(localAllocs).filter(s => localAllocs[s] > 0);
            for (const removeStat of currentStats) {
                const removeAvailable = localAllocs[removeStat];
                for (const addStat of statList) {
                    if (removeStat === addStat) continue;
                    const addAvailable = MAX_PER_STAT - (localAllocs[addStat] || 0);
                    if (addAvailable <= 0) continue;
                    // Swap 1..2 points to hop over breakpoint-induced local minima.
                    const maxSwap = Math.min(removeAvailable, addAvailable, 2);
                    for (let k = 1; k <= maxSwap; k++) {
                        const tempAllocs = { ...localAllocs };
                        tempAllocs[removeStat] -= k;
                        tempAllocs[addStat] = (tempAllocs[addStat] || 0) + k;
                        const score = getScore(tempAllocs);
                        if (score > bestSwapScore) {
                            bestSwapScore = score;
                            bestSwap = { remove: removeStat, add: addStat, count: k };
                        }
                    }
                }
            }

            if (bestSwap) {
                localAllocs[bestSwap.remove] -= bestSwap.count;
                localAllocs[bestSwap.add] = (localAllocs[bestSwap.add] || 0) + bestSwap.count;
                improved = true;
            }
        }

        const finalScore = getScore(localAllocs);
        if (finalScore > globalBestScore) {
            globalBestScore = finalScore;
            globalBestAllocs = { ...localAllocs };
        }
    }

    return { allocations: globalBestAllocs, stats: injectAndCalc(globalBestAllocs) };
}
