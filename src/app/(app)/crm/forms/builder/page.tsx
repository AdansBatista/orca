'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Type,
  AlignLeft,
  Hash,
  Mail,
  Phone,
  Calendar,
  List,
  CheckSquare,
  CircleDot,
  PenTool,
  FileUp,
  Heading,
  FileText,
} from 'lucide-react';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface FormFieldData {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: { value: string; label: string }[];
}

const fieldTypes = [
  { type: 'text', label: 'Text Input', icon: Type },
  { type: 'textarea', label: 'Text Area', icon: AlignLeft },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'select', label: 'Dropdown', icon: List },
  { type: 'multi_select', label: 'Multi-Select', icon: List },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'radio', label: 'Radio Buttons', icon: CircleDot },
  { type: 'signature', label: 'Signature', icon: PenTool },
  { type: 'file', label: 'File Upload', icon: FileUp },
  { type: 'section_header', label: 'Section Header', icon: Heading },
  { type: 'paragraph', label: 'Paragraph Text', icon: FileText },
];

const typeOptions = [
  { value: 'PATIENT_INFO', label: 'Patient Info' },
  { value: 'MEDICAL_HISTORY', label: 'Medical History' },
  { value: 'DENTAL_HISTORY', label: 'Dental History' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'CONSENT_TREATMENT', label: 'Treatment Consent' },
  { value: 'CONSENT_PRIVACY', label: 'Privacy Consent' },
  { value: 'CONSENT_PHOTO', label: 'Photo Consent' },
  { value: 'CONSENT_FINANCIAL', label: 'Financial Consent' },
  { value: 'CUSTOM', label: 'Custom' },
];

const categoryOptions = [
  { value: 'INTAKE', label: 'Intake' },
  { value: 'CONSENT', label: 'Consent' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'CLINICAL', label: 'Clinical' },
];

