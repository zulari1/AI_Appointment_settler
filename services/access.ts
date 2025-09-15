import { VITE_WEBHOOK_CHECK_ACCESS } from '../env';

export type ServiceName =
  | "chatbot" | "support-ai" | "sales-ai" | "lead-gen" | "web-ai" | "research-ai" | "custom-solutions" 
  | "ai-readiness-audit" | "website-scorecard" | "email-rewrite" | "strategy-call" | "simulator";

export type CheckIntent = "check" | "consume" | "check_access";

export interface CheckAccessRequest {
  email: string;
  service: ServiceName;
  intent: CheckIntent;
  units?: number;
  clientTs?: string;
  metadata?: Record<string, any>;
}

export interface RawAccessResponse {
    response: string;
}

export interface CheckAccessResponse {
  email: string;
  plan: string;
  status: "active" | "inactive";
  services: string[];
  service: ServiceName;
  allowed: boolean;
  reason: string | null;
  subscriptionValid: boolean;
  usage: {
    current: number;
    limit: number;
    remaining: number;
  };
  rateLimit: {
    allowed: boolean;
    resetAt: string | null;
    cooldownMinutes: number | null;
    reason?: string | null;
  };
  subscription: {
    type: "trial" | "paid" | "expired";
    trialEnds: string | null;
    subscriptionResetAt: string | null;
  };
}

const createErrorResponse = (reason: string, subscriptionValid = false) => {
    return {
        response: JSON.stringify({
            allowed: false,
            reason: reason,
            subscriptionValid: subscriptionValid,
            email: '',
            plan: 'unknown',
            status: 'inactive',
            services: [],
            service: '',
            usage: { current: 0, limit: 0, remaining: 0 },
            rateLimit: { allowed: false, resetAt: null, cooldownMinutes: null },
            subscription: { type: 'expired', trialEnds: null, subscriptionResetAt: null }
        })
    };
};

export async function checkAccess(payload: Partial<CheckAccessRequest>): Promise<RawAccessResponse> {
  // --- ACCESS CONTROL TEMPORARILY DISABLED FOR TESTING ---
  console.warn("Access control is temporarily disabled for testing purposes.");
  
  const successResponse: CheckAccessResponse = {
    email: payload.email || 'demo@zulari.app',
    plan: 'enterprise',
    status: 'active',
    services: [], // Not important for this mock
    service: payload.service!,
    allowed: true,
    reason: 'ACCESS_GRANTED_BY_DEV_OVERRIDE',
    subscriptionValid: true,
    usage: {
      current: 0,
      limit: 1000,
      remaining: 1000,
    },
    rateLimit: {
      allowed: true,
      resetAt: null,
      cooldownMinutes: null,
    },
    subscription: {
      type: 'paid',
      trialEnds: null,
      subscriptionResetAt: null,
    },
  };

  return Promise.resolve({
    response: JSON.stringify(successResponse)
  });

  // --- ORIGINAL IMPLEMENTATION ---
  /*
  try {
    const res = await fetch(VITE_WEBHOOK_CHECK_ACCESS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        units: 1,
        clientTs: new Date().toISOString(),
        ...payload
      }),
    });

    if (!res.ok) {
        // Attempt to parse a structured error from the backend first.
        try {
            const errorBody = await res.json();
            if (errorBody && typeof errorBody.response === 'string') {
                return errorBody;
            }
        } catch (e) {
            // Ignore if the body is not JSON or empty
        }
        return createErrorResponse(res.status === 429 ? "rate_limited" : "server_error");
    }

    return await res.json();
  } catch (err) {
      console.error("Network error during access check:", err);
      return createErrorResponse("server_error");
  }
  */
}
