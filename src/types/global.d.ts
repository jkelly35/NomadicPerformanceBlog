declare module '@emailjs/browser';
declare module 'unified';
declare module 'remark-parse';
declare module 'remark-rehype';
declare module 'rehype-stringify';
declare module 'rehype-slug';
declare module 'rehype-autolink-headings';

// User preferences for dashboard customization
export interface UserPreferences {
  dashboards: {
    main: boolean;      // Main dashboard overview
    nutrition: boolean; // Nutrition tracking dashboard
    training: boolean;  // Training/strength dashboard
    activities: boolean; // Activities/sends dashboard
    equipment: boolean; // Equipment management dashboard
  };
}

// Extended user metadata including preferences
export interface ExtendedUserMetadata {
  first_name?: string;
  last_name?: string;
  bio?: string;
  activities?: string[];
  preferences?: UserPreferences;
}