export default function FormBuilderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'CUSTOM',
    category: 'INTAKE',
    isRequired: false,
  });

  const [fields, setFields] = useState<FormFieldData[]>([]);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);

  const generateId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addField = (type: string) => {
    const newField: FormFieldData = {
      id: generateId(),
      type,
      label: `New ${fieldTypes.find((f) => f.type === type)?.label || 'Field'}`,
      required: false,
      ...(type === 'select' || type === 'multi_select' || type === 'radio'
        ? { options: [{ value: 'option1', label: 'Option 1' }] }
        : {}),
    };
    setFields([...fields, newField]);
    setSelectedFieldIndex(fields.length);
  };

  const updateField = (index: number, updates: Partial<FormFieldData>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
    setSelectedFieldIndex(null);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === fields.length - 1)
    ) {
      return;
    }

    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFields(newFields);
    setSelectedFieldIndex(targetIndex);
  };

  const addOption = (fieldIndex: number) => {
    const field = fields[fieldIndex];
    if (!field.options) return;

    const newOptions = [
      ...field.options,
      { value: `option${field.options.length + 1}`, label: `Option ${field.options.length + 1}` },
    ];
    updateField(fieldIndex, { options: newOptions });
  };

  const updateOption = (fieldIndex: number, optionIndex: number, updates: { value?: string; label?: string }) => {
    const field = fields[fieldIndex];
    if (!field.options) return;

    const newOptions = [...field.options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates };
    updateField(fieldIndex, { options: newOptions });
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const field = fields[fieldIndex];
    if (!field.options || field.options.length <= 1) return;

    const newOptions = field.options.filter((_, i) => i !== optionIndex);
    updateField(fieldIndex, { options: newOptions });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Template name is required');
      return;
    }

    if (fields.length === 0) {
      setError('At least one field is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/forms/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          type: formData.type,
          category: formData.category,
          isRequired: formData.isRequired,
          schema: {
            fields: fields.map((f) => ({
              id: f.id,
              type: f.type,
              label: f.label,
              placeholder: f.placeholder,
              helpText: f.helpText,
              required: f.required,
              options: f.options,
            })),
            settings: {
              showProgressBar: true,
              allowSaveProgress: true,
              requireSignature: fields.some((f) => f.type === 'signature'),
            },
          },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create template');
      }

      router.push('/crm/forms');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedField = selectedFieldIndex !== null ? fields[selectedFieldIndex] : null;

  return (
    <>
      <PageHeader
        title="Form Builder"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'CRM', href: '/crm' },
          { label: 'Forms', href: '/crm/forms' },
          { label: 'Builder' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        }
      />
      <PageContent density="comfortable">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Field Types */}
          <div className="col-span-3">
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Add Fields</CardTitle>
              </CardHeader>
              <CardContent compact className="space-y-1">
                {fieldTypes.map((fieldType) => {
                  const Icon = fieldType.icon;
                  return (
                    <Button
                      key={fieldType.type}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => addField(fieldType.type)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {fieldType.label}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Center - Form Preview */}
          <div className="col-span-5">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Template Info */}
            <Card className="mb-4">
              <CardHeader compact>
                <CardTitle size="sm">Template Details</CardTitle>
              </CardHeader>
              <CardContent compact className="space-y-4">
                <FormField label="Template Name" required>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., New Patient Medical History"
                  />
                </FormField>

                <FormField label="Description">
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this form..."
                    rows={2}
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Type">
                    <Select
                      value={formData.type}
                      onValueChange={(v) => setFormData({ ...formData, type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Category">
                    <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isRequired"
                    checked={formData.isRequired}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isRequired: checked === true })
                    }
                  />
                  <Label htmlFor="isRequired">Required for new patients</Label>
                </div>
              </CardContent>
            </Card>

            {/* Fields List */}
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Form Fields ({fields.length})</CardTitle>
              </CardHeader>
              <CardContent compact>
                {fields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No fields yet</p>
                    <p className="text-sm">Add fields from the left panel</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fields.map((field, index) => {
                      const fieldType = fieldTypes.find((f) => f.type === field.type);
                      const Icon = fieldType?.icon || Type;
                      return (
                        <div
                          key={field.id}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedFieldIndex === index
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-border hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedFieldIndex(index)}
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{field.label}</p>
                            <p className="text-xs text-muted-foreground">{fieldType?.label}</p>
                          </div>
                          {field.required && (
                            <Badge variant="warning" className="text-xs">Required</Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeField(index);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Field Properties */}
          <div className="col-span-4">
            <Card>
              <CardHeader compact>
                <CardTitle size="sm">Field Properties</CardTitle>
              </CardHeader>
              <CardContent compact>
                {selectedField ? (
                  <div className="space-y-4">
                    <FormField label="Label" required>
                      <Input
                        value={selectedField.label}
                        onChange={(e) =>
                          updateField(selectedFieldIndex!, { label: e.target.value })
                        }
                      />
                    </FormField>

                    {!['section_header', 'paragraph'].includes(selectedField.type) && (
                      <>
                        <FormField label="Placeholder">
                          <Input
                            value={selectedField.placeholder || ''}
                            onChange={(e) =>
                              updateField(selectedFieldIndex!, { placeholder: e.target.value })
                            }
                            placeholder="Enter placeholder text..."
                          />
                        </FormField>

                        <FormField label="Help Text">
                          <Input
                            value={selectedField.helpText || ''}
                            onChange={(e) =>
                              updateField(selectedFieldIndex!, { helpText: e.target.value })
                            }
                            placeholder="Additional instructions..."
                          />
                        </FormField>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="fieldRequired"
                            checked={selectedField.required}
                            onCheckedChange={(checked) =>
                              updateField(selectedFieldIndex!, { required: checked === true })
                            }
                          />
                          <Label htmlFor="fieldRequired">Required field</Label>
                        </div>
                      </>
                    )}

                    {/* Options for select/radio/multi-select */}
                    {selectedField.options && (
                      <div className="space-y-2">
                        <Label>Options</Label>
                        {selectedField.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex gap-2">
                            <Input
                              value={option.label}
                              onChange={(e) =>
                                updateOption(selectedFieldIndex!, optIndex, {
                                  label: e.target.value,
                                  value: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                                })
                              }
                              placeholder="Option label"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-10 w-10 p-0"
                              onClick={() => removeOption(selectedFieldIndex!, optIndex)}
                              disabled={selectedField.options!.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(selectedFieldIndex!)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    )}

                    {/* Reorder buttons */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveField(selectedFieldIndex!, 'up')}
                        disabled={selectedFieldIndex === 0}
                      >
                        Move Up
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveField(selectedFieldIndex!, 'down')}
                        disabled={selectedFieldIndex === fields.length - 1}
                      >
                        Move Down
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Select a field to edit its properties</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContent>
    </>
  );
}
