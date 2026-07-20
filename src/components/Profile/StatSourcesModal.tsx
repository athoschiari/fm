import { memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Cat, Info } from 'lucide-react';
import { Button } from '../UI/Button';
import { ItemSelectionCard } from '../UI/ItemSelectionCard';
import { SpriteSheetIcon } from '../UI/SpriteSheetIcon';
import { cn } from '../../lib/utils';
import { AGES } from '../../utils/constants';
import { getItemImage } from '../../utils/itemAssets';
import { getAscensionTexturePath } from '../../utils/ascensionUtils';
import { useGameData } from '../../hooks/useGameData';
import { useGameDataContext } from '../../context/GameDataContext';
import { AggregatedStats } from '../../utils/statEngine';
import { StatContribution, SourceKind, isTotalKey } from '../../types/statAttribution';

const SLOT_TO_FILE_MAP: Record<string, string> = {
    Weapon: 'Weapon', Helmet: 'Headgear', Body: 'Armor', Gloves: 'Glove',
    Belt: 'Belt', Necklace: 'Neck', Ring: 'Ring', Shoe: 'Foot',
};

const SLOT_TYPE_ID_MAP: Record<string, number> = {
    Helmet: 0, Body: 1, Gloves: 2, Necklace: 3, Ring: 4, Weapon: 5, Shoe: 6, Belt: 7,
};

// Text-line sources render grouped in this order
const KIND_ORDER: SourceKind[] = ['base', 'tech', 'ascension', 'skin', 'set', 'skill'];

const KIND_LABEL: Record<string, string> = {
    base: 'Base', tech: 'Tech Tree', ascension: 'Ascension',
    skin: 'Skins', set: 'Set Bonuses', skill: 'Skills',
};

export interface StatSourcesModalProps {
    isOpen: boolean;
    onClose: () => void;
    statKey: string | null;
    label: string;
    /** Pre-formatted total, taken straight from the card that opened this modal */
    totalDisplay: string;
    stats: AggregatedStats;
    /** How to format an individual contribution (percent stats vs flat damage/health) */
    formatValue: (value: number) => string;
}

