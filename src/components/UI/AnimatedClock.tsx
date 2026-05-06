import { cn } from '../../lib/utils';
import { useGameDataContext } from '../../context/GameDataContext';

interface AnimatedClockProps {
    className?: string;
}

export function AnimatedClock({ className }: AnimatedClockProps) {
    const { selectedVersion } = useGameDataContext();
    return (
        <div className={cn("relative flex items-center justify-center", className)}>
            <img
                src={`${import.meta.env.BASE_URL}Texture2D/${selectedVersion}/ProgressBarClockIcon.png`}
                alt="Clock Back"
                className="w-full h-full object-contain"
            />
            <img
                src={`${import.meta.env.BASE_URL}Texture2D/${selectedVersion}/ProgressBarClockIconHand.png`}
                alt="Clock Hand"
                className="absolute w-full h-full object-contain animate-clock-pendulum"
            />
        </div>
    );
}
