export interface Question {
  id: string;
  stage: number;
  question: string;
  reinforcement: string;
  placeholder: string;
  type: 'text' | 'textarea' | 'email';
  preview: string;
}

export interface FormData {
  clientName: string;
  business: {
    name: string;
    description: string; // essence
    mission: string;
    targetAudience: string;
    usp: string; // unique selling points
  };
  products: {
    details: string; // types of books, etc.
    pricing: string;
    ecommerce: string; // online shopping feature
  };
  branding: {
    logo: string;
    colors: string;
    fonts: string;
    tone: string;
    vibe: string; // classic & cozy, modern & minimal etc.
  };
  website: {
    pages: string;
    features: string;
    integrations: string; // newsletter, etc.
  };
  content: {
    samples: string;
    seoKeywords: string;
    cta: string; // call to action
  };
  technical: {
    domain: string;
    hosting: string;
    responsive: string;
  },
  project: {
    goals: string;
    competitors: string;
    timeline: string;
    budget: string;
    additionalInfo: string;
  };
}

export interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
  preview?: string;
}