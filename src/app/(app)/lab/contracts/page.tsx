"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  FileText,
  Pencil,
  Trash2,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
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
const contracts = [
  {
    id: "1",
    name: "Premium Partner Agreement",
    contractNumber: "OLS-2024-001",
    vendor: "Ortho Lab Solutions",
    vendorCode: "OLS",
    status: "ACTIVE",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    discountPercent: 15,
    autoRenew: true,
    daysUntilExpiry: 320,
  },
  {
    id: "2",
    name: "Annual Service Contract",
    contractNumber: "PO-2024-001",
    vendor: "Precision Orthodontics",
    vendorCode: "PO",
    status: "ACTIVE",
    startDate: "2024-03-01",
    endDate: "2025-02-28",
    discountPercent: 10,
    autoRenew: false,
    daysUntilExpiry: 380,
  },
  {
    id: "3",
    name: "Clear Aligner Partnership",
    contractNumber: "CAC-2023-001",
    vendor: "Clear Aligner Co",
    vendorCode: "CAC",
    status: "ACTIVE",
    startDate: "2023-06-01",
    endDate: "2024-05-31",
    discountPercent: 12,
    autoRenew: true,
    daysUntilExpiry: 108,
  },
  {
    id: "4",
    name: "Retainer Supply Agreement",
    contractNumber: "RW-2023-001",
    vendor: "RetainerWorks",
    vendorCode: "RW",
    status: "EXPIRED",
    startDate: "2023-01-01",
    endDate: "2023-12-31",
    discountPercent: 8,
    autoRenew: false,
    daysUntilExpiry: -42,
  },
];

function getStatusBadge(status: string, daysUntilExpiry: number) {
  if (status === "EXPIRED") {
    return <Badge variant="destructive" size="sm" dot>Expired</Badge>;
  }
  if (daysUntilExpiry <= 30) {
    return <Badge variant="warning" size="sm" dot>Expiring Soon</Badge>;
  }
  return <Badge variant="success" size="sm" dot>Active</Badge>;
}

export default function LabContractsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredContracts = contracts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeContracts = contracts.filter((c) => c.status === "ACTIVE");
  const expiringSoon = contracts.filter((c) => c.daysUntilExpiry > 0 && c.daysUntilExpiry <= 30);

  return (
    <>
      <PageHeader
        title="Lab Contracts"
        compact
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Lab", href: "/lab" },
          { label: "Contracts" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search contracts..."
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
                  New Contract
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Contract</DialogTitle>
                  <DialogDescription>
                    Add a new vendor contract
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <FormField label="Contract Name" required>
                    <Input placeholder="e.g., Premium Partner Agreement" />
                  </FormField>
                  <FormField label="Vendor" required>
                    <Input placeholder="Select vendor..." />
                  </FormField>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Start Date" required>
                      <Input type="date" />
                    </FormField>
                    <FormField label="End Date">
                      <Input type="date" />
                    </FormField>
                  </div>
                  <FormField label="Discount %">
                    <Input type="number" placeholder="0" />
                  </FormField>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreateOpen(false)}>
                    Create Contract
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
                <p className="text-xs text-muted-foreground">Total Contracts</p>
                <p className="text-2xl font-bold">{contracts.length}</p>
              </div>
              <div className="icon-container">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="success">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeContracts.length}</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-success-100 p-2 text-success-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="warning">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold">{expiringSoon.length}</p>
                <p className="text-xs text-warning-600 mt-1">Within 30 days</p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-warning-100 p-2 text-warning-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Vendors</p>
                <p className="text-2xl font-bold">
                  {new Set(contracts.map((c) => c.vendorCode)).size}
                </p>
              </div>
              <div className="icon-container-accent">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
          </StatCard>
        </StatsRow>

        {/* Contracts Table */}
        <Card variant="bento">
          <CardHeader>
            <CardTitle>All Contracts</CardTitle>
            <CardDescription>
              Manage vendor contracts and agreements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="text-xs h-9">Contract</TableHead>
                    <TableHead className="text-xs h-9">Vendor</TableHead>
                    <TableHead className="text-xs h-9">Status</TableHead>
                    <TableHead className="text-xs h-9">Period</TableHead>
                    <TableHead className="text-xs h-9">Discount</TableHead>
                    <TableHead className="text-xs h-9">Auto-Renew</TableHead>
                    <TableHead className="text-xs h-9 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => (
                    <TableRow key={contract.id} className="h-14">
                      <TableCell>
                        <div>
                          <p className="font-medium">{contract.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {contract.contractNumber}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] bg-gradient-accent text-white">
                              {contract.vendorCode}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{contract.vendor}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(contract.status, contract.daysUntilExpiry)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {contract.startDate} - {contract.endDate}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" size="sm">
                          {contract.discountPercent}% off
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {contract.autoRenew ? (
                          <Badge variant="success" size="sm">Yes</Badge>
                        ) : (
                          <Badge variant="soft-primary" size="sm">No</Badge>
                        )}
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
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Document
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
