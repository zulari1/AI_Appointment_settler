import React, { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ICONS } from '../../constants';
import * as n8n from '../../services/n8nService';
import { ContactFormPayload } from '../../types';
import SubPageHeader from '../../components/SubPageHeader';
import ActionNotification from '../../components/ActionNotification';

// FIX: Cast motion.div to 'any' to work around a probable type conflict with React/Framer Motion versions.
const MotionDiv = motion.div as any;

const Spinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const ContactPage: React.FC = () => {
    const [formData, setFormData] = useState<Omit<ContactFormPayload, 'agencyEmail'>>({
        name: '', email: '', businessType: '', goal: '', challenge: '', message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        // Basic validation
        if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
            setNotification({ message: 'Please fill out all required fields.', type: 'error' });
            return;
        }
        setIsSubmitting(true);
        setNotification(null);
        try {
            const payload: ContactFormPayload = {
                ...formData,
                agencyEmail: 'zulariagency@gmail.com'
            };
            await n8n.submitContactForm(payload);
            setIsSubmitted(true);
        } catch (err: any) {
            setNotification({ message: err.message || 'An unexpected error occurred.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <SubPageHeader title="Contact Agency" icon={ICONS.email} />

            <div className="bg-dark-card border border-dark-border rounded-xl p-6 md:p-10 overflow-hidden">
                <AnimatePresence mode="wait">
                    {isSubmitted ? (
                        <MotionDiv
                            key="success"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center py-12"
                        >
                            <div className="inline-block p-4 bg-green-500/20 rounded-full mb-4 animate-confetti-burst">
                                <span className="text-4xl">✨</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Message Sent!</h2>
                            <p className="text-dark-text-secondary mt-2 max-w-md mx-auto">
                                Thank you for reaching out. We've received your inquiry and will get back to you within 24-48 business hours.
                            </p>
                        </MotionDiv>
                    ) : (
                        <MotionDiv
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-10"
                        >
                            {/* Left Column: Info */}
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Get in Touch</h2>
                                    <p className="text-dark-text-secondary mt-2">
                                        We’re here to support your business with tailored AI solutions. Whether you’re exploring opportunities or looking to discuss a potential project, our team is ready to help.
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <span className="text-brand-accent mt-1">{ICONS.email}</span>
                                        <div>
                                            <h3 className="font-semibold text-white">Contact Information</h3>
                                            <p className="text-sm text-dark-text-secondary">📧 Email: zulariagency@gmail.com</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-brand-accent mt-1">{ICONS.history}</span>
                                        <div>
                                            <h3 className="font-semibold text-white">Business Hours</h3>
                                            <p className="text-sm text-dark-text-secondary">🕒 Monday – Friday: 9:00 AM – 6:00 PM</p>
                                            <p className="text-sm text-dark-text-secondary">⏳ Response Time: Within 24–48 hours</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <InputField name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} />
                                <InputField name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} />
                                <InputField name="businessType" placeholder="Business Type" value={formData.businessType} onChange={handleChange} />
                                <InputField name="goal" placeholder="Goal You’d Like to Achieve" value={formData.goal} onChange={handleChange} />
                                <InputField name="challenge" placeholder="Key Challenge You’re Facing" value={formData.challenge} onChange={handleChange} />
                                <TextAreaField name="message" placeholder="Your Message" value={formData.message} onChange={handleChange} />
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex justify-center items-center bg-brand-primary hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-wait"
                                >
                                    {isSubmitting ? <Spinner /> : 'Send Message'}
                                </button>
                            </form>
                        </MotionDiv>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const InputField: React.FC<any> = (props) => (
    <input
        {...props}
        className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm placeholder-dark-text-secondary focus:ring-2 focus:ring-brand-primary focus:outline-none"
        required
    />
);
const TextAreaField: React.FC<any> = (props) => (
    <textarea
        {...props}
        rows={3}
        className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm placeholder-dark-text-secondary focus:ring-2 focus:ring-brand-primary focus:outline-none"
        required
    />
);

export default ContactPage;