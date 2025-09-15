
import React, { useState, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ICONS } from '../../../constants';
import SubPageHeader from '../../../components/SubPageHeader';
import ActionNotification from '../../../components/ActionNotification';

// Enhanced EmailRewriterService with debugging
class EmailRewriterService {
  activeResumeUrl: string | null = null;
  sessionId = Date.now().toString();

  // Debug helper to check network connectivity
  async checkNetworkConnectivity() {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts/1', {
        method: 'GET',
        mode: 'cors'
      });
      return response.ok;
    } catch (error) {
      console.error('Network connectivity test failed:', error);
      return false;
    }
  }

  // Debug helper to test webhook endpoint
  async testWebhookEndpoint() {
    try {
      console.log('🔍 Testing webhook endpoint...');
      
      // First test with OPTIONS request to check CORS
      const optionsResponse = await fetch('https://zilari.app.n8n.cloud/webhook/ai-email-rewrite', {
        method: 'OPTIONS',
        mode: 'cors',
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, X-Session-ID'
        }
      });
      
      console.log('OPTIONS response:', optionsResponse.status, optionsResponse.statusText);
      
      return {
        optionsOk: optionsResponse.ok,
        status: optionsResponse.status,
        headers: Object.fromEntries(optionsResponse.headers.entries())
      };
    } catch (error: any) {
      console.error('Webhook test failed:', error);
      return { error: error.message, type: error.name };
    }
  }

  async generateEmail(emailData: any) {
    this.startNewEmail();
    
    console.log('🚀 Starting email generation...');
    console.log('Session ID:', this.sessionId);
    console.log('Email data:', emailData);
    
    try {
      // Check network first
      const networkOk = await this.checkNetworkConnectivity();
      if (!networkOk) {
        throw new Error('Network connectivity issue detected. Please check your internet connection.');
      }

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

      console.log('📤 Sending payload:', payload);
      console.log('📍 URL:', 'https://zilari.app.n8n.cloud/webhook/ai-email-rewrite');

      const response = await fetch('https://zilari.app.n8n.cloud/webhook/ai-email-rewrite', {
        method: 'POST',
        mode: 'cors',
        headers: { 
          'Content-Type': 'application/json', 
          'X-Session-ID': this.sessionId,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText || response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Parsed response:', result);
      
      const draft = Array.isArray(result) ? result[0] : result;
      
      if (!draft || !draft.resumeUrl) {
        console.error('❌ Invalid response structure:', draft);
        throw new Error("Invalid response from generation webhook - missing resumeUrl");
      }

      this.activeResumeUrl = draft.resumeUrl;
      console.log('💾 Stored resume URL:', this.activeResumeUrl);
      
      return {
        subject: draft.subject,
        body: draft.body,
        message: draft.message_for_user,
        confidence: draft.confidence_score,
        resumeUrl: draft.resumeUrl,
        type: draft.type,
      };

    } catch (error: any) {
      console.error('💥 Email generation failed:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Provide more specific error messages
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Connection failed. This could be due to:\n' +
          '• CORS policy blocking the request\n' +
          '• Network connectivity issues\n' +
          '• The webhook endpoint being down\n' +
          '• Firewall or proxy blocking the request');
      } else if (error.name === 'AbortError') {
        throw new Error('Request timed out. The server may be slow to respond.');
      } else {
        throw error;
      }
    }
  }

  async submitFeedback(decision: 'approve' | 'revise', feedback = '') {
    if (!this.activeResumeUrl) {
      throw new Error('No active resume URL found. Please generate an email first.');
    }
  
    try {
      const payload = {
        decision: decision,
        feedback: feedback || '',
        session_id: this.sessionId,
        timestamp: new Date().toISOString()
      };
  
      console.log('=== SUBMITTING FEEDBACK ===');
      console.log('Resume URL:', this.activeResumeUrl);
      console.log('Payload:', payload);
  
      const response = await fetch(this.activeResumeUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify(payload)
      });
  
      console.log('Feedback response:', response.status, response.ok);
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Feedback error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
  
      const result = await response.json();
      console.log('Feedback result:', result);
      
      const data = Array.isArray(result) ? result[0] : result;
  
      if (data.status === 'sent') {
        return {
          status: 'sent',
          data: {
            message: data.message || 'Email sent successfully!',
            tracking_id: data.tracking_id,
            sent_at: data.sent_at
          }
        };
      }
  
      if (data.subject && data.body) {
        if (data.resumeUrl) {
          this.activeResumeUrl = data.resumeUrl;
        }
        
        return {
          status: 'revised',
          subject: data.subject,
          body: data.body,
          message: data.message_for_user || 'Email revised successfully',
          confidence: data.confidence_score || '0.92',
          resumeUrl: data.resumeUrl
        };
      }
  
      throw new Error('Unexpected response format');
  
    } catch (error: any) {
      console.error('=== SUBMIT FEEDBACK ERROR ===');
      console.error(error);
      throw error;
    }
  }

  startNewEmail() {
    this.activeResumeUrl = null;
    this.sessionId = Date.now().toString();
  }
}

