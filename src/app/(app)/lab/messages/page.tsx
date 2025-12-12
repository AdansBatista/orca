"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  MessageSquare,
  Send,
  Inbox,
  Archive,
  Building2,
  Clock,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { ListItem, ListItemTitle, ListItemDescription } from "@/components/ui/list-item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PageHeader,
  PageContent,
  DashboardGrid,
  StatsRow,
} from "@/components/layout";
import { StatCard } from "@/components/ui/card";

// Mock data
const messages = [
  {
    id: "1",
    vendor: "Ortho Lab Solutions",
    vendorCode: "OLS",
    subject: "Order #LAB-2024-0042 Status Update",
    preview: "The Hawley retainer is now in production and should ship by...",
    direction: "INBOUND",
    isRead: false,
    orderId: "LAB-2024-0042",
    createdAt: "2 hours ago",
  },
  {
    id: "2",
    vendor: "Precision Orthodontics",
    vendorCode: "PO",
    subject: "Re: Rush request for RPE",
    preview: "We can accommodate the rush request. Expected delivery is...",
    direction: "INBOUND",
    isRead: false,
    orderId: "LAB-2024-0041",
    createdAt: "4 hours ago",
  },
  {
    id: "3",
    vendor: "Clear Aligner Co",
    vendorCode: "CAC",
    subject: "Question about digital scan",
    preview: "I had a question about the scan quality for patient...",
    direction: "OUTBOUND",
    isRead: true,
    orderId: "LAB-2024-0040",
    createdAt: "Yesterday",
  },
  {
    id: "4",
    vendor: "Ortho Lab Solutions",
    vendorCode: "OLS",
    subject: "Tracking Update",
    preview: "Your order has been shipped via FedEx. Tracking number...",
    direction: "INBOUND",
    isRead: true,
    orderId: "LAB-2024-0038",
    createdAt: "2 days ago",
  },
];

export default function LabMessagesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("inbox");

  const inboundMessages = messages.filter((m) => m.direction === "INBOUND");
  const outboundMessages = messages.filter((m) => m.direction === "OUTBOUND");
  const unreadCount = messages.filter((m) => !m.isRead && m.direction === "INBOUND").length;

  const displayedMessages = selectedTab === "inbox" ? inboundMessages : outboundMessages;
  const filteredMessages = displayedMessages.filter(
    (m) =>
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Lab Messages"
        compact
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Lab", href: "/lab" },
          { label: "Messages" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                className="pl-9 w-64"
                inputSize="sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" />
                  New Message
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Compose Message</DialogTitle>
                  <DialogDescription>
                    Send a message to a lab vendor
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <FormField label="To (Vendor)" required>
                    <Input placeholder="Select vendor..." />
                  </FormField>
                  <FormField label="Related Order">
                    <Input placeholder="Search order..." />
                  </FormField>
                  <FormField label="Subject" required>
                    <Input placeholder="Message subject" />
                  </FormField>
                  <FormField label="Message" required>
                    <Textarea
                      placeholder="Type your message..."
                      rows={5}
                    />
                  </FormField>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsComposeOpen(false)}>
                    <Send className="h-4 w-4" />
                    Send
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <PageContent density="comfortable">
        {/* Stats */}
        <StatsRow className="mb-6">
          <StatCard accentColor="primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">{messages.length}</p>
              </div>
              <div className="icon-container">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="warning">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-warning-100 p-2 text-warning-600">
                <Inbox className="h-5 w-5" />
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Sent</p>
                <p className="text-2xl font-bold">{outboundMessages.length}</p>
              </div>
              <div className="icon-container-accent">
                <Send className="h-5 w-5" />
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="success">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Vendors</p>
                <p className="text-2xl font-bold">
                  {new Set(messages.map((m) => m.vendorCode)).size}
                </p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-success-100 p-2 text-success-600">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
          </StatCard>
        </StatsRow>

        {/* Messages */}
        <Card variant="bento">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Messages</CardTitle>
                <CardDescription>
                  Communication with lab vendors
                </CardDescription>
              </div>
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList>
                  <TabsTrigger value="inbox" className="gap-2">
                    <Inbox className="h-4 w-4" />
                    Inbox
                    {unreadCount > 0 && (
                      <Badge variant="destructive" size="sm">{unreadCount}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="sent" className="gap-2">
                    <Send className="h-4 w-4" />
                    Sent
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages found</p>
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <ListItem
                    key={message.id}
                    variant="bordered"
                    className={!message.isRead ? "bg-primary-50/50" : ""}
                    leading={
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-xs bg-gradient-accent text-white">
                          {message.vendorCode}
                        </AvatarFallback>
                      </Avatar>
                    }
                    trailing={
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {message.createdAt}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark as Read
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    }
                  >
                    <div className="flex items-center gap-2">
                      <ListItemTitle className={!message.isRead ? "font-semibold" : ""}>
                        {message.subject}
                      </ListItemTitle>
                      {!message.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary-500" />
                      )}
                    </div>
                    <ListItemDescription className="line-clamp-1">
                      {message.preview}
                    </ListItemDescription>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" size="sm">
                        {message.vendorCode}
                      </Badge>
                      {message.orderId && (
                        <Badge variant="soft-primary" size="sm">
                          {message.orderId}
                        </Badge>
                      )}
                    </div>
                  </ListItem>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}
