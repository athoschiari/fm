/**
 * Standardizes Guild War timing based on 00:00 UTC reset.
 *
 * IMPORTANT: nothing here hard-codes which day a category is active on.
 * Day assignments change between game config versions, so the day → category
 * mapping is derived dynamically from GuildWarDayConfigLibrary.json. The day
 * information is only used to *recommend* which calculator is worth using today;
 * the calculators themselves compute war points regardless of the current day.
 */

// Tuesday is Day 0

export type WarCategory = 'tech' | 'skills' | 'mounts' | 'eggs' | 'pets' | 'dungeons' | 'forge' | 'forgeSpend';

/**
 * Returns the Guild War day index (0-5) for a given date,
 * based on the 00:00 UTC reset.
 *
 * Tuesday = 0, Wednesday = 1, Thursday = 2, Friday = 3, Saturday = 4,
 * Sunday = 5, Monday = 5 (Battle Day / Carry over)
 */
export function getWarDayIndex(date: Date = new Date()): number {
    const utcDay = date.getUTCDay(); // 0=Sun, 1=Mon, ..., 2=Tue

    const mapping: Record<number, number> = {
        2: 0, // Tue
        3: 1, // Wed
        4: 2, // Thu
        5: 3, // Fri
        6: 4, // Sat
        0: 5, // Sun
        1: 5  // Mon
    };

    return mapping[utcDay] ?? 0;
}

/**
 * Classifies a Guild War task name into a war category.
 * Kept in one place so every consumer agrees on what counts as e.g. "eggs".
 */
export function classifyWarTask(taskName: string): WarCategory | null {
    if (!taskName) return null;
    if (/TechTreeUpgrade$/.test(taskName)) return 'tech';
    if (/Skill$/.test(taskName) && (/^Summon/.test(taskName) || /^Upgrade/.test(taskName))) return 'skills';
    if (/Mount$/.test(taskName) && (/^Summon/.test(taskName) || /^Merge/.test(taskName))) return 'mounts';
    if (/^Hatch.*Egg$/.test(taskName)) return 'eggs';
    if (/^Merge.*Pet$/.test(taskName)) return 'pets';
    if (/DungeonKey$/.test(taskName)) return 'dungeons';
    if (/^Forge.*Equipment$/.test(taskName)) return 'forge';
    if (taskName === 'SpendCoinsOnForge' || taskName === 'SpendGemOnForge') return 'forgeSpend';
    return null;
}

/**
 * Builds a category → sorted day-index list map from GuildWarDayConfigLibrary.json.
 */
export function computeWarDaysMap(dayConfig: any): Partial<Record<WarCategory, number[]>> {
    const map: Partial<Record<WarCategory, number[]>> = {};
    if (!dayConfig) return map;
    Object.entries(dayConfig).forEach(([dayKey, dayData]: [string, any]) => {
        const idx = Number(dayKey);
        (dayData?.Tasks || []).forEach((task: any) => {
            const cat = classifyWarTask(task?.Task);
            if (!cat) return;
            if (!map[cat]) map[cat] = [];
            if (!map[cat]!.includes(idx)) map[cat]!.push(idx);
        });
    });
    for (const cat of Object.keys(map) as WarCategory[]) {
        map[cat]!.sort((a, b) => a - b);
    }
    return map;
}

/**
 * Finds the WarPointsReward amount for a specific task, searching every day.
 * This makes calculators independent of which day a task happens to live on.
 */
export function getWarPointsForTask(dayConfig: any, taskName: string): number {
    if (!dayConfig) return 0;
    for (const dayData of Object.values(dayConfig) as any[]) {
        const task = dayData?.Tasks?.find((t: any) => t.Task === taskName);
        if (task) {
            const reward = task.Rewards?.find((r: any) => r.$type === 'WarPointsReward');
            if (reward?.Amount !== undefined) return reward.Amount;
        }
    }
    return 0;
}

/**
 * Checks if a specific date lands on a Guild War point day for a category.
 * Pass the loaded GuildWarDayConfigLibrary.json to derive it dynamically
 * (recommended). Without config it falls back to the current known layout.
 */
export function isWarPointDay(date: Date, category: WarCategory, dayConfig?: any): boolean {
    const idx = getWarDayIndex(date);

    if (dayConfig) {
        const days = computeWarDaysMap(dayConfig)[category] || [];
        return days.includes(idx);
    }

    // Fallback (current layout) if config isn't available at the call site.
    switch (category) {
        case 'tech': return idx === 1 || idx === 4;
        case 'skills': return idx === 0 || idx === 2;
        case 'mounts': return idx === 1 || idx === 3;
        case 'eggs': return idx === 2 || idx === 4;
        case 'pets': return idx === 2 || idx === 4;
        case 'dungeons': return idx === 0 || idx === 3;
        case 'forge': return idx === 0 || idx === 2 || idx === 4;
        case 'forgeSpend': return idx === 1 || idx === 3;
        default: return false;
    }
}

/**
 * The clan tech tree node type that boosts war points earned on the given day.
 * Days are 1-indexed in the node names (WarPointsOnDay1 = Tuesday / day index 0).
 */
export function getDayBoostNodeType(date: Date = new Date()): string {
    return `WarPointsOnDay${getWarDayIndex(date) + 1}`;
}

/**
 * Returns a human-readable name for the GW day based on the index.
 */
export function getWarDayName(idx: number): string {
    const names = ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday/Monday'];
    return names[idx] || 'Unknown';
}
