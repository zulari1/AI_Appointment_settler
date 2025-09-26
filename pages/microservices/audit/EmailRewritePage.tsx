import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ICONS } from '../../../constants';
import SubPageHeader from '../../../components/SubPageHeader';
import ActionNotification from '../../../components/ActionNotification';

// --- State Management Service (as per blueprint) ---
// This class manages the stateful interaction with the n8n webhook, particularly the resumeUrl.
class EmailRewriterService {
  activeResumeUrl: string | null = null;
  sessionId: string = Date.now().toString();

  async generateEmail(emailData: any) {
    this.startNewEmail(); // Reset session for a new generation
    try {
      const payload = {
        session_id: this.sessionId,
        email_type: emailData.type,
        tone: emailData.tone,
        recipient_email: emailData.recipientEmail,
        recipient_name: emailData.recipientName,
        instructions: emailData.instructions,
        user_email: emailData.userEmail,
        timestamp: new Date().toISOString()
      };

      const response = await fetch('https://zclari.app.n8n.cloud/webhook/ai-email-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': this.sessionId },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      
      const result = await response.json();
      const draft = Array.isArray(result) ? result[0] : result;
      
      if (!draft || !draft.resumeUrl) throw new Error("Invalid response from generation webhook.");

      this.activeResumeUrl = draft.resumeUrl;
      return {
        subject: draft.subject,
        body: draft.body,
        message: draft.message_for_user,
        confidence: draft.confidence_score,
        resumeUrl: draft.resumeUrl,
        type: draft.type,
      };

    } catch (error: any) {
      console.error('Email generation failed:', error);
      throw new Error(`Failed to generate email: ${error.message}`);
    }
  }

  async submitFeedback(decision: 'approve' | 'revise', feedback = '') {
    if (!this.activeResumeUrl) {
      throw new Error('No active resume URL found. Please generate an email first.');
    }
  
    try {
      console.log('=== SUBMITTING FEEDBACK ===');
      console.log('Decision:', decision);
      console.log('Feedback:', feedback);
  
      const formData = new FormData();
      formData.append('decision', decision);
      formData.append('feedback', feedback || '');
      formData.append('session_id', this.sessionId);
  
      const response = await fetch(this.activeResumeUrl, {
        method: 'POST',
        mode: 'cors',
        body: formData
      });
  
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
  
      const result = await response.json();
      console.log('=== RESUME URL RESPONSE ===');
      console.log('Raw result:', result);
  
      const data = Array.isArray(result) ? result[0] : result;
  
      // CRITICAL FIX: Correct response type detection based on YOUR actual response formats
  
      // RESPONSE TYPE 1: Email Sent (when user approves)
      // Your actual format: { "type": "sent", "message": "...", "tracking_id": "...", "sent_at": "..." }
      if (data.type === 'sent') {
        console.log('Response type: EMAIL SENT');
        return {
          responseType: 'sent',
          status: 'sent',
          data: {
            message: data.message,
            tracking_id: data.tracking_id,
            sent_at: data.sent_at
          }
        };
      }
  
      // RESPONSE TYPE 2: Email Revision (when user requests changes)
      // Your actual format: { "subject": "...", "body": "...", "resumeUrl": "...", "type": "rewrite email" }
      if (data.subject && data.body && data.type === 'rewrite email') {
        console.log('Response type: EMAIL REVISION');
        
        // Update resume URL for next iteration
        this.activeResumeUrl = data.resumeUrl;
        
        return {
          responseType: 'revised',
          status: 'revised',
          subject: data.subject,
          body: data.body,
          message: data.message_for_user,
          confidence: data.confidence_score,
          resumeUrl: data.resumeUrl,
          type: data.type
        };
      }
  
      // Handle unexpected response format
      console.error('Unknown response format:', data);
      throw new Error(`Unknown response format from resume URL. Received: ${JSON.stringify(data)}`);
  
    } catch (error: any) {
      console.error('=== SUBMIT FEEDBACK ERROR ===');
      console.error(error);
      throw error;
    }
  }

