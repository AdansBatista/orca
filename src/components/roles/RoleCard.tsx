'use client';

import Link from 'next/link';
import { Shield, Users, Lock, ChevronRight } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isSystem: boolean;
  permissions: string[];
  assignmentCount: number;
}

interface RoleCardProps {
  role: Role;
}

export function RoleCard({ role }: RoleCardProps) {
  return (
    <Link href={`/staff/roles/${role.id}`}>
      <Card
        variant="default"
        interactive
        className="group h-full transition-all duration-200 hover:shadow-md"
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              {role.isSystem ? (
                <Lock className="h-5 w-5" />
              ) : (
                <Shield className="h-5 w-5" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">
                  {role.name}
                </h3>
                {role.isSystem && (
                  <Badge variant="soft-primary" size="sm">
                    System
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {role.description || `Role code: ${role.code}`}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  <span>{role.permissions.length} permissions</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>{role.assignmentCount} users</span>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
