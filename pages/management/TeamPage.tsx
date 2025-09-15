import React from 'react';
import { ICONS } from '../../constants';
import SubPageHeader from '../../components/SubPageHeader';

const TeamPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <SubPageHeader title="Team & Users" icon={ICONS.team} />
            <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center">
                <h2 className="text-xl font-bold text-white">Manage Team Members</h2>
                <p className="text-dark-text-secondary mt-2">This is where you will invite, remove, and manage user roles and permissions.</p>
                <button className="mt-6 bg-brand-primary hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg">
                    Invite New Member
                </button>
            </div>
        </div>
    );
};

export default TeamPage;