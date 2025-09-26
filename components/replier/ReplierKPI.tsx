import React, { useEffect, useState } from 'react';
import { animate } from 'framer-motion';
import { ReplierKpis } from '../../types';

const AnimatedCounter: React.FC<{ value: number, suffix?: string }> = ({ value, suffix = '' }) => {
    const [animatedValue, setAnimatedValue] = useState(0);
    useEffect(() => {
        const controls = animate(animatedValue, value, {
            duration: 0.5, ease: "easeOut",
            onUpdate: (latest) => setAnimatedValue(Math.round(latest))
        });
        return () => controls.stop();
    }, [value, animatedValue]);
    return <span>{animatedValue.toLocaleString()}{suffix}</span>;
};

const KpiCard: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
    <div className="bg-dark-bg p-2 rounded-lg">
        <p className="text-xl font-bold text-white">{children}</p>
        <p className="text-xs text-dark-text-secondary">{label}</p>
    </div>
);

const ReplierKPI: React.FC<{ kpis: ReplierKpis | null }> = ({ kpis }) => {
    if (!kpis) return <div className="h-16 w-full bg-dark-bg rounded-lg animate-pulse" />;
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
            <KpiCard label="Conversations Today">
                <AnimatedCounter value={kpis.conversationsToday} />
            </KpiCard>
            <KpiCard label="AI Success %">
                {/* FIX: Corrected property access from `aiSuccessPercent` to `aiSuccessRate` to match the type definition. */}
                <AnimatedCounter value={kpis.aiSuccessRate} suffix="%" />
            </KpiCard>
            <KpiCard label="Booked Meetings">
                <AnimatedCounter value={kpis.bookedMeetings} />
            </KpiCard>
            <KpiCard label="Escalations">
                <AnimatedCounter value={kpis.escalations} />
            </KpiCard>
        </div>
    );
};

export default ReplierKPI;