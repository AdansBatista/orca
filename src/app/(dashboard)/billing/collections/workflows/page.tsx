'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Settings, MoreHorizontal, Users, CheckCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CollectionWorkflow {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  triggerDays: number;
  minBalance: number;
  patientType: string | null;
  stages: {
    id: string;
    stageNumber: number;
    name: string;
    daysOverdue: number;
  }[];
  _count: {
    accounts: number;
  };
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<CollectionWorkflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  async function fetchWorkflows() {
    setLoading(true);
    try {
      const res = await fetch('/api/collections/workflows');
      const data = await res.json();

      if (data.success) {
        setWorkflows(data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(workflowId: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/collections/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        fetchWorkflows();
      }
    } catch (error) {
      console.error('Failed to update workflow:', error);
    }
  }

  async function setAsDefault(workflowId: string) {
    try {
      const res = await fetch(`/api/collections/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });

      if (res.ok) {
        fetchWorkflows();
      }
    } catch (error) {
      console.error('Failed to set default:', error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/billing/collections">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Collection Workflows</h1>
          <p className="text-muted-foreground">
            Configure automated collection sequences
          </p>
        </div>
        <Button asChild>
          <Link href="/billing/collections/workflows/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Workflow
          </Link>
        </Button>
      </div>

      {/* Workflows List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading workflows...
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No workflows configured</h3>
              <p className="text-muted-foreground">
                Create your first collection workflow to automate follow-ups.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/billing/collections/workflows/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workflow
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Stages</TableHead>
                  <TableHead className="text-center">Active Accounts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/billing/collections/workflows/${workflow.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {workflow.name}
                          </Link>
                          {workflow.isDefault && (
                            <Badge variant="soft-primary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        {workflow.description && (
                          <p className="text-sm text-muted-foreground">
                            {workflow.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{workflow.triggerDays} days overdue</p>
                        <p className="text-muted-foreground">
                          Min: ${workflow.minBalance}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {workflow.stages.slice(0, 4).map((stage) => (
                          <Badge key={stage.id} variant="outline" className="text-xs">
                            {stage.name}
                          </Badge>
                        ))}
                        {workflow.stages.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{workflow.stages.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{workflow._count.accounts}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={workflow.isActive ? 'success' : 'secondary'}>
                        {workflow.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/billing/collections/workflows/${workflow.id}`}>
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/billing/collections/workflows/${workflow.id}/edit`}>
                              Edit Workflow
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => toggleActive(workflow.id, workflow.isActive)}
                          >
                            {workflow.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          {!workflow.isDefault && (
                            <DropdownMenuItem
                              onClick={() => setAsDefault(workflow.id)}
                            >
                              Set as Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            Delete Workflow
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
