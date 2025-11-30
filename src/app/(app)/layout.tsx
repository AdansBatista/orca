"use client";

import {
  Home,
  Users,
  Calendar,
  ClipboardList,
  DollarSign,
  FileText,
  MessageSquare,
  Settings,
  HelpCircle,
  BarChart3,
  UserCog,
} from "lucide-react";

import { AppShell } from "@/components/layout";
import { NavGroup } from "@/components/layout/Sidebar";

// Main application navigation
const appNavGroups: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: Home },
      { label: "Patients", href: "/patients", icon: Users },
      { label: "Schedule", href: "/schedule", icon: Calendar },
      { label: "Treatments", href: "/treatments", icon: ClipboardList },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Staff", href: "/staff", icon: UserCog },
      { label: "Billing", href: "/billing", icon: DollarSign },
      { label: "Reports", href: "/reports", icon: BarChart3 },
      { label: "Documents", href: "/documents", icon: FileText },
      { label: "Messages", href: "/messages", icon: MessageSquare },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "Help", href: "/help", icon: HelpCircle },
    ],
  },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
