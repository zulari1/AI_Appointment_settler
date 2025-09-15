import { useState, useEffect, useCallback } from 'react';
import * as n8n from '../services/n8nService';
import { Lead } from '../types';
import { groupLeadsByDate, LeadGroup } from '../utils/groupLeads';

export const useGroupedLeads = (filterStatus: string) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [leadGroups, setLeadGroups] = useState<LeadGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const fetchLeads = useCallback(async (pageNum: number) => {
        setLoading(true);
        try {
            const res = await n8n.fetchLeads(pageNum, 10, filterStatus);
            
            setLeads(prev => {
                const newLeads = pageNum === 1 ? res.leads : [...prev, ...res.leads];
                // FIX: Explicitly type uniqueLeads to resolve type inference issue.
                const uniqueLeads: Lead[] = Array.from(new Map(newLeads.map(item => [item.id, item])).values());
                const groups = groupLeadsByDate(uniqueLeads);
                setLeadGroups(groups);
                // Expand the first group by default only on initial load
                if (pageNum === 1 && groups.length > 0) {
                    setExpandedGroups(new Set([groups[0].date]));
                }
                return uniqueLeads;
            });
            
            setHasMore(res.leads.length === 10);
        } catch (e: any) {
            setNotification({ message: `Failed to load leads: ${e.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [filterStatus]);

    useEffect(() => {
        setPage(1);
        fetchLeads(1);
    }, [fetchLeads]);

    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchLeads(nextPage);
        }
    };

    const toggleGroup = (date: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(date)) {
                newSet.delete(date);
            } else {
                newSet.add(date);
            }
            return newSet;
        });
    };

    return {
        leadGroups,
        loading,
        notification,
        hasMore,
        loadMore,
        expandedGroups,
        toggleGroup,
        setLeads // Allow parent to modify leads directly after an action
    };
};
