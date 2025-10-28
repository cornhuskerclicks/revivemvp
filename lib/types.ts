export interface Profile {
  id: string
  email: string
  full_name: string | null
  created_at: string
  updated_at: string
}

export interface Android {
  id: string
  user_id: string
  name: string
  prompt: string
  business_context: BusinessContext | CoffeeDateContext | null
  created_at: string
  updated_at: string
}

export interface BusinessContext {
  businessName: string
  company_name?: string
  industry: string
  niche?: string
  targetAudience: string
  painPoints: string[]
  solution: string
  uniqueValue: string
  tone: string
}

export interface CoffeeDateContext {
  businessName: string
  company_name?: string
  androidName: string
  serviceType: string
  niche?: string
  shortService: string
  nicheQuestion: string
  valueProp: string
  calendarLink: string
  regionTone: string
  industryTraining: string
  website: string
  openingHours: string
  promiseLine: string
}

export interface Session {
  id: string
  user_id: string
  android_id: string
  title: string
  status: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  session_id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export interface TwilioAccount {
  id: string
  user_id: string
  account_sid: string
  auth_token: string
  phone_number: string | null
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface SMSCampaign {
  id: string
  user_id: string
  name: string
  status: "draft" | "active" | "paused" | "completed"
  twilio_phone_number: string | null
  batch_size: number
  total_leads: number
  sent: number
  delivered: number
  replies: number
  failed: number
  created_at: string
  updated_at: string
}

export interface CampaignContact {
  id: string
  campaign_id: string
  lead_name: string
  phone_number: string
  tags: string[]
  status: "pending" | "sent" | "delivered" | "replied" | "failed"
  last_message_at: string | null
  created_at: string
}

export interface SMSMessage {
  id: string
  campaign_id: string
  contact_id: string | null
  message_body: string
  message_type: string
  sequence_number: number | null
  direction: "inbound" | "outbound"
  status: "pending" | "sent" | "delivered" | "failed" | "received"
  twilio_sid: string | null
  error_message: string | null
  sent_at: string | null
  delivered_at: string | null
  created_at: string
}
