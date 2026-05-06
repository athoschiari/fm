import React from 'react';
import { cn } from '../../lib/utils';

export interface StatBreakdown {
    base: number;
    levelMulti?: number;
    techMulti?: number;
    ascMulti?: number;
    skinMulti?: number;
    meleeMulti?: number;
}

interface StatBreakdownTooltipProps {
    damage?: StatBreakdown;
    health?: StatBreakdown;
    isMelee?: boolean;
}

const formatMulti = (val: number) => `x${val.toFixed(2)}`;

export function StatBreakdownTooltip({ damage, health, isMelee }: StatBreakdownTooltipProps) {
    return (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black/95 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-2xl z-[100] pointer-events-none animate-in fade-in zoom-in duration-200">
            <div className="space-y-3">
                {damage && (
                    <div>
                        <div className="text-[10px] font-black text-red-400 uppercase tracking-tighter mb-1 border-b border-red-400/20 pb-0.5">Damage Breakdown</div>
                        <div className="space-y-1 text-[10px] font-mono">
                            <div className="flex justify-between">
                                <span className="text-text-muted">Base Value</span>
                                <span className="text-white">{damage.base.toFixed(1)}</span>
                            </div>
                            {damage.levelMulti && damage.levelMulti > 1 && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Level Scaling</span>
                                    <span className="text-blue-400">{formatMulti(damage.levelMulti)}</span>
                                </div>
                            )}
                            {damage.techMulti && damage.techMulti > 1 && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Tech Tree</span>
                                    <span className="text-green-400">{formatMulti(damage.techMulti)}</span>
                                </div>
                            )}
                            {damage.ascMulti && damage.ascMulti > 1 && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Ascension</span>
                                    <span className="text-amber-400">{formatMulti(damage.ascMulti)}</span>
                                </div>
                            )}
                            {damage.skinMulti && damage.skinMulti > 1 && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Skin Bonus</span>
                                    <span className="text-pink-400">{formatMulti(damage.skinMulti)}</span>
                                </div>
                            )}
                            {isMelee && damage.meleeMulti && (
                                <div className="flex justify-between border-t border-white/5 mt-1 pt-1">
                                    <span className="text-text-muted">Melee Multi</span>
                                    <span className="text-red-400">{formatMulti(damage.meleeMulti)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {health && (
                    <div>
                        <div className="text-[10px] font-black text-green-400 uppercase tracking-tighter mb-1 border-b border-green-400/20 pb-0.5">Health Breakdown</div>
                        <div className="space-y-1 text-[10px] font-mono">
                            <div className="flex justify-between">
                                <span className="text-text-muted">Base Value</span>
                                <span className="text-white">{health.base.toFixed(1)}</span>
                            </div>
                            {health.levelMulti && health.levelMulti > 1 && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Level Scaling</span>
                                    <span className="text-blue-400">{formatMulti(health.levelMulti)}</span>
                                </div>
                            )}
                            {health.techMulti && health.techMulti > 1 && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Tech Tree</span>
                                    <span className="text-green-400">{formatMulti(health.techMulti)}</span>
                                </div>
                            )}
                            {health.ascMulti && health.ascMulti > 1 && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Ascension</span>
                                    <span className="text-amber-400">{formatMulti(health.ascMulti)}</span>
                                </div>
                            )}
                            {health.skinMulti && health.skinMulti > 1 && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Skin Bonus</span>
                                    <span className="text-pink-400">{formatMulti(health.skinMulti)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-2 pt-2 border-t border-white/10 text-[8px] text-text-muted italic text-center">
                All multipliers compound multiplicatively
            </div>
        </div>
    );
}
