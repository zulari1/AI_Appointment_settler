import React, { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

const KpiItem: React.FC<{ label: string, value: number }> = ({ label, value }) => {
    const [animatedValue, setAnimatedValue] = useState(0);

    useEffect(() => {
        const controls = animate(animatedValue, value, {
            duration: 0.5,
            ease: "easeOut",
            onUpdate: (latest) => {
                setAnimatedValue(Math.round(latest));
            }
        });
        return () => {
            controls.stop();
        };
    }, [value]);

    return (
        <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-white">{animatedValue.toLocaleString()}</p>
            <p className="text-sm text-dark-text-secondary">{label}</p>
        </div>
    );
}

interface KPIStripProps {
    kpis: {
        found: number;
        researched: number;
        personalized: number;
        sent: number;
        replies: number;
        meetings: number;
    };
}

const KPIStrip: React.FC<KPIStripProps> = ({ kpis }) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiItem label="Leads Found" value={kpis.found} />
            <KpiItem label="Researched" value={kpis.researched} />
            <KpiItem label="Personalized" value={kpis.personalized} />
            <KpiItem label="Sent" value={kpis.sent} />
            <KpiItem label="Replies" value={kpis.replies} />
            <KpiItem label="Meetings" value={kpis.meetings} />
        </div>
    );
};

export default KPIStrip;