  async testResumeUrl() {
    if (!this.activeResumeUrl) {
      throw new Error('No active resume URL found.');
    }
    try {
      const response = await fetch(this.activeResumeUrl, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });
      if(!response.ok) throw new Error(`Test request failed: ${response.status}`);
      const result = await response.json();
      console.log('Resume URL test response:', result);
      return result;
    } catch (error: any) {
      console.error('Resume URL test failed:', error);
      throw error;
    }
  }

  startNewEmail() {
    this.activeResumeUrl = null;
    this.sessionId = Date.now().toString();
  }
}

// --- UI Components ---
const MotionDiv = motion.div as any;
const Spinner: React.FC<{ size?: 'sm' | 'lg', message?: string }> = ({ size = 'lg', message }) => (
    <div className={`flex items-center justify-center gap-2 ${size === 'lg' ? 'py-12' : ''}`}>
        <svg className={`animate-spin ${size === 'lg' ? 'h-8 w-8' : 'h-5 w-5'} text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {size === 'lg' && <span className="text-lg">{message || 'Processing...'}</span>}
        {size === 'sm' && message && <span>{message}</span>}
    </div>
);

const PerformanceDashboard: React.FC = () => (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
        <h3 className="text-xl font-bold text-white text-center mb-4">📊 Email Rewriter Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-white">124</p><p className="text-xs text-dark-text-secondary">Emails Generated</p></div>
            <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-white">92%</p><p className="text-xs text-dark-text-secondary">Approval Rate</p></div>
            <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-white">1.2</p><p className="text-xs text-dark-text-secondary">Avg Revisions</p></div>
            <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-green-400">34%</p><p className="text-xs text-dark-text-secondary">Open Rate</p></div>
            <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-green-400">12%</p><p className="text-xs text-dark-text-secondary">Reply Rate</p></div>
            <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-green-400">4%</p><p className="text-xs text-dark-text-secondary">Meeting Rate</p></div>
        </div>
    </div>
);


const EmailRewritePage: React.FC = () => {
    const emailService = useRef(new EmailRewriterService());
    const [status, setStatus] = useState<'idle' | 'generating' | 'reviewing' | 'revising' | 'sending' | 'sent' | 'failed'>('idle');
    const [generatedEmail, setGeneratedEmail] = useState<any>(null);
    const [showRevisionPanel, setShowRevisionPanel] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [sentConfirmation, setSentConfirmation] = useState<any>(null);
    const [formData, setFormData] = useState({
        type: 'Cold Outreach', tone: 'Professional', recipientEmail: '', recipientName: '', instructions: ''
    });

    const handleError = (error: Error, targetStatus: typeof status = 'failed') => {
        console.error('Email Rewriter Error:', error);
        setNotification({ message: error.message, type: 'error' });
        setStatus(targetStatus);
    };
    
    const handleGenerate = async (data: any) => {
        setFormData(data);
        setStatus('generating');
        setShowRevisionPanel(false);
        try {
            const result = await emailService.current.generateEmail({
                ...data,
                userEmail: 'demo@zulari.app'
            });
            setGeneratedEmail(result);
            setStatus('reviewing');
        } catch (error: any) {
            handleError(error);
        }
    };

    const handleApprove = async () => {
      console.log('=== APPROVE BUTTON CLICKED ===');
      setStatus('sending');
      
      try {
        const result = await emailService.current.submitFeedback('approve');
        console.log('Approve result:', result);
        
        // CRITICAL FIX: Check for correct responseType
        if (result.responseType === 'sent') {
          setSentConfirmation(result.data);
          setStatus('sent');
          setNotification({ 
            message: result.data?.message || 'Email sent successfully!', 
            type: 'success' 
          });
        } else if (result.responseType === 'revised') {
          // Handle edge case where approval returns revision (AI needs more info)
          setGeneratedEmail({
            subject: result.subject,
            body: result.body,
            message: result.message,
            confidence: result.confidence,
            resumeUrl: result.resumeUrl,
            type: result.type
          });
          setStatus('reviewing');
          setNotification({ 
            message: 'AI needs more information before sending', 
            type: 'success' 
          });
        } else {
          console.error('Unexpected response type for approval:', result);
          setNotification({ 
            message: 'Unexpected response from server', 
            type: 'error' 
          });
          setStatus('reviewing');
        }
      } catch (error: any) {
        console.error('=== APPROVE ERROR ===');
        console.error(error);
        handleError(error, 'reviewing');
      }
    };
      
    const handleRevise = async (feedback: string) => {
      console.log('=== REVISE BUTTON CLICKED ===');
      console.log('Feedback:', feedback);
      
      setStatus('revising');
      
      try {
        const result = await emailService.current.submitFeedback('revise', feedback);
        console.log('Revise result:', result);
        
        // CRITICAL FIX: Handle both possible responses for revisions
        if (result.responseType === 'revised') {
          // Normal case: AI returns revised email
          setGeneratedEmail({
            subject: result.subject,
            body: result.body,
            message: result.message,
            confidence: result.confidence,
            resumeUrl: result.resumeUrl,
            type: result.type
          });
          
          setShowRevisionPanel(false);
          setStatus('reviewing');
          setNotification({ 
            message: 'Email revised successfully!', 
            type: 'success' 
          });
        } else if (result.responseType === 'sent') {
          // Edge case: AI decides to send immediately after revision
          setSentConfirmation(result.data);
          setStatus('sent');
          setNotification({ 
            message: 'Email was finalized and sent!', 
            type: 'success' 
          });
        } else {
          console.error('Unexpected response type for revision:', result);
          setNotification({ 
            message: 'Unexpected response from server', 
            type: 'error' 
          });
          setStatus('reviewing');
        }
      } catch (error: any) {
        console.error('=== REVISE ERROR ===');
        console.error(error);
        handleError(error, 'reviewing');
      }
    };

    const handleTestResumeUrl = async () => {
        setStatus('revising'); // Show a loading state
        setNotification({message: 'Testing connection to resume URL...', type: 'success'});
        try {
            const result = await emailService.current.testResumeUrl();
            console.log("Test successful", result);
            setNotification({ message: 'Resume URL is working! Check console for details.', type: 'success' });
        } catch (error: any) {
            handleError(error, 'reviewing');
        } finally {
            if (status === 'revising') setStatus('reviewing');
        }
    }

    const handleReset = () => {
        emailService.current.startNewEmail();
        setStatus('idle');
        setGeneratedEmail(null);
        setShowRevisionPanel(false);
        setSentConfirmation(null);
        setFormData({ type: 'Cold Outreach', tone: 'Professional', recipientEmail: '', recipientName: '', instructions: '' });
    };

    const isLoading = ['generating', 'revising', 'sending'].includes(status);

    const renderContent = () => {
        if (isLoading) return <Spinner message={status.charAt(0).toUpperCase() + status.slice(1) + '...'}/>;
        
        switch (status) {
            case 'idle':
            case 'failed':
                return <GenerationWorkspace onGenerate={handleGenerate} isLoading={isLoading} initialData={formData} />;
            case 'reviewing':
                return (
                    <div className="space-y-4">
                        <EmailPreview email={generatedEmail} onApprove={handleApprove} onRequestChanges={() => setShowRevisionPanel(s => !s)} onRegenerate={handleReset} onTest={handleTestResumeUrl} isLoading={isLoading} />
                        <AnimatePresence>
                            {showRevisionPanel && <RevisionPanel onRevise={handleRevise} onCancel={() => setShowRevisionPanel(false)} isLoading={isLoading} />}
                        </AnimatePresence>
                    </div>
                );
            case 'sent':
                return <ConfirmationPanel data={sentConfirmation} onReset={handleReset} email={formData.recipientEmail} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <SubPageHeader title="AI Email Rewriter" icon={ICONS.email} />
            <div className="text-center">
                 <h2 className="text-2xl font-bold text-white">Your Professional Email Assistant</h2>
                 <p className="text-dark-text-secondary">"Never sound unprofessional or awkward again. Write perfect emails in seconds."</p>
            </div>
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 md:p-8 max-w-3xl mx-auto min-h-[400px]">
                <AnimatePresence mode="wait">
                    <MotionDiv key={status} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                        {renderContent()}
                    </MotionDiv>
                </AnimatePresence>
            </div>
            <PerformanceDashboard />
        </div>
    );
};

// --- Child Components for EmailRewritePage ---

const GenerationWorkspace: React.FC<{ onGenerate: (data: any) => void, isLoading: boolean, initialData: any }> = ({ onGenerate, isLoading, initialData }) => {
    const [formData, setFormData] = useState(initialData);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate(formData);
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-semibold text-dark-text-secondary">Email Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border rounded p-2 mt-1 text-sm"><option>Cold Outreach</option><option>Follow-up</option><option>Sales Pitch</option><option>Apology</option></select>
                </div>
                 <div>
                    <label className="text-xs font-semibold text-dark-text-secondary">Tone & Style</label>
                    <select name="tone" value={formData.tone} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border rounded p-2 mt-1 text-sm"><option>Professional</option><option>Friendly</option><option>Formal</option><option>Persuasive</option></select>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <input name="recipientEmail" value={formData.recipientEmail} onChange={handleChange} type="email" placeholder="To: sarah@techcorp.com" required className="bg-dark-bg border border-dark-border rounded p-2 text-sm" />
                 <input name="recipientName" value={formData.recipientName} onChange={handleChange} type="text" placeholder="Name: Sarah Johnson, VP Marketing" required className="bg-dark-bg border border-dark-border rounded p-2 text-sm" />
            </div>
            <textarea name="instructions" value={formData.instructions} onChange={handleChange} rows={6} placeholder="Your email instructions/draft..." required className="w-full bg-dark-bg border border-dark-border rounded p-2 text-sm font-mono" />
            <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center bg-brand-primary hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg disabled:bg-slate-600">
                {isLoading ? <Spinner size="sm" message="Generating..."/> : '🚀 Generate Perfect Email'}
            </button>
        </form>
    );
};

const EmailPreview: React.FC<{ email: any, onApprove: () => void, onRequestChanges: () => void, onRegenerate: () => void, onTest: () => void, isLoading: boolean }> = ({ email, onApprove, onRequestChanges, onRegenerate, onTest, isLoading }) => {
    const confidence = Math.round(parseFloat(email.confidence || '0') * 100);
    
    return (
        <div className="space-y-4">
            <div className="bg-dark-bg p-4 rounded-lg border border-dark-border">
                <p className="text-xs font-semibold text-dark-text-secondary">Subject</p>
                <p className="font-bold text-white">{email.subject}</p>
                <div className="border-t border-dark-border my-3"></div>
                
                {/* Enhanced body display with better formatting for multi-variation responses */}
                <div className="prose prose-sm prose-invert max-w-none text-dark-text max-h-96 overflow-y-auto pr-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {email.body}
                    </ReactMarkdown>
                </div>
            </div>
            
            {/* AI Message Display */}
            <div className="bg-sky-900/50 border-l-4 border-sky-500 text-sky-200 p-3 rounded-r-lg text-sm">
                <span className="font-bold">🤖 AI Message:</span> {email.message}
            </div>
            
            {/* Confidence Score */}
            <div className="text-center font-bold text-lg">
                Confidence Score: <span className="text-green-400">{confidence}%</span>
            </div>
            
            {/* Resume URL Status (for debugging) */}
            {email.resumeUrl && (
                <div className="text-xs text-dark-text-secondary text-center">
                    Resume URL Active: Ready for next action
                </div>
            )}
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button 
                    onClick={onApprove} 
                    disabled={isLoading} 
                    className="bg-green-600 hover:bg-green-500 p-3 rounded-lg disabled:bg-slate-600 flex flex-col items-center justify-center"
                >
                    <span className="font-bold">✅ Approve & Send</span>
                </button>
                <button 
                    onClick={onRequestChanges} 
                    disabled={isLoading} 
                    className="bg-blue-600 hover:bg-blue-500 p-3 rounded-lg disabled:bg-slate-600 flex flex-col items-center justify-center"
                >
                    <span className="font-bold">✏️ Request Changes</span>
                </button>
                <button 
                    onClick={onTest} 
                    disabled={isLoading} 
                    className="bg-gray-600 hover:bg-gray-500 p-3 rounded-lg disabled:bg-slate-600 flex flex-col items-center justify-center"
                >
                    <span className="font-bold">🧪 Test URL</span>
                </button>
                <button 
                    onClick={onRegenerate} 
                    disabled={isLoading} 
                    className="bg-dark-bg hover:bg-dark-border p-3 rounded-lg disabled:bg-slate-600 flex flex-col items-center justify-center"
                >
                    <span className="font-bold">🔄 Start Over</span>
                </button>
            </div>
        </div>
    );
};

const RevisionPanel: React.FC<{ onRevise: (feedback: string) => void, onCancel: () => void, isLoading: boolean }> = ({ onRevise, onCancel, isLoading }) => {
    const [feedback, setFeedback] = useState('');
    const quickFixes = ['Make it shorter and more concise', 'Make it more personal and friendly', 'Make it less salesy and more consultative', 'Add more urgency and call-to-action'];
    return (
        <MotionDiv initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="bg-dark-bg p-4 rounded-lg border border-dark-border space-y-3">
            <h4 className="font-bold text-white">What would you like to change?</h4>
            <div className="flex flex-wrap gap-2">{quickFixes.map(fix => <button key={fix} onClick={() => setFeedback(prev => `${prev} ${fix}.`)} className="bg-dark-border hover:bg-brand-primary/50 text-xs px-2 py-1 rounded-full">{fix}</button>)}</div>
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} placeholder="Or describe your specific changes..." className="w-full bg-dark-card border border-dark-border rounded p-2 text-sm" />
            <div className="flex justify-end gap-2">
                <button onClick={onCancel} disabled={isLoading} className="bg-dark-border hover:bg-gray-700 px-4 py-2 text-sm rounded-lg">Cancel</button>
                <button onClick={() => onRevise(feedback)} disabled={isLoading || !feedback.trim()} className="bg-brand-secondary hover:bg-emerald-500 text-white font-semibold px-4 py-2 text-sm rounded-lg disabled:bg-slate-600">
                    {isLoading ? <Spinner size="sm" message="Revising..."/> : '🔄 Revise Email'}
                </button>
            </div>
        </MotionDiv>
    );
};

const ConfirmationPanel: React.FC<{ data: any, onReset: () => void, email: string }> = ({ data, onReset, email }) => (
    <div className="bg-dark-bg p-6 rounded-lg border border-green-500/50 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">✅ EMAIL SENT SUCCESSFULLY!</h2>
        
        <div className="space-y-2">
            <p className="text-dark-text-secondary">
                <span className="font-semibold text-white">{data?.message || 'Email sent successfully!'}</span>
            </p>
            <p className="text-dark-text-secondary">
                Sent to: <span className="font-semibold text-white">{email}</span>
            </p>
            {data?.tracking_id && (
                <p className="text-dark-text-secondary">
                    Tracking ID: <span className="font-semibold text-white">{data.tracking_id}</span>
                </p>
            )}
            <p className="text-dark-text-secondary">
                Date: {new Date(data?.sent_at || Date.now()).toLocaleString()}
            </p>
        </div>
        
        <div className="pt-4 border-t border-dark-border flex justify-center gap-3">
            <button 
                onClick={onReset} 
                className="bg-dark-border hover:bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg"
            >
                ✍️ Write Another Email
            </button>
        </div>
    </div>
);


export default EmailRewritePage;