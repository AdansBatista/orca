"use client";

import { useState } from "react";
import {
  Settings,
  Plug,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Truck,
  ScanLine,
  Building2,
  Bell,
  Shield,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { ListItem, ListItemTitle, ListItemDescription } from "@/components/ui/list-item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PageHeader,
  PageContent,
  DashboardGrid,
} from "@/components/layout";

// Mock integration data
const integrations = [
  {
    type: "FEDEX_SHIPPING",
    name: "FedEx Shipping Integration",
    description: "Automatic shipment tracking for FedEx packages",
    category: "SHIPPING",
    enabled: true,
    status: "CONNECTED",
    lastSync: "10 minutes ago",
    icon: Truck,
  },
  {
    type: "UPS_SHIPPING",
    name: "UPS Shipping Integration",
    description: "Track UPS shipments automatically",
    category: "SHIPPING",
    enabled: false,
    status: "NOT_CONFIGURED",
    lastSync: null,
    icon: Truck,
  },
  {
    type: "ITERO_SCANNER",
    name: "iTero Scanner Integration",
    description: "Import digital impressions directly from iTero scanners",
    category: "SCANNER",
    enabled: true,
    status: "CONNECTED",
    lastSync: "2 hours ago",
    icon: ScanLine,
  },
  {
    type: "THREESHAPE_SCANNER",
    name: "3Shape Scanner Integration",
    description: "Connect with 3Shape TRIOS scanners",
    category: "SCANNER",
    enabled: false,
    status: "NOT_CONFIGURED",
    lastSync: null,
    icon: ScanLine,
  },
  {
    type: "LAB_PORTAL",
    name: "Lab Portal Integration",
    description: "Direct connection to lab vendor portals",
    category: "LAB",
    enabled: true,
    status: "CONNECTED",
    lastSync: "30 minutes ago",
    icon: Building2,
  },
];

const notificationSettings = [
  {
    id: "order_submitted",
    label: "Order Submitted",
    description: "When an order is submitted to a lab",
    enabled: true,
  },
  {
    id: "order_shipped",
    label: "Order Shipped",
    description: "When an order ships from the lab",
    enabled: true,
  },
  {
    id: "order_delivered",
    label: "Order Delivered",
    description: "When an order is delivered",
    enabled: true,
  },
  {
    id: "order_overdue",
    label: "Order Overdue",
    description: "When an order passes its due date",
    enabled: true,
  },
  {
    id: "remake_requested",
    label: "Remake Requested",
    description: "When a remake is requested",
    enabled: true,
  },
  {
    id: "contract_expiring",
    label: "Contract Expiring",
    description: "When a vendor contract is expiring soon",
    enabled: false,
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "CONNECTED":
      return <Badge variant="success" size="sm" dot>Connected</Badge>;
    case "ERROR":
      return <Badge variant="destructive" size="sm" dot>Error</Badge>;
    case "PENDING_SETUP":
      return <Badge variant="warning" size="sm" dot>Pending Setup</Badge>;
    default:
      return <Badge variant="soft-primary" size="sm">Not Configured</Badge>;
  }
}