const ModalContent = memo(({ statKey, label, totalDisplay, stats, formatValue, onClose }: Omit<StatSourcesModalProps, 'isOpen'>) => {
    const { selectedVersion } = useGameDataContext();
    const { data: autoMapping } = useGameData<any>('AutoItemMapping.json');
    const { data: spriteMapping } = useGameData<any>('ManualSpriteMapping.json');

    const entries: StatContribution[] = useMemo(() => {
        if (!statKey) return [];
        return stats.attribution?.byStat?.[statKey] ?? [];
    }, [statKey, stats]);

    const isTotal = !!statKey && isTotalKey(statKey);
    const formula = statKey ? stats.attribution?.formula?.[statKey] : undefined;

    const cards = useMemo(
        () => entries.filter(e => e.ref && e.op === 'add').sort((a, b) => b.value - a.value),
        [entries]
    );
    const addLines = useMemo(
        () => entries.filter(e => !e.ref && e.op === 'add').sort((a, b) => b.value - a.value),
        [entries]
    );
    const mulLines = useMemo(() => entries.filter(e => e.op === 'mul'), [entries]);

    const addTotal = useMemo(
        () => entries.filter(e => e.op === 'add').reduce((sum, e) => sum + e.value, 0),
        [entries]
    );

    const renderCard = (c: StatContribution) => {
        const ref = c.ref!;
        const contribution = (
            <div className="text-[11px] font-mono font-bold text-accent-primary text-center py-1">
                +{formatValue(c.value)}
            </div>
        );

        if (ref.kind === 'item') {
            const item = ref.item;
            const ageName = AGES[item.age] || 'Primitive';
            const fileSlot = SLOT_TO_FILE_MAP[ref.slot] || ref.slot;
            const typeId = SLOT_TYPE_ID_MAP[ref.slot];
            const nameKey = typeId !== undefined ? `${item.age}_${typeId}_${item.idx}` : '';
            return (
                <ItemSelectionCard
                    key={c.id}
                    item={item}
                    slotKey={ref.slot}
                    slotLabel={ref.slot}
                    itemName={autoMapping?.[nameKey]?.ItemName || ref.slot}
                    itemImage={getItemImage(ageName, fileSlot, item.idx, autoMapping, selectedVersion)}
                    variant="compact"
                    currentLevel={item.level}
                    customStats={contribution}
                />
            );
        }

        if (ref.kind === 'pet') {
            const pet = ref.pet;
            const spriteEntry = spriteMapping?.pets?.mapping
                ? Object.entries(spriteMapping.pets.mapping).find(
                    ([, v]: [string, any]) => v.id === pet.id && v.rarity === pet.rarity)
                : undefined;
            const spriteInfo = spriteEntry
                ? { spriteIndex: parseInt(spriteEntry[0]), config: spriteMapping.pets, name: (spriteEntry[1] as any).name }
                : null;
            return (
                <ItemSelectionCard
                    key={c.id}
                    item={pet}
                    slotKey={`pet-${ref.index}`}
                    slotLabel={`Pet ${ref.index + 1}`}
                    itemName={pet.customName || spriteInfo?.name || `${pet.rarity} Pet`}
                    itemImage={null}
                    rarity={pet.rarity}
                    hideAgeStyles
                    variant="compact"
                    currentLevel={pet.level}
                    spriteMapping={spriteMapping}
                    customStats={contribution}
                    renderIcon={() => spriteInfo ? (
                        <SpriteSheetIcon
                            textureSrc={getAscensionTexturePath('Pets', pet.ascensionLevel || 0, selectedVersion)}
                            spriteWidth={spriteInfo.config.sprite_size.width}
                            spriteHeight={spriteInfo.config.sprite_size.height}
                            sheetWidth={spriteInfo.config.texture_size.width}
                            sheetHeight={spriteInfo.config.texture_size.height}
                            iconIndex={spriteInfo.spriteIndex}
                            className="w-10 h-10"
                        />
                    ) : (
                        <Cat className={cn('w-8 h-8 opacity-50', `text-rarity-${pet.rarity.toLowerCase()}`)} />
                    )}
                />
            );
        }

        const mount = ref.mount;
        return (
            <ItemSelectionCard
                key={c.id}
                item={mount}
                slotKey="mount"
                slotLabel="Mount"
                itemName={mount.customName || `${mount.rarity} Mount`}
                itemImage={null}
                rarity={mount.rarity}
                hideAgeStyles
                variant="compact"
                currentLevel={mount.level}
                spriteMapping={spriteMapping}
                customStats={contribution}
            />
        );
    };

    const renderTextLine = (c: StatContribution, showAsMultiplier = false) => (
        <div key={c.id} className="flex items-center justify-between gap-3 px-3 py-2 bg-bg-input/30 rounded-lg border border-border/30">
            <div className="min-w-0">
                <div className="text-sm text-text-primary truncate">{c.label}</div>
                {c.detail && <div className="text-[11px] text-text-muted truncate">{c.detail}</div>}
            </div>
            <div className="font-mono font-bold text-sm text-accent-primary shrink-0">
                {showAsMultiplier ? `x${c.value.toFixed(3)}` : `+${formatValue(c.value)}`}
            </div>
        </div>
    );

    const groupedAddLines = KIND_ORDER
        .map(kind => ({ kind, items: addLines.filter(l => l.kind === kind) }))
        .filter(g => g.items.length > 0);

    const hasAnything = entries.length > 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-[2px] p-2 md:p-4" onClick={onClose}>
            <div
                className={cn(
                    'bg-bg-primary w-full max-w-[calc(100vw-1rem)] max-h-[95vh] rounded-2xl border border-border/60 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200',
                    isTotal ? 'md:max-w-2xl' : 'md:max-w-xl'
                )}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-5 border-b border-border bg-bg-secondary/40">
                    <div className="min-w-0">
                        <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight truncate">{label}</h3>
                        <div className="text-sm text-text-muted">
                            Total <span className="font-mono font-bold text-accent-primary">{totalDisplay}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/60 hover:text-white shrink-0">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 custom-scrollbar">
                    {!hasAnything && (
                        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                            <Info className="w-8 h-8 text-text-muted opacity-50" />
                            <div className="text-sm text-text-muted">Nothing is contributing to this stat yet.</div>
                        </div>
                    )}

                    {cards.length > 0 && (
                        <div>
                            <div className="text-xs font-bold uppercase text-text-muted mb-2">
                                {isTotal ? 'Flat contributors' : 'Equipment, pets & mount'}
                            </div>
                            {/* Cards are display-only here: suppress ItemSelectionCard's hover/click affordance */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pointer-events-none">
                                {cards.map(renderCard)}
                            </div>
                        </div>
                    )}

                    {groupedAddLines.map(group => (
                        <div key={group.kind}>
                            <div className="text-xs font-bold uppercase text-text-muted mb-2">{KIND_LABEL[group.kind] || group.kind}</div>
                            <div className="space-y-1.5">{group.items.map(l => renderTextLine(l))}</div>
                        </div>
                    ))}

                    {mulLines.length > 0 && (
                        <div>
                            <div className="text-xs font-bold uppercase text-text-muted mb-2">Multiplier layers (applied in order)</div>
                            <div className="space-y-1.5">{mulLines.map(l => renderTextLine(l, true))}</div>
                        </div>
                    )}

                    {hasAnything && (
                        <div className="pt-3 border-t border-border space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-text-muted">
                                    {mulLines.length > 0 ? 'Sum before multipliers' : 'Sum of all sources'}
                                </span>
                                <span className="font-mono font-bold text-text-primary">{formatValue(addTotal)}</span>
                            </div>
                            {formula && (
                                <div className="text-[11px] font-mono text-text-muted bg-bg-input/30 rounded-lg p-2.5 border border-border/30 overflow-x-auto">
                                    {formula}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-bg-secondary flex justify-end">
                    <Button onClick={onClose} variant="ghost" className="px-8 text-accent-primary hover:text-accent-primary">Close</Button>
                </div>
            </div>
        </div>
    );
});

ModalContent.displayName = 'StatSourcesModalContent';

export const StatSourcesModal = memo(({ isOpen, ...rest }: StatSourcesModalProps) => {
    if (!isOpen || !rest.statKey) return null;
    return createPortal(<ModalContent {...rest} />, document.body);
});

StatSourcesModal.displayName = 'StatSourcesModal';
