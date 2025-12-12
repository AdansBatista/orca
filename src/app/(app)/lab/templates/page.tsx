"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Copy,
  Pencil,
  Trash2,
  FileText,
  Building2,
  Package,
} from "lucide-react";
import Link from "next/link";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  PageHeader,
  PageContent,
  StatsRow,
} from "@/components/layout";
import { StatCard } from "@/components/ui/card";

// Mock data
const templates = [
  {
    id: "1",
    name: "Standard Hawley Retainer",
    description: "Basic Hawley retainer with wire and acrylic",
    vendor: "Ortho Lab Solutions",
    vendorCode: "OLS",
    itemCount: 1,
    isClinicWide: true,
    usageCount: 45,
    lastUsed: "2024-02-10",
  },
  {
    id: "2",
    name: "Clear Retainer Set (Upper/Lower)",
    description: "Clear Essix-style retainer pair",
    vendor: "Clear Aligner Co",
    vendorCode: "CAC",
    itemCount: 2,
    isClinicWide: true,
    usageCount: 38,
    lastUsed: "2024-02-09",
  },
  {
    id: "3",
    name: "RPE with Bands",
    description: "Rapid palatal expander with molar bands",
    vendor: "Precision Orthodontics",
    vendorCode: "PO",
    itemCount: 3,
    isClinicWide: false,
    usageCount: 12,
    lastUsed: "2024-02-05",
  },
  {
    id: "4",
    name: "Indirect Bonding Tray",
    description: "Custom indirect bonding setup",
    vendor: "Ortho Lab Solutions",
    vendorCode: "OLS",
    itemCount: 1,
    isClinicWide: true,
    usageCount: 28,
    lastUsed: "2024-02-08",
  },
];

export default function LabTemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Order Templates"
        compact
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Lab", href: "/lab" },
          { label: "Templates" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                className="pl-9 w-64"
                inputSize="sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Order Template</DialogTitle>
                  <DialogDescription>
                    Create a reusable template for common lab orders
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <FormField label="Template Name" required>
                    <Input placeholder="e.g., Standard Hawley Retainer" />
                  </FormField>
                  <FormField label="Description">
                    <Textarea placeholder="Describe what this template is used for..." />
                  </FormField>
                  <FormField label="Default Vendor">
                    <Input placeholder="Select vendor..." />
                  </FormField>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreateOpen(false)}>
                    Create Template
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
                <p className="text-xs text-muted-foreground">Total Templates</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
              <div className="icon-container">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Clinic-Wide</p>
                <p className="text-2xl font-bold">
                  {templates.filter((t) => t.isClinicWide).length}
                </p>
              </div>
              <div className="icon-container-accent">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="success">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Uses</p>
                <p className="text-2xl font-bold">
                  {templates.reduce((sum, t) => sum + t.usageCount, 0)}
                </p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-success-100 p-2 text-success-600">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </StatCard>
        </StatsRow>

        {/* Templates Table */}
        <Card variant="bento">
          <CardHeader>
            <CardTitle>All Templates</CardTitle>
            <CardDescription>
              Reusable order templates for common lab work
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="text-xs h-9">Template</TableHead>
                    <TableHead className="text-xs h-9">Vendor</TableHead>
                    <TableHead className="text-xs h-9">Items</TableHead>
                    <TableHead className="text-xs h-9">Scope</TableHead>
                    <TableHead className="text-xs h-9">Uses</TableHead>
                    <TableHead className="text-xs h-9">Last Used</TableHead>
                    <TableHead className="text-xs h-9 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id} className="h-14">
                      <TableCell>
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {template.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] bg-gradient-accent text-white">
                              {template.vendorCode}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            {template.vendor}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" size="sm">
                          {template.itemCount} item{template.itemCount > 1 ? "s" : ""}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={template.isClinicWide ? "success" : "soft-primary"}
                          size="sm"
                        >
                          {template.isClinicWide ? "Clinic-wide" : "Personal"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{template.usageCount}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {template.lastUsed}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/lab/orders/new?template=${template.id}`}>
                                <Package className="h-4 w-4 mr-2" />
                                Use Template
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}
