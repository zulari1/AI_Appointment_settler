

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ReplierRow, ReplierKpis } from '../../types';
import * as replierService from '../../services/replierService';
import { calcKPIs, deriveRow, groupRowsByStatus } from '../../utils/replierUtils';
import ActionNotification from '../../components/ActionNotification';
import ReplierHero from '../../components/replier/ReplierHero';
import ReplierList from '../../components/replier/ReplierList';
import ReplierDetailDrawer from '../../components/replier/ReplierDetailDrawer';
import ReplierSettingsModal from '../../components/replier/ReplierSettingsModal';

type SyncStatus = {
    status: 'syncing' | 'synced' | 'delayed' | 'error' | 'paused';
    lastSync: Date | null;
};

type FetchState = 'loading' | 'success' | 'empty' | 'error';

const ReplierPage: React.FC = () => {
    const [allRows, setAllRows] = useState<ReplierRow[]>([]);
    const [newRowIds, setNewRowIds] = useState<Set<string>>(new Set());
    const [kpis, setKpis] = useState<ReplierKpis | null>(null);
    const [fetchState, setFetchState] = useState<FetchState>('loading');
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [activeFilter, setActiveFilter] = useState('action_required');
    const [selectedRow, setSelectedRow] = useState<ReplierRow | null>(null);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>({ status: 'syncing', lastSync: null });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showConfetti, setShowConfetti] = useState(false);


    const pollingTimeoutRef = useRef<number | null>(null);
    const backoffDelayRef = useRef(30000); // Start with 30s

    const handleDataFetch = useCallback(async (isManual = false) => {
        if (!isManual && syncStatus.status === 'syncing') return;
        if (fetchState === 'loading' && !isManual) { /* Don't set syncing if initial load */ }
        else { setSyncStatus(prev => ({ ...prev, status: 'syncing' })); }

        try {
            const { rows, lastSync, isStale } = await replierService.fetchReplierRows();
            const derivedRows = rows.map(deriveRow);

            if (rows.length === 0) {
                 setFetchState('empty');
            } else {
                 setFetchState('success');
            }

            setAllRows(prevRows => {
                if (isManual || fetchState === 'loading') {
                    setNewRowIds(new Set());
                    return derivedRows;
                }
                const prevIds = new Set(prevRows.map(r => r['Request ID']));
                const newIds = derivedRows.filter(r => !prevIds.has(r['Request ID'])).map(r => r['Request ID']);
                setNewRowIds(new Set(newIds));
                return derivedRows;
            });

            if (isStale) {
                setSyncStatus({ status: 'delayed', lastSync });
                backoffDelayRef.current = Math.min(backoffDelayRef.current * 2, 300000); // Exponential backoff up to 5 mins
            } else {
                // If no new rows, backoff
                if (JSON.stringify(rows) === JSON.stringify(allRows)) {
                     backoffDelayRef.current = Math.min(backoffDelayRef.current + 30000, 300000);
                } else {
                     backoffDelayRef.current = 30000; // Reset backoff on success with new data
                }
                setSyncStatus({ status: 'synced', lastSync });
            }
        } catch (e: any) {
            if (fetchState === 'loading') {
                setFetchState('error');
            }
            setSyncStatus(prev => ({ status: 'error', lastSync: prev.lastSync }));
            setNotification({ message: `Failed to load replies: ${e.message}`, type: 'error' });
            backoffDelayRef.current = Math.min(backoffDelayRef.current * 2, 300000); // Exponential backoff
        }
    }, [syncStatus.status, fetchState, allRows]);

    // Polling effect
    useEffect(() => {
        const poll = () => {
            if (document.hidden || isPaused) {
                pollingTimeoutRef.current = window.setTimeout(poll, backoffDelayRef.current);
                return;
            }
            handleDataFetch().finally(() => {
                pollingTimeoutRef.current = window.setTimeout(poll, backoffDelayRef.current);
            });
        };
        
        handleDataFetch(true); // Initial fetch

        pollingTimeoutRef.current = window.setTimeout(poll, backoffDelayRef.current);

        return () => { if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current); };
    }, [isPaused]); // handleDataFetch is stable enough not to be a dependency

    useEffect(() => {
        setSyncStatus(prev => ({...prev, status: isPaused ? 'paused' : prev.status }));
    }, [isPaused]);

    const filteredRows = useMemo(() => {
        return allRows.filter(r => {
            const status = String(r.Status || '').toLowerCase();
            switch (activeFilter) {
                case "action_required":
                    return status === "escalated" || status === "pending" || String(r['Human Escalation Needed']).toUpperCase() === 'YES';
                case "high_confidence":
                    return r.aiConfidence >= 80;
                case "needs_review":
                    return status === "awaiting human";
                case "calendar_only":
                    return !!r['Google Calendar Link'] && !r['Final Outcome'];
                case "active":
                    return status === "in progress";
                default:
                    return true;
            }
        });
    }, [allRows, activeFilter]);

    useEffect(() => {
        setKpis(calcKPIs(allRows));
    }, [allRows]);
    
    const groupedRows = useMemo(() => groupRowsByStatus(filteredRows), [filteredRows]);

    const handleSelectionChange = useCallback((requestId: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(requestId)) {
                newSet.delete(requestId);
            } else {
                newSet.add(requestId);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = useCallback((check: boolean) => {
        if (check) {
            setSelectedIds(new Set(groupedRows.flatMap(g => g.items.map(i => i['Request ID']))));
        } else {
            setSelectedIds(new Set());
        }
    }, [groupedRows]);

    const handleHumanAction = async (action: "approve" | "decline", leads: ReplierRow[]) => {
        try {
            await replierService.triggerHumanAction(action, leads);
            
            const leadName = leads.length === 1 ? leads[0]['User Name'] : `${leads.length} leads`;
            const message = `Action logged for ${leadName}. You'll receive an email shortly to finalize this reply.`;
            setNotification({ message, type: 'success' });
            
            if (leads.length > 1) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
            }

            setSelectedIds(new Set()); // Clear selection after action

        } catch (e: any) {
            setNotification({ message: `Action failed: ${e.message}`, type: 'error' });
        }
    };
    
    return (
        <div className="space-y-6">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            {showConfetti && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl pointer-events-none z-[100]">
                    <div className="animate-confetti-burst">🎉</div>
                </div>
            )}
            <ReplierHero 
                kpis={kpis} 
                syncStatus={syncStatus}
                onManualSync={() => handleDataFetch(true)} 
                onOpenSettings={() => setSettingsModalOpen(true)}
                isPaused={isPaused}
                setIsPaused={setIsPaused}
            />
            
            <ReplierList 
                fetchState={fetchState}
                onRetry={() => handleDataFetch(true)}
                groupedRows={groupedRows}
                onSelectRow={setSelectedRow}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                newRowIds={newRowIds}
                selectedIds={selectedIds}
                onSelectionChange={handleSelectionChange}
                onSelectAll={handleSelectAll}
                onBulkAction={(action) => {
                    const selectedLeads = allRows.filter(r => selectedIds.has(r['Request ID']));
                    handleHumanAction(action, selectedLeads);
                }}
                onUpdateAction={(action, row) => handleHumanAction(action, [row])}
            />
            
            <ReplierDetailDrawer 
                row={selectedRow} 
                onClose={() => setSelectedRow(null)} 
                onUpdateAction={(action, row) => handleHumanAction(action, [row])}
            />
            
            <ReplierSettingsModal 
                isOpen={settingsModalOpen} 
                onClose={() => setSettingsModalOpen(false)} 
                onSave={() => {}}
                initialSettings={{ on: false, threshold: 85 }}
            />
        </div>
    );
};

export default ReplierPage;