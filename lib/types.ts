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
