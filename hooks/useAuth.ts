import { useState, useEffect } from 'react';

// This is a dummy hook to demonstrate the redirect fix pattern.
// In a real app, this would involve API calls and context.
export const useAuth = () => {
    const [loading, setLoading] = useState(true);
    // hasAccess is undefined during loading, then boolean
    const [hasAccess, setHasAccess] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        // Simulate checking auth status
        const timer = setTimeout(() => {
            // For this fix, we will assume the user has access.
            // To test the redirect, you can set this to false.
            setHasAccess(true);
            setLoading(false);
        }, 500); // Short delay to simulate async check

        return () => clearTimeout(timer);
    }, []);

    return { loading, hasAccess };
};
