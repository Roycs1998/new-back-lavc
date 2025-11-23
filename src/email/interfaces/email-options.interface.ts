export interface EmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  context: Record<string, any>;
  attachments?: any[];
  cc?: string | string[];
  bcc?: string | string[];
}
