import { CheckAccessResponse } from './access';

// --- Type Definitions ---
export interface EvaluateAccessResult {
    allowed: boolean;
    reason: string | null;
    message: string;
    action: string;
    service: string | null;
    subscriptionValid: boolean;
    usageCurrent: number | null;
    usageLimit: number | null;
    usageRemaining: number | null;
    usagePercent: number | null;
    resetAtIso: string | null;
    resetInMs: number | null;
    cooldownMinutes: number | null;
    subscription?: CheckAccessResponse['subscription'];
}

interface UiCallbacks {
    onAllow: (result: EvaluateAccessResult) => void;
    onDeny: (result: EvaluateAccessResult) => void;
    showUsage?: (usage: { current: number | null, limit: number | null, remaining: number | null, percent: number | null }) => void;
    showCountdown?: (msLeft: number) => void;
    onTick?: (msLeft: number) => void;
    onCooldownEnd?: () => void;
    autoRefreshAfterCooldown?: () => void;
    onCountdownStart?: (stopFn: () => void) => void;
}


// 1) Safe parser for backend stringified response
function parseBackendResponse(raw: any): CheckAccessResponse | null {
  // raw may be the string or an object with field `response` that is stringified
  try {
    const payload = (typeof raw === 'string') ? raw : (raw && raw.response ? raw.response : null);
    if (!payload) throw new Error('no_payload');
    // payload may itself be the object already or a JSON string
    if (typeof payload === 'object') return payload;
    return JSON.parse(payload);
  } catch (err) {
    console.error('parseBackendResponse error', err);
    return null;
  }
}

// 2) Deterministic evaluator:
function evaluateAccess(data: CheckAccessResponse | null): EvaluateAccessResult {
  const defaultResult = { allowed: false, reason: 'invalid_response', message: 'Invalid server response', action: 'error', service: null, subscriptionValid: false, usageCurrent: null, usageLimit: null, usageRemaining: null, usagePercent: null, resetAtIso: null, resetInMs: null, cooldownMinutes: null };
  if (!data || typeof data !== 'object') return defaultResult;

  // canonical fields
  const allowed = Boolean(data.allowed);
  const reason = data.reason || null;
  const subscriptionValid = !!data.subscriptionValid;
  const service = data.service || null;

  // usage numbers (guard against missing)
  const usageCurrent = data.usage && Number.isFinite(Number(data.usage.current)) ? Number(data.usage.current) : null;
  const usageLimit = data.usage && Number.isFinite(Number(data.usage.limit)) ? Number(data.usage.limit) : null;
  const usageRemaining = data.usage && (typeof data.usage.remaining !== 'undefined') ? data.usage.remaining : (usageLimit !== null && usageCurrent !== null ? Math.max(0, usageLimit - usageCurrent) : null);
  const usagePercent = (usageCurrent !== null && usageLimit !== null && usageLimit > 0) ? Math.round((usageCurrent / usageLimit) * 100) : null;

  // rate limit info (ISO)
  const resetAtIso = data.rateLimit && data.rateLimit.resetAt ? data.rateLimit.resetAt : null;
  const cooldownMinutes = (data.rateLimit && typeof data.rateLimit.cooldownMinutes === 'number') ? data.rateLimit.cooldownMinutes : null;
  const now = Date.now();
  const resetAtMs = resetAtIso ? Date.parse(resetAtIso) : null;
  const resetInMs = (resetAtMs && !Number.isNaN(resetAtMs)) ? (resetAtMs - now) : null;

  const REASON_MAP: { [key: string]: { message: string, action: string }} = {
    service_disabled: { message: 'This service is disabled for your plan.', action: 'upgrade' },
    service_not_in_plan: { message: 'This service is not included in your current plan.', action: 'upgrade' },
    quota_exceeded: { message: 'You have reached your usage limit. Wait for reset or upgrade.', action: 'showUpgradeOrWait' },
    rate_limited: { message: 'You’ve hit the usage limit for today.', action: 'countdown' },
    trial_expired: { message: 'Your trial has expired. Please upgrade to continue.', action: 'renew' },
    service_requires_manual_approval: { message: 'This service requires manual approval. We will contact you.', action: 'contact' },
    subscription_expired: { message: 'Your subscription has ended.', action: 'renew' },
    no_service_requested: { message: 'No service specified.', action: 'error' },
    service_not_supported: { message: 'Requested service not supported.', action: 'error' },
    invalid_response: { message: 'Invalid server response.', action: 'error' },
    server_error: { message: 'A server error occurred. Please try again later.', action: 'error' }
  };

  const mapped = REASON_MAP[reason || ''] || { message: reason || null, action: allowed ? 'allow' : 'deny' };

  const finalAction = allowed ? 'allow' : mapped.action || 'deny';
  const finalMessage = allowed ? 'Access granted' : (mapped.message || 'Access denied');

  return {
    allowed, reason, message: finalMessage, action: finalAction, service,
    subscriptionValid, usageCurrent, usageLimit, usageRemaining, usagePercent,
    resetAtIso, resetInMs, cooldownMinutes, subscription: data.subscription,
  };
}

// 3) Countdown helper: onTick receives remaining ms, onComplete called at end
function startCountdown(resetAtIso: string | null, onTick?: (ms: number) => void, onComplete?: () => void): (() => void) | null {
  if (!resetAtIso) { if (onComplete) onComplete(); return null; }
  const target = Date.parse(resetAtIso);
  if (Number.isNaN(target)) { if (onComplete) onComplete(); return null; }

  let stopped = false;
  const tick = () => {
    if (stopped) return;
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) {
      if (onTick) onTick(0);
      if (onComplete) onComplete();
      stopped = true;
    } else {
      if (onTick) onTick(diff);
      setTimeout(tick, 1000);
    }
  };
  tick();
  return () => { stopped = true; };
}

// 4) Main handler: parse -> evaluate -> call UI callbacks
function handleBackendRaw(raw: any, uiCallbacks: UiCallbacks): EvaluateAccessResult | { stopCountdown: (() => void) | null } {
  const data = parseBackendResponse(raw);
  const result = evaluateAccess(data);
  
  if (!data) {
    uiCallbacks.onDeny?.(result);
    return result;
  }

  if (uiCallbacks.showUsage) {
    uiCallbacks.showUsage({
      current: result.usageCurrent, limit: result.usageLimit,
      remaining: result.usageRemaining, percent: result.usagePercent
    });
  }

  if (!result.subscriptionValid) {
     uiCallbacks.onDeny?.({ ...result, reason: 'subscription_expired', message: 'Your subscription has expired.', action: 'renew' });
    return result;
  }

  if (result.allowed) {
    uiCallbacks.onAllow?.(result);
    return result;
  }

  uiCallbacks.onDeny?.(result);

  if (result.action === 'countdown' && result.resetAtIso) {
    const stopFn = startCountdown(result.resetAtIso, 
      (msLeft) => {
        uiCallbacks.onTick?.(msLeft);
        uiCallbacks.showCountdown?.(msLeft);
      }, 
      () => {
        uiCallbacks.onCooldownEnd?.();
        uiCallbacks.autoRefreshAfterCooldown?.();
      }
    );
    uiCallbacks.onCountdownStart?.(stopFn || (() => {}));
    return { stopCountdown: stopFn };
  }

  return result;
}

export { parseBackendResponse, evaluateAccess, startCountdown, handleBackendRaw };