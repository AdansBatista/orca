'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PermissionMatrix } from './PermissionMatrix';

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isSystem: boolean;
  permissions: string[];
}

interface RoleFormProps {
  role?: Role;
  mode: 'create' | 'edit';
}

export function RoleForm({ role, mode }: RoleFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [name, setName] = useState(role?.name || '');
  const [code, setCode] = useState(role?.code || '');
  const [description, setDescription] = useState(role?.description || '');
  const [permissions, setPermissions] = useState<string[]>(
    role?.permissions || []
  );

  const isSystem = role?.isSystem ?? false;

  // Generate code from name
  const generateCode = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate code for new roles
    if (mode === 'create') {
      setCode(generateCode(value));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Role name is required';
    }

    if (!code.trim()) {
      newErrors.code = 'Role code is required';
    } else if (!/^[a-z][a-z0-9_]*$/.test(code)) {
      newErrors.code =
        'Code must start with a letter and contain only lowercase letters, numbers, and underscores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    try {
      const url = mode === 'create' ? '/api/roles' : `/api/roles/${role?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          code: mode === 'create' ? code : undefined, // Code can't be changed
          description: description || null,
          permissions: isSystem ? undefined : permissions, // System roles can't change permissions
        }),
      });

      const result = await response.json();

      if (!result.success) {
        if (result.error?.code === 'DUPLICATE_CODE') {
          setErrors({ code: 'A role with this code already exists' });
          return;
        }
        throw new Error(result.error?.message || 'Failed to save role');
      }

      toast.success(
        mode === 'create' ? 'Role created successfully' : 'Role updated successfully'
      );
      router.push(`/staff/roles/${result.data.id}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save role'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* System role warning */}
      {isSystem && (
        <Alert className="border-warning-500/50 bg-warning-50 text-warning-900 dark:bg-warning-900/20 dark:text-warning-200">
          <AlertDescription>
            This is a system role. You can only edit the name and description.
            Permissions cannot be modified.
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Role Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Role Name" required error={errors.name}>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Senior Assistant"
              disabled={saving}
            />
          </FormField>

          <FormField
            label="Role Code"
            required
            error={errors.code}
            description={
              mode === 'create'
                ? 'A unique identifier for this role. Auto-generated from name.'
                : 'Role code cannot be changed after creation.'
            }
          >
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase())}
              placeholder="e.g., senior_assistant"
              disabled={saving || mode === 'edit'}
            />
          </FormField>

          <FormField label="Description" error={errors.description}>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose and responsibilities of this role..."
              rows={3}
              disabled={saving}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          {isSystem ? (
            <div className="text-sm text-muted-foreground">
              <p className="mb-4">
                System role permissions are managed at the system level and cannot
                be modified here.
              </p>
              <div className="flex flex-wrap gap-2">
                {permissions.map((perm) => (
                  <code
                    key={perm}
                    className="text-xs bg-muted px-2 py-1 rounded"
                  >
                    {perm}
                  </code>
                ))}
              </div>
            </div>
          ) : (
            <PermissionMatrix
              selectedPermissions={permissions}
              onChange={setPermissions}
              disabled={saving}
            />
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={saving}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {mode === 'create' ? 'Create Role' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
