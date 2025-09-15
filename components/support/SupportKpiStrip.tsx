import React, { useState, useEffect } from 'react';
import { animate } from 'framer-motion';
import { SupportKpis } from '../../utils/supportUtils';interface AnimatedCounterProps {
  value: number;
  suffix?: string;
}


const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, suffix = '' }) => {
    const [animatedValue, setAnimatedValue] = useState(0);
    useEffect(() => {
        const controls = animate(animatedValue, value, {
            duration: 0.7, ease: "easeOut",
            onUpdate: (latest) => setAnimatedValue(Math.round(latest))
        });
        return () => controls.stop();
    }, [value, animatedValue]);
    return <span>{animatedValue.toLocaleString()}{suffix}</span>;
};interface KpiCardProps {
  label: string; children: React.ReactNode;
}


const KpiCard: React.FC<KpiCardProps> = ({ label, children }) => (
    <div className="bg-dark-bg p-3 rounded-lg text-center">
        <p className="text-2xl font-bold text-white">{children}</p>
        <p className="text-xs text-dark-text-secondary">{label}</p>
    </div>
);interface SupportKpiStripProps {
  kpis: SupportKpis | null;
}


const SupportKpiStrip: React.FC<SupportKpiStripProps> = ({ kpis }) => {
    if (!kpis) {
        return <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="bg-dark-bg p-3 rounded-lg h-[68px] animate-pulse"></div>)}
        </div>
    }
    
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard label="Conversations Today"><AnimatedCounter value={kpis.conversationsToday} /></KpiCard>
            <KpiCard label="Resolution Rate"><AnimatedCounter value={kpis.resolutionRate} suffix="%" /></KpiCard>
            <KpiCard label="Escalations"><AnimatedCounter value={kpis.escalated} /></KpiCard>
        </div>
    );
};

export default SupportKpiStrip;
