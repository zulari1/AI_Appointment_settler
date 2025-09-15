import React from 'react';
import { ICONS } from '../../constants';
import SubPageHeader from '../../components/SubPageHeader';

const BillingPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <SubPageHeader title="Billing & Plans" icon={ICONS.billing} />
            <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center">
                <h2 className="text-xl font-bold text-white">Manage Your Subscription</h2>
                <p className="text-dark-text-secondary mt-2">View your current plan, usage details, and payment history. You will be able to upgrade or modify your plan from this page.</p>
            </div>
        </div>
    );
};

export default BillingPage;