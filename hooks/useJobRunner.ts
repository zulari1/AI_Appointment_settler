import { useState, useEffect, useCallback, useRef } from 'react';
import * as n8n from '../services/n8nService';
import { JobStatusResponse } from '../types';

const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7 days

type JobStatus = 'idle' | 'processing' | 'completed' | 'failed';

export const useJobRunner = <T, S extends { job_id: string }>() => {
    const [status, setStatus] = useState<JobStatus>('idle');
    const [jobId, setJobId] = useState<string | null>(null);
    const [jobStage, setJobStage] = useState<string | undefined>(undefined);
    const [resultData, setResultData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const pollingRef = useRef<number | null>(null);
    const retriesRef = useRef(0);

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    const pollJobStatus = useCallback((currentJobId: string) => {
        let delay = 2500;
        const maxDelay = 8000;

        const poll = async () => {
            try {
                const jobStatus = await n8n.getJobStatus<T>(currentJobId);
                retriesRef.current = 0; // Reset retries on successful fetch

                setJobStage(jobStatus.stage);

                if (jobStatus.status === 'completed' && jobStatus.output) {
                    const cacheData = { output: jobStatus.output, timestamp: Date.now() };
                    localStorage.setItem(`zulari:job:${currentJobId}`, JSON.stringify(cacheData));
                    setResultData(jobStatus.output);
                    setStatus('completed');
                    stopPolling();
                } else if (jobStatus.status === 'failed') {
                    setError(jobStatus.error?.message || 'The job failed without a specific message.');
                    setStatus('failed');
                    stopPolling();
                }
            } catch (err) {
                console.error("Polling failed:", err);
                retriesRef.current += 1;
                if (retriesRef.current >= 3) {
                    setError('Could not get job status after multiple retries.');
                    setStatus('failed');
                    stopPolling();
                }
            }
        };
        
        stopPolling();
        
        const runPoll = () => {
            poll();
            delay = Math.min(maxDelay, delay + 500);
            pollingRef.current = window.setTimeout(runPoll, delay);
        };

        poll(); // Initial poll immediately
        pollingRef.current = window.setTimeout(runPoll, delay);

    }, [stopPolling]);
    
    const startJob = useCallback((jobStarter: () => Promise<S>) => {
        setStatus('processing');
        setJobId(null);
        setResultData(null);
        setError(null);
        setJobStage(undefined);

        jobStarter()
            .then(response => {
                const currentJobId = response.job_id;
                setJobId(currentJobId);
                
                // Check cache before starting to poll
                const cachedItem = localStorage.getItem(`zulari:job:${currentJobId}`);
                if (cachedItem) {
                    try {
                        const data = JSON.parse(cachedItem);
                        if (Date.now() - data.timestamp < CACHE_EXPIRATION) {
                            setResultData(data.output);
                            setStatus('completed');
                            return; // Don't poll if we have a valid cache
                        } else {
                            localStorage.removeItem(`zulari:job:${currentJobId}`);
                        }
                    } catch (e) {
                        localStorage.removeItem(`zulari:job:${currentJobId}`);
                    }
                }
                
                pollJobStatus(currentJobId);
            })
            .catch(err => {
                console.error("Failed to start job:", err);
                setError(err.message || "Failed to start the job.");
                setStatus('failed');
            });
    }, [pollJobStatus]);

    const reset = useCallback(() => {
        stopPolling();
        setStatus('idle');
        setJobId(null);
        setResultData(null);
        setError(null);
        setJobStage(undefined);
    }, [stopPolling]);

    useEffect(() => {
        return () => stopPolling();
    }, [stopPolling]);

    return {
        status,
        jobId,
        jobStage,
        resultData,
        error,
        startJob,
        reset,
    };
};
