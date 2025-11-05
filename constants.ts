import type { Question } from './types';

export const WEBHOOK_URL = 'https://zuliri.app.n8n.cloud/webhook/Client_info';

export const STAGES = [
  "Welcome & Foundations",
  "Business Essence",
  "Products & Commerce",
  "Brand Identity",
  "Site Blueprint",
  "Goals & Logistics"
];

export const QUESTIONS: Question[] = [
  // Stage 0: Welcome
  {
    id: 'clientName',
    stage: 0,
    question: "Hello there! I’m thrilled to help you craft a stunning online presence for your Book Depot. Let’s make it reflect the magic of your stories. 🌟\n\nTo start, may I know your name?",
    reinforcement: "Perfect, {value}! It's a pleasure to work with you. Let's build something amazing.",
    placeholder: "e.g., Jane Doe",
    type: 'text',
    preview: "Knowing your name helps me personalize this entire experience for you."
  },
  // Stage 1: Business Essence
  {
    id: 'business.name',
    stage: 1,
    question: "What is the name of your wonderful book depot?",
    reinforcement: "{value}—a fantastic name! It has a great ring to it. We'll make it unforgettable.",
    placeholder: "e.g., The Reader's Nook",
    type: 'text',
    preview: "This will be the headline of your new website, your digital storefront sign."
  },
  {
    id: 'business.description',
    stage: 1,
    question: "Now, let's capture the soul of your store. In a sentence or two, how would you describe it to a new visitor? What makes it special?",
    reinforcement: "Beautifully put! That description creates such an inviting and unique image. We'll weave that personality right into the homepage.",
    placeholder: "e.g., A cozy, independent bookstore offering curated collections of new and classic literature...",
    type: 'textarea',
    preview: "This compelling 'elevator pitch' will be the first thing visitors read, drawing them in instantly."
  },
  {
    id: 'business.targetAudience',
    stage: 1,
    question: "Who is your ideal customer or reader? Picturing them helps us design an experience they'll love. 🎯",
    reinforcement: "Excellent insight! Knowing your audience is the secret to a website that truly connects and converts.",
    placeholder: "e.g., Avid fantasy readers, local families, university students.",
    type: 'text',
    preview: "We'll tailor the site's design, language, and features to appeal directly to these individuals."
  },
  {
    id: 'business.usp',
    stage: 1,
    question: "What makes your depot stand out from the rest? Do you specialize in certain genres, host events, or offer rare editions?",
    reinforcement: "That's a powerful differentiator! Highlighting what makes you unique is crucial for standing out in a crowded digital world.",
    placeholder: "e.g., We specialize in first-edition sci-fi and host weekly author signings.",
    type: 'text',
    preview: "These unique selling points will be featured prominently to attract your ideal customers and show them why you're the best choice."
  },
  // Stage 2: Products & Commerce
  {
    id: 'products.details',
    stage: 2,
    question: "Let's talk about your treasures! 📚 What kinds of books or products do you sell?",
    reinforcement: "What a fantastic selection! That variety will make for a very engaging online store.",
    placeholder: "e.g., New/used fiction, non-fiction, graphic novels, literary-themed gifts.",
    type: 'textarea',
    preview: "This helps us structure your product categories and search filters for a seamless browsing experience."
  },
  {
    id: 'products.ecommerce',
    stage: 2,
    question: "Would you like your website to include an online shopping feature (e-commerce) to sell your products directly?",
    reinforcement: "Great! An online store will open up a new world of possibilities and customers.",
    placeholder: "e.g., Yes, a full shopping cart and checkout.",
    type: 'text',
    preview: "Enabling e-commerce transforms your site from a brochure into a 24/7 sales engine."
  },
  // Stage 3: Brand Identity
  {
    id: 'branding.logo',
    stage: 3,
    question: "Do you have an existing logo? If so, could you describe it or provide a link? If not, no worries!",
    reinforcement: "Got it. A strong logo is the cornerstone of a brand's identity, and we'll make sure it shines.",
    placeholder: "e.g., An open book icon with our name in a serif font, or, 'I need a new one'.",
    type: 'text',
    preview: "Your logo will be a key element in the website's header and across all branding materials."
  },
  {
    id: 'branding.vibe',
    stage: 3,
    question: "Let's define your brand's aesthetic. What kind of vibe are you going for? ✨",
    reinforcement: "I love that direction! That vibe will inform all our design choices, creating a cohesive and immersive experience.",
    placeholder: "e.g., Classic & cozy, modern & minimal, or artistic & bold.",
    type: 'text',
    preview: "This choice will influence the colors, fonts, and imagery, ensuring your site has a distinct personality."
  },
  {
    id: 'branding.colors',
    stage: 3,
    question: "Building on that vibe, what colors come to mind? Think about the feeling you want to evoke.",
    reinforcement: "Excellent choices! Based on user psychology, those colors will create a feeling of comfort and intellect, perfect for a bookstore.",
    placeholder: "e.g., Deep burgundy, cream, and a dark forest green.",
    type: 'text',
    preview: "This color palette will define the look and feel of your entire website, from buttons to backgrounds."
  },
  // Stage 4: Site Blueprint
  {
    id: 'website.pages',
    stage: 4,
    question: "What pages are essential for your website? Think of it as the map for your visitors.",
    reinforcement: "A solid foundation! A clear structure makes it easy for visitors to find what they're looking for.",
    placeholder: "e.g., Home, About Us, Shop/Books, Events, Blog, Contact",
    type: 'text',
    preview: "This list will become the main navigation menu, guiding users through your digital story."
  },
  {
    id: 'website.features',
    stage: 4,
    question: "Are there any special features you'd like to add? Let's make your site interactive and engaging.",
    reinforcement: "Those are excellent features that will definitely enhance the user experience and keep people coming back!",
    placeholder: "e.g., Advanced book search, customer reviews, newsletter signup.",
    type: 'text',
    preview: "These features will transform your site from a simple page into an interactive hub for book lovers."
  },
  // Stage 5: Goals & Logistics
  {
    id: 'project.goals',
    stage: 5,
    question: "What is the single most important goal for your new website? Is it to increase online sales, attract more local foot traffic, or build a community?",
    reinforcement: "That's a clear and powerful goal. We'll design the entire site to help you achieve it, making every element work towards that purpose.",
    placeholder: "e.g., Increase our online book sales by 30% in the next year.",
    type: 'text',
    preview: "Every design and feature decision will be made with this core objective in mind."
  },
  {
    id: 'project.competitors',
    stage: 5,
    question: "Are there any websites (competitors or otherwise) you admire? What do you like or dislike about them?",
    reinforcement: "This is incredibly helpful. Analyzing others helps us identify opportunities to make your site even better and more unique.",
    placeholder: "e.g., I like the clean layout of Bookshop.org but find others too cluttered.",
    type: 'textarea',
    preview: "Your feedback will help us incorporate best practices while avoiding common pitfalls, ensuring a superior user experience."
  },
  {
    id: 'project.timeline',
    stage: 5,
    question: "To help with planning, do you have a target launch date in mind for the new website?",
    reinforcement: "Great, that gives us a target to aim for. We'll plan accordingly.",
    placeholder: "e.g., In about 3 months, or 'As soon as possible'.",
    type: 'text',
    preview: "A timeline helps us manage the project effectively and set realistic milestones."
  },
  {
    id: 'project.additionalInfo',
    stage: 5,
    question: "We're almost at the finish line! Is there anything else you'd like to share? Any special requests or brilliant ideas we haven't covered?",
    reinforcement: "Thank you for sharing that. It’s the little details that make a website truly special and personal.",
    placeholder: "e.g., I'd love a special page dedicated to local authors.",
    type: 'textarea',
    preview: "We'll make sure to consider this as we create the final plan for your amazing new site."
  },
];