// UI Componentsinterface SpinnerProps {
  size?: 'sm' | 'lg';
  message?: string;
}


const Spinner: React.FC<SpinnerProps> = ({ size = 'lg', message }) => (
  <div className={`flex items-center justify-center gap-2 ${size === 'lg' ? 'py-12' : ''}`}>
    <svg className={`animate-spin ${size === 'lg' ? 'h-8 w-8' : 'h-5 w-5'} text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    {size === 'lg' && <span className="text-lg">{message || 'Processing...'}</span>}
    {size === 'sm' && message && <span>{message}</span>}
  </div>
);

const DebugPanel: React.FC<{ service: EmailRewriterService, onRunTest: (test: string) => void }> = ({ service, onRunTest }) => (
  <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 mb-4">
    <h3 className="text-lg font-bold text-white mb-3">🔧 Debug Tools</h3>
    <div className="space-y-2">
      <button 
        onClick={() => onRunTest('connectivity')}
        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded text-sm mr-2"
      >
        Test Network Connectivity
      </button>
      <button 
        onClick={() => onRunTest('webhook')}
        className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded text-sm mr-2"
      >
        Test Webhook Endpoint
      </button>
      <button 
        onClick={() => onRunTest('cors')}
        className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-2 rounded text-sm"
      >
        Check CORS Policy
      </button>
    </div>
  </div>
);

const EmailRewritePage = () => {
  const emailService = useRef(new EmailRewriterService());
  const [status, setStatus] = useState<'idle' | 'generating' | 'reviewing' | 'revising' | 'sending' | 'sent' | 'failed'>('idle');
  const [generatedEmail, setGeneratedEmail] = useState<any>(null);
  const [showRevisionPanel, setShowRevisionPanel] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sentConfirmation, setSentConfirmation] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  const [formData, setFormData] = useState({
    type: 'Cold Outreach', 
    tone: 'Professional', 
    recipientEmail: 'test@example.com', 
    recipientName: 'John Doe', 
    instructions: 'Write a professional follow-up email about our previous meeting.'
  });

  const addDebugInfo = (info: any) => {
    setDebugInfo(prev => [...prev.slice(-4), { ...info, timestamp: new Date().toLocaleTimeString() }]);
  };

  const handleError = (error: any, targetStatus: any = 'failed') => {
    console.error('Email Rewriter Error:', error);
    setNotification({ message: error.message, type: 'error' });
    setStatus(targetStatus);
    addDebugInfo({ type: 'error', message: error.message });
  };

  const runDebugTest = async (testType: string) => {
    addDebugInfo({ type: 'info', message: `Running ${testType} test...` });
    
    try {
      switch (testType) {
        case 'connectivity':
          const networkOk = await emailService.current.checkNetworkConnectivity();
          addDebugInfo({ 
            type: networkOk ? 'success' : 'error', 
            message: `Network connectivity: ${networkOk ? 'OK' : 'FAILED'}` 
          });
          break;
          
        case 'webhook':
          const webhookTest = await emailService.current.testWebhookEndpoint();
          addDebugInfo({ 
            type: webhookTest.error ? 'error' : 'success', 
            message: webhookTest.error || `Webhook test: ${webhookTest.optionsOk ? 'OK' : 'FAILED'}` 
          });
          break;
          
        case 'cors':
          addDebugInfo({ 
            type: 'info', 
            message: 'Check browser console for CORS errors. Common issues: missing Access-Control headers' 
          });
          break;
      }
    } catch (error: any) {
      addDebugInfo({ type: 'error', message: `Test failed: ${error.message}` });
    }
  };
    
  const handleGenerate = async (data: any) => {
    setFormData(data);
    setStatus('generating');
    setShowRevisionPanel(false);
    addDebugInfo({ type: 'info', message: 'Starting email generation...' });
    
    try {
      const result = await emailService.current.generateEmail({
        ...data,
        userEmail: 'demo@zulari.app'
      });
      setGeneratedEmail(result);
      setStatus('reviewing');
      addDebugInfo({ type: 'success', message: 'Email generated successfully!' });
    } catch (error) {
      handleError(error);
    }
  };

  const handleApprove = async () => {
    setStatus('sending');
    addDebugInfo({ type: 'info', message: 'Approving and sending email...' });
    
    try {
      const result = await emailService.current.submitFeedback('approve');
      setSentConfirmation(result.data);
      setStatus('sent');
      setNotification({ message: result.data?.message || 'Email sent successfully!', type: 'success' });
      addDebugInfo({ type: 'success', message: 'Email sent successfully!' });
    } catch (error) {
      handleError(error, 'reviewing');
    }
  };
  
  const handleRevise = async (feedback: string) => {
    if (!feedback.trim()) {
      setNotification({ message: 'Please provide feedback for the revision.', type: 'error'});
      return;
    }
    
    setStatus('revising');
    addDebugInfo({ type: 'info', message: 'Revising email...' });
    
    try {
      const result = await emailService.current.submitFeedback('revise', feedback);
      setGeneratedEmail(result);
      setShowRevisionPanel(false);
      setStatus('reviewing');
      setNotification({ message: 'Email revised!', type: 'success' });
      addDebugInfo({ type: 'success', message: 'Email revised successfully!' });
    } catch (error) {
      handleError(error, 'reviewing');
    }
  };

  const handleReset = () => {
    emailService.current.startNewEmail();
    setStatus('idle');
    setGeneratedEmail(null);
    setShowRevisionPanel(false);
    setSentConfirmation(null);
    setDebugInfo([]);
    setFormData({ 
      type: 'Cold Outreach', 
      tone: 'Professional', 
      recipientEmail: 'test@example.com', 
      recipientName: 'John Doe', 
      instructions: 'Write a professional follow-up email about our previous meeting.' 
    });
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
            <EmailPreview 
              email={generatedEmail} 
              onApprove={handleApprove} 
              onRequestChanges={() => setShowRevisionPanel(s => !s)} 
              onRegenerate={handleReset} 
              isLoading={isLoading} 
            />
            {showRevisionPanel && (
              <RevisionPanel 
                onRevise={handleRevise} 
                onCancel={() => setShowRevisionPanel(false)} 
                isLoading={isLoading} 
              />
            )}
          </div>
        );
      case 'sent':
        return <ConfirmationPanel data={sentConfirmation} onReset={handleReset} email={formData.recipientEmail} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {notification && (
          <div className={`p-4 rounded-lg ${notification.type === 'error' ? 'bg-red-900 border border-red-600' : 'bg-green-900 border border-green-600'}`}>
            {notification.message}
          </div>
        )}
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">AI Email Rewriter - Debug Mode</h1>
          <p className="text-gray-300">Troubleshoot connection issues with enhanced logging</p>
        </div>

        {showDebugPanel && (
          <DebugPanel service={emailService.current} onRunTest={runDebugTest} />
        )}

        <div className="bg-gray-900 border border-gray-600 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Email Generator</h2>
            <button 
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm"
            >
              {showDebugPanel ? 'Hide' : 'Show'} Debug Panel
            </button>
          </div>
          
          <div key={status}>
            {renderContent()}
          </div>
        </div>

        {debugInfo.length > 0 && (
          <div className="bg-black border border-gray-600 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-3">🐛 Debug Log</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {debugInfo.map((info, idx) => (
                <div key={idx} className={`text-sm ${
                  info.type === 'error' ? 'text-red-400' : 
                  info.type === 'success' ? 'text-green-400' : 
                  'text-blue-400'
                }`}>
                  <span className="text-gray-400">[{info.timestamp}]</span> {info.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Child Components
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-300">Email Type</label>
          <select 
            name="type" 
            value={formData.type} 
            onChange={handleChange} 
            className="w-full bg-gray-800 border border-gray-600 rounded p-2 mt-1 text-sm text-white"
          >
            <option>Cold Outreach</option>
            <option>Follow-up</option>
            <option>Sales Pitch</option>
            <option>Apology</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-300">Tone & Style</label>
          <select 
            name="tone" 
            value={formData.tone} 
            onChange={handleChange} 
            className="w-full bg-gray-800 border border-gray-600 rounded p-2 mt-1 text-sm text-white"
          >
            <option>Professional</option>
            <option>Friendly</option>
            <option>Formal</option>
            <option>Persuasive</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input 
          name="recipientEmail" 
          value={formData.recipientEmail} 
          onChange={handleChange} 
          type="email" 
          placeholder="To: sarah@techcorp.com" 
          className="bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white" 
        />
        <input 
          name="recipientName" 
          value={formData.recipientName} 
          onChange={handleChange} 
          type="text" 
          placeholder="Name: Sarah Johnson, VP Marketing" 
          className="bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white" 
        />
      </div>
      <textarea 
        name="instructions" 
        value={formData.instructions} 
        onChange={handleChange} 
        rows={6} 
        placeholder="Your email instructions/draft..." 
        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm font-mono text-white" 
      />
      <button 
        onClick={handleSubmit}
        disabled={isLoading} 
        className="w-full flex justify-center items-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-600"
      >
        {isLoading ? <Spinner size="sm" message="Generating..."/> : '🚀 Generate Perfect Email'}
      </button>
    </div>
  );
};

const EmailPreview: React.FC<{ email: any, onApprove: () => void, onRequestChanges: () => void, onRegenerate: () => void, isLoading: boolean }> = ({ email, onApprove, onRequestChanges, onRegenerate, isLoading }) => {
  const confidence = Math.round(parseFloat(email.confidence || '0') * 100);
  
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
        <p className="text-xs font-semibold text-gray-300">Subject</p>
        <p className="font-bold text-white">{email.subject}</p>
        <div className="border-t border-gray-600 my-3"></div>
        <div className="text-gray-200 max-h-80 overflow-y-auto pr-2 whitespace-pre-wrap">
          {email.body}
        </div>
      </div>
      <div className="bg-blue-900/50 border-l-4 border-blue-500 text-blue-200 p-3 rounded-r-lg text-sm">
        <span className="font-bold">🤖 AI Message:</span> {email.message}
      </div>
      <div className="text-center font-bold text-lg">
        Confidence Score: <span className="text-green-400">{confidence}%</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button 
          onClick={onApprove} 
          disabled={isLoading} 
          className="bg-green-600 hover:bg-green-500 p-3 rounded-lg disabled:bg-gray-600 flex flex-col items-center justify-center"
        >
          <span className="font-bold">✅ Approve & Send</span>
        </button>
        <button 
          onClick={onRequestChanges} 
          disabled={isLoading} 
          className="bg-blue-600 hover:bg-blue-500 p-3 rounded-lg disabled:bg-gray-600 flex flex-col items-center justify-center"
        >
          <span className="font-bold">✏️ Request Changes</span>
        </button>
        <button 
          onClick={onRegenerate} 
          disabled={isLoading} 
          className="bg-gray-600 hover:bg-gray-500 p-3 rounded-lg disabled:bg-gray-400 flex flex-col items-center justify-center"
        >
          <span className="font-bold">🔄 Start Over</span>
        </button>
      </div>
    </div>
  );
};

const RevisionPanel: React.FC<{ onRevise: (feedback: string) => void, onCancel: () => void, isLoading: boolean }> = ({ onRevise, onCancel, isLoading }) => {
  const [feedback, setFeedback] = useState('');
  const quickFixes = [
    'Make it shorter and more concise', 
    'Make it more personal and friendly', 
    'Make it less salesy and more consultative', 
    'Add more urgency and call-to-action'
  ];
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-600 space-y-3">
      <h4 className="font-bold text-white">What would you like to change?</h4>
      <div className="flex flex-wrap gap-2">
        {quickFixes.map(fix => (
          <button 
            key={fix} 
            onClick={() => setFeedback(prev => `${prev} ${fix}.`)} 
            className="bg-gray-600 hover:bg-indigo-500 text-xs px-2 py-1 rounded-full text-white"
          >
            {fix}
          </button>
        ))}
      </div>
      <textarea 
        value={feedback} 
        onChange={e => setFeedback(e.target.value)} 
        rows={4} 
        placeholder="Or describe your specific changes..." 
        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm text-white" 
      />
      <div className="flex justify-end gap-2">
        <button 
          onClick={onCancel} 
          disabled={isLoading} 
          className="bg-gray-600 hover:bg-gray-500 px-4 py-2 text-sm rounded-lg text-white"
        >
          Cancel
        </button>
        <button 
          onClick={() => onRevise(feedback)} 
          disabled={isLoading || !feedback.trim()} 
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 text-sm rounded-lg disabled:bg-gray-600"
        >
          {isLoading ? <Spinner size="sm" message="Revising..."/> : '🔄 Revise Email'}
        </button>
      </div>
    </div>
  );
};

const ConfirmationPanel: React.FC<{ data: any, onReset: () => void, email: string }> = ({ data, onReset, email }) => (
  <div className="bg-gray-800 p-6 rounded-lg border border-green-500/50 text-center space-y-3">
    <h2 className="text-2xl font-bold text-white">✅ EMAIL SENT SUCCESSFULLY!</h2>
    <p className="text-gray-300">Sent to: <span className="font-semibold text-white">{email}</span></p>
    <p className="text-gray-300">Date: {new Date(data?.sent_at || Date.now()).toLocaleString()}</p>
    <div className="pt-4 border-t border-gray-600 flex justify-center gap-3">
      <button 
        onClick={onReset} 
        className="bg-gray-600 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg"
      >
        ✍️ Write Another Email
      </button>
    </div>
  </div>
);

export default EmailRewritePage;
