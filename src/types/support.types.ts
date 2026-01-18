/**
 * Support Types
 * Types for support ticket system
 */

export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type SupportTicketCategory =
  | "technical"
  | "billing"
  | "account"
  | "data"
  | "verification"
  | "other";

export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";

export interface SupportTicket {
  id: string;
  supplierId: string;
  subject: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  description: string;
  attachments?: SupportAttachment[];
  messages: SupportMessage[];
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: "supplier" | "support" | "system";
  message: string;
  attachments?: SupportAttachment[];
  createdAt: string;
}

export interface SupportAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface SupportTicketFilter {
  status?: SupportTicketStatus[];
  category?: SupportTicketCategory[];
  priority?: SupportTicketPriority[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateSupportTicketRequest {
  subject: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  description: string;
  attachments?: File[];
}