export default function LabSettingsPage() {
  const [selectedTab, setSelectedTab] = useState("integrations");
  const [configureDialog, setConfigureDialog] = useState<string | null>(null);

  return (
    <>
      <PageHeader
        title="Lab Settings"
        compact
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Lab", href: "/lab" },
          { label: "Settings" },
        ]}
        actions={
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
            Sync All
          </Button>
        }
      />

      <PageContent density="comfortable">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="integrations" className="gap-2">
              <Plug className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="integrations">
            <DashboardGrid>
              {/* Shipping Integrations */}
              <DashboardGrid.Half>
                <Card variant="bento" className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary-500" />
                      <div>
                        <CardTitle>Shipping Carriers</CardTitle>
                        <CardDescription>Track shipments automatically</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {integrations
                      .filter((i) => i.category === "SHIPPING")
                      .map((integration) => (
                        <ListItem
                          key={integration.type}
                          variant="bordered"
                          leading={
                            <div className={`p-2 rounded-lg ${
                              integration.enabled ? "bg-success-100" : "bg-muted"
                            }`}>
                              <integration.icon className={`h-5 w-5 ${
                                integration.enabled ? "text-success-600" : "text-muted-foreground"
                              }`} />
                            </div>
                          }
                          trailing={
                            <div className="flex items-center gap-2">
                              {getStatusBadge(integration.status)}
                              <Dialog
                                open={configureDialog === integration.type}
                                onOpenChange={(open) =>
                                  setConfigureDialog(open ? integration.type : null)
                                }
                              >
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    Configure
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Configure {integration.name}</DialogTitle>
                                    <DialogDescription>
                                      Enter your API credentials
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <FormField label="API Key" required>
                                      <Input type="password" placeholder="Enter API key" />
                                    </FormField>
                                    <FormField label="Account Number" required>
                                      <Input placeholder="Enter account number" />
                                    </FormField>
                                    <div className="flex items-center gap-2">
                                      <Switch id="enabled" defaultChecked={integration.enabled} />
                                      <Label htmlFor="enabled">Enable integration</Label>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => setConfigureDialog(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button onClick={() => setConfigureDialog(null)}>
                                      Save Configuration
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          }
                        >
                          <ListItemTitle>{integration.name}</ListItemTitle>
                          <ListItemDescription>{integration.description}</ListItemDescription>
                          {integration.lastSync && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last sync: {integration.lastSync}
                            </p>
                          )}
                        </ListItem>
                      ))}
                  </CardContent>
                </Card>
              </DashboardGrid.Half>

              {/* Scanner Integrations */}
              <DashboardGrid.Half>
                <Card variant="bento" className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ScanLine className="h-5 w-5 text-accent-500" />
                      <div>
                        <CardTitle>Scanner Integrations</CardTitle>
                        <CardDescription>Import digital impressions</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {integrations
                      .filter((i) => i.category === "SCANNER")
                      .map((integration) => (
                        <ListItem
                          key={integration.type}
                          variant="bordered"
                          leading={
                            <div className={`p-2 rounded-lg ${
                              integration.enabled ? "bg-accent-100" : "bg-muted"
                            }`}>
                              <integration.icon className={`h-5 w-5 ${
                                integration.enabled ? "text-accent-600" : "text-muted-foreground"
                              }`} />
                            </div>
                          }
                          trailing={
                            <div className="flex items-center gap-2">
                              {getStatusBadge(integration.status)}
                              <Button variant="outline" size="sm">
                                Configure
                              </Button>
                            </div>
                          }
                        >
                          <ListItemTitle>{integration.name}</ListItemTitle>
                          <ListItemDescription>{integration.description}</ListItemDescription>
                          {integration.lastSync && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last sync: {integration.lastSync}
                            </p>
                          )}
                        </ListItem>
                      ))}
                  </CardContent>
                </Card>
              </DashboardGrid.Half>

              {/* Lab Portal Integration */}
              <DashboardGrid.FullWidth>
                <Card variant="bento">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary-500" />
                      <div>
                        <CardTitle>Lab Portal Integration</CardTitle>
                        <CardDescription>Connect directly to lab vendor portals</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {integrations
                      .filter((i) => i.category === "LAB")
                      .map((integration) => (
                        <ListItem
                          key={integration.type}
                          variant="bordered"
                          leading={
                            <div className={`p-2 rounded-lg ${
                              integration.enabled ? "bg-primary-100" : "bg-muted"
                            }`}>
                              <integration.icon className={`h-5 w-5 ${
                                integration.enabled ? "text-primary-600" : "text-muted-foreground"
                              }`} />
                            </div>
                          }
                          trailing={
                            <div className="flex items-center gap-3">
                              {getStatusBadge(integration.status)}
                              <Button variant="outline" size="sm">
                                <RefreshCw className="h-4 w-4" />
                                Sync Now
                              </Button>
                              <Button variant="outline" size="sm">
                                Configure
                              </Button>
                            </div>
                          }
                        >
                          <ListItemTitle>{integration.name}</ListItemTitle>
                          <ListItemDescription>{integration.description}</ListItemDescription>
                          {integration.lastSync && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last sync: {integration.lastSync}
                            </p>
                          )}
                        </ListItem>
                      ))}
                  </CardContent>
                </Card>
              </DashboardGrid.FullWidth>
            </DashboardGrid>
          </TabsContent>

          <TabsContent value="notifications">
            <Card variant="bento">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure which lab events trigger notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {notificationSettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/50"
                  >
                    <div>
                      <p className="font-medium">{setting.label}</p>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    <Switch defaultChecked={setting.enabled} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card variant="bento">
              <CardHeader>
                <CardTitle>Lab Preferences</CardTitle>
                <CardDescription>
                  Configure default settings for lab operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Default Turnaround Days">
                    <Input type="number" defaultValue="7" />
                  </FormField>
                  <FormField label="Rush Order Lead Time (days)">
                    <Input type="number" defaultValue="3" />
                  </FormField>
                  <FormField label="Due Date Warning (days before)">
                    <Input type="number" defaultValue="3" />
                  </FormField>
                  <FormField label="Pickup Reminder (days after delivery)">
                    <Input type="number" defaultValue="2" />
                  </FormField>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <h4 className="font-medium mb-4">Default Behaviors</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-acknowledge orders</p>
                        <p className="text-sm text-muted-foreground">
                          Automatically acknowledge orders when submitted
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Patient notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Send automatic notifications to patients on status changes
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Quality inspection required</p>
                        <p className="text-sm text-muted-foreground">
                          Require quality inspection before marking orders complete
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button>Save Preferences</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContent>
    </>
  );
}
