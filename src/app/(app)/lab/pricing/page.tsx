"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  DollarSign,
  Pencil,
  Trash2,
  Building2,
  Package,
  TrendingUp,
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
import {
  PageHeader,
  PageContent,
  StatsRow,
} from "@/components/layout";
import { StatCard } from "@/components/ui/card";

// Mock data
const feeSchedules = [
  {
    id: "1",
    product: "Hawley Retainer",
    vendor: "Ortho Lab Solutions",
    vendorCode: "OLS",
    basePrice: 125.0,
    rushUpcharge: 50,
    effectiveDate: "2024-01-01",
    endDate: null,
    isActive: true,
  },
  {
    id: "2",
    product: "Clear Retainer",
    vendor: "Ortho Lab Solutions",
    vendorCode: "OLS",
    basePrice: 85.0,
    rushUpcharge: 40,
    effectiveDate: "2024-01-01",
    endDate: null,
    isActive: true,
  },
  {
    id: "3",
    product: "RPE (Hyrax)",
    vendor: "Precision Orthodontics",
    vendorCode: "PO",
    basePrice: 275.0,
    rushUpcharge: 75,
    effectiveDate: "2024-01-01",
    endDate: null,
    isActive: true,
  },
  {
    id: "4",
    product: "Indirect Bonding Tray",
    vendor: "Ortho Lab Solutions",
    vendorCode: "OLS",
    basePrice: 195.0,
    rushUpcharge: 60,
    effectiveDate: "2024-01-01",
    endDate: null,
    isActive: true,
  },
  {
    id: "5",
    product: "Clear Aligner Set",
    vendor: "Clear Aligner Co",
    vendorCode: "CAC",
    basePrice: 350.0,
    rushUpcharge: 100,
    effectiveDate: "2024-01-01",
    endDate: null,
    isActive: true,
  },
  {
    id: "6",
    product: "Herbst Appliance",
    vendor: "Precision Orthodontics",
    vendorCode: "PO",
    basePrice: 425.0,
    rushUpcharge: 100,
    effectiveDate: "2024-01-01",
    endDate: null,
    isActive: true,
  },
];

export default function LabPricingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredSchedules = feeSchedules.filter(
    (s) =>
      s.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.vendor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalProducts = feeSchedules.length;
  const avgPrice = feeSchedules.reduce((sum, s) => sum + s.basePrice, 0) / totalProducts;
  const vendors = new Set(feeSchedules.map((s) => s.vendorCode)).size;

  return (
    <>
      <PageHeader
        title="Lab Pricing"
        compact
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Lab", href: "/lab" },
          { label: "Pricing" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search pricing..."
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
                  Add Pricing
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Fee Schedule</DialogTitle>
                  <DialogDescription>
                    Configure pricing for a lab product
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <FormField label="Vendor" required>
                    <Input placeholder="Select vendor..." />
                  </FormField>
                  <FormField label="Product" required>
                    <Input placeholder="Select product..." />
                  </FormField>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Base Price" required>
                      <Input type="number" placeholder="0.00" />
                    </FormField>
                    <FormField label="Rush Upcharge %">
                      <Input type="number" placeholder="50" />
                    </FormField>
                  </div>
                  <FormField label="Effective Date" required>
                    <Input type="date" />
                  </FormField>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreateOpen(false)}>
                    Save Pricing
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
                <p className="text-xs text-muted-foreground">Products Priced</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
              <div className="icon-container">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg. Price</p>
                <p className="text-2xl font-bold">${avgPrice.toFixed(0)}</p>
              </div>
              <div className="icon-container-accent">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="success">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Vendors</p>
                <p className="text-2xl font-bold">{vendors}</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-success-100 p-2 text-success-600">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="warning">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Rush Fee</p>
                <p className="text-2xl font-bold">
                  {(feeSchedules.reduce((sum, s) => sum + s.rushUpcharge, 0) / totalProducts).toFixed(0)}%
                </p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-warning-100 p-2 text-warning-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </StatCard>
        </StatsRow>

        {/* Pricing Table */}
        <Card variant="bento">
          <CardHeader>
            <CardTitle>Fee Schedules</CardTitle>
            <CardDescription>
              Product pricing by vendor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="text-xs h-9">Product</TableHead>
                    <TableHead className="text-xs h-9">Vendor</TableHead>
                    <TableHead className="text-xs h-9 text-right">Base Price</TableHead>
                    <TableHead className="text-xs h-9 text-right">Rush (+%)</TableHead>
                    <TableHead className="text-xs h-9">Effective Date</TableHead>
                    <TableHead className="text-xs h-9">Status</TableHead>
                    <TableHead className="text-xs h-9 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedules.map((schedule) => (
                    <TableRow key={schedule.id} className="h-12">
                      <TableCell className="font-medium">{schedule.product}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] bg-gradient-accent text-white">
                              {schedule.vendorCode}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            {schedule.vendor}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${schedule.basePrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="warning" size="sm">
                          +{schedule.rushUpcharge}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {schedule.effectiveDate}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={schedule.isActive ? "success" : "soft-primary"}
                          size="sm"
                          dot
                        >
                          {schedule.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Price History
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
