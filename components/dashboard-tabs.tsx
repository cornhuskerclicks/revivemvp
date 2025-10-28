"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Megaphone, Inbox, Sparkles, Settings } from "lucide-react"
import CampaignsTab from "@/components/tabs/campaigns-tab"
import InboxTab from "@/components/tabs/inbox-tab"
import DemoTab from "@/components/tabs/demo-tab"
import SettingsTab from "@/components/tabs/settings-tab"

interface DashboardTabsProps {
  campaigns: any[]
  androids: any[]
  twilioAccount: any
  inboxMessages: any[]
  userId: string
}

export default function DashboardTabs({
  campaigns,
  androids,
  twilioAccount,
  inboxMessages,
  userId,
}: DashboardTabsProps) {
  return (
    <Tabs defaultValue="campaigns" className="w-full">
      <TabsList className="glass glass-border mb-8 p-1 h-auto">
        <TabsTrigger
          value="campaigns"
          className="data-[state=active]:bg-aether data-[state=active]:text-white px-6 py-3"
        >
          <Megaphone className="h-4 w-4 mr-2" />
          Campaigns
        </TabsTrigger>
        <TabsTrigger value="inbox" className="data-[state=active]:bg-aether data-[state=active]:text-white px-6 py-3">
          <Inbox className="h-4 w-4 mr-2" />
          Inbox
        </TabsTrigger>
        <TabsTrigger value="demo" className="data-[state=active]:bg-aether data-[state=active]:text-white px-6 py-3">
          <Sparkles className="h-4 w-4 mr-2" />
          Demo
        </TabsTrigger>
        <TabsTrigger
          value="settings"
          className="data-[state=active]:bg-aether data-[state=active]:text-white px-6 py-3"
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="campaigns">
        <CampaignsTab campaigns={campaigns} userId={userId} />
      </TabsContent>

      <TabsContent value="inbox">
        <InboxTab messages={inboxMessages} />
      </TabsContent>

      <TabsContent value="demo">
        <DemoTab androids={androids} />
      </TabsContent>

      <TabsContent value="settings">
        <SettingsTab twilioAccount={twilioAccount} userId={userId} />
      </TabsContent>
    </Tabs>
  )
}
