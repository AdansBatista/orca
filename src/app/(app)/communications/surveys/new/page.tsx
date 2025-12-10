'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ClipboardList,
  Save,
  Play,
  AlertTriangle,
  Plus,
  Trash2,
  GripVertical,
  Copy,
  Settings2,
  Eye,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  SURVEY_CATEGORIES,
  QUESTION_TYPES,
  type SurveyQuestion,
  type QuestionType,
} from '@/lib/validations/surveys';

// Generate unique ID
function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// Default question template
function createQuestion(type: QuestionType): SurveyQuestion {
  const base = {
    id: generateId(),
    type,
    text: '',
    required: false,
    order: 0,
  };

  switch (type) {
    case 'SINGLE_CHOICE':
    case 'MULTIPLE_CHOICE':
      return { ...base, options: ['Option 1', 'Option 2'] };
    case 'RATING':
      return { ...base, minRating: 1, maxRating: 5 };
    case 'NPS':
      return {
        ...base,
        minRating: 0,
        maxRating: 10,
        ratingLabels: { min: 'Not likely', max: 'Very likely' },
      };
    default:
      return base;
  }
}

// Sortable question card
interface SortableQuestionProps {
  question: SurveyQuestion;
  index: number;
  onUpdate: (question: SurveyQuestion) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function SortableQuestion({
  question,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
}: SortableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const questionType = QUESTION_TYPES.find((t) => t.value === question.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'transition-opacity',
        isDragging && 'opacity-50'
      )}
    >
      <Card variant="bento">
        <CardHeader compact className="flex flex-row items-start gap-3">
          <button
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <Badge variant="outline" size="sm">
                {index + 1}. {questionType?.label}
              </Badge>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onDuplicate}
                  title="Duplicate"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onDelete}
                  title="Delete"
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Input
              value={question.text}
              onChange={(e) => onUpdate({ ...question, text: e.target.value })}
              placeholder="Enter your question..."
              className="font-medium"
            />
            {question.description !== undefined && (
              <Input
                value={question.description || ''}
                onChange={(e) =>
                  onUpdate({ ...question, description: e.target.value })
                }
                placeholder="Optional description or helper text"
                className="text-sm"
              />
            )}
          </div>
        </CardHeader>
        <CardContent compact className="pt-0">
          {/* Choice options */}
          {(question.type === 'SINGLE_CHOICE' ||
            question.type === 'MULTIPLE_CHOICE') && (
            <div className="space-y-2 mb-4">
              {question.options?.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-4 w-4 border border-border rounded',
                      question.type === 'SINGLE_CHOICE' && 'rounded-full'
                    )}
                  />
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(question.options || [])];
                      newOptions[optIndex] = e.target.value;
                      onUpdate({ ...question, options: newOptions });
                    }}
                    placeholder={`Option ${optIndex + 1}`}
                    className="flex-1"
                  />
                  {(question.options?.length || 0) > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        const newOptions = question.options?.filter(
                          (_, i) => i !== optIndex
                        );
                        onUpdate({ ...question, options: newOptions });
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onUpdate({
                    ...question,
                    options: [
                      ...(question.options || []),
                      `Option ${(question.options?.length || 0) + 1}`,
                    ],
                  });
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Option
              </Button>
            </div>
          )}

          {/* Rating options */}
          {question.type === 'RATING' && (
            <div className="flex items-center gap-4 mb-4">
              <FormField label="Min" className="flex-1">
                <Input
                  type="number"
                  value={question.minRating || 1}
                  onChange={(e) =>
                    onUpdate({
                      ...question,
                      minRating: parseInt(e.target.value) || 1,
                    })
                  }
                  min={0}
                  max={10}
                />
              </FormField>
              <FormField label="Max" className="flex-1">
                <Input
                  type="number"
                  value={question.maxRating || 5}
                  onChange={(e) =>
                    onUpdate({
                      ...question,
                      maxRating: parseInt(e.target.value) || 5,
                    })
                  }
                  min={1}
                  max={10}
                />
              </FormField>
            </div>
          )}

          {/* NPS labels */}
          {question.type === 'NPS' && (
            <div className="flex items-center gap-4 mb-4">
              <FormField label="Min Label" className="flex-1">
                <Input
                  value={question.ratingLabels?.min || ''}
                  onChange={(e) =>
                    onUpdate({
                      ...question,
                      ratingLabels: {
                        ...question.ratingLabels,
                        min: e.target.value,
                      },
                    })
                  }
                  placeholder="Not likely at all"
                />
              </FormField>
              <FormField label="Max Label" className="flex-1">
                <Input
                  value={question.ratingLabels?.max || ''}
                  onChange={(e) =>
                    onUpdate({
                      ...question,
                      ratingLabels: {
                        ...question.ratingLabels,
                        max: e.target.value,
                      },
                    })
                  }
                  placeholder="Extremely likely"
                />
              </FormField>
            </div>
          )}

          {/* Required toggle */}
          <div className="flex items-center gap-2">
            <Switch
              checked={question.required}
              onCheckedChange={(checked) =>
                onUpdate({ ...question, required: checked })
              }
            />
            <Label className="text-sm text-muted-foreground">Required</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewSurveyPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState(
    'Thank you for your feedback!'
  );
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);

  // DnD setup
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddQuestion = (type: QuestionType) => {
    setQuestions([...questions, createQuestion(type)]);
  };

  const handleUpdateQuestion = (index: number, question: SurveyQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = question;
    setQuestions(newQuestions);
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleDuplicateQuestion = (index: number) => {
    const question = questions[index];
    const duplicate = { ...question, id: generateId() };
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, duplicate);
    setQuestions(newQuestions);
  };

  const handleSubmit = async (status: 'DRAFT' | 'ACTIVE') => {
    setError(null);
    setSaving(true);

    try {
      if (!title.trim()) {
        throw new Error('Title is required');
      }
      if (!category) {
        throw new Error('Category is required');
      }
      if (questions.length === 0) {
        throw new Error('At least one question is required');
      }
      if (questions.some((q) => !q.text.trim())) {
        throw new Error('All questions must have text');
      }

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        isAnonymous,
        allowMultiple,
        thankYouMessage: thankYouMessage.trim() || undefined,
        questions: questions.map((q, i) => ({ ...q, order: i })),
        status,
      };

      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create survey');
      }

      toast.success(
        status === 'ACTIVE'
          ? 'Survey created and activated!'
          : 'Survey saved as draft!'
      );
      router.push(`/communications/surveys/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Create Survey"
        compact
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Communications', href: '/communications' },
          { label: 'Surveys', href: '/communications/surveys' },
          { label: 'New' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/communications/surveys">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSubmit('DRAFT')}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              size="sm"
              onClick={() => handleSubmit('ACTIVE')}
              disabled={saving}
            >
              <Play className="h-4 w-4 mr-2" />
              Activate
            </Button>
          </div>
        }
      />

      <PageContent density="comfortable">
        <div className="max-w-4xl space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="questions" className="space-y-6">
            <TabsList>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Questions Tab */}
            <TabsContent value="questions" className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Survey Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField label="Title" required>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Patient Satisfaction Survey"
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Category" required>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {SURVEY_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.slug} value={cat.slug}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>

                  <FormField label="Description">
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief introduction shown to respondents..."
                      rows={2}
                    />
                  </FormField>
                </CardContent>
              </Card>

              {/* Questions */}
              <Card>
                <CardHeader>
                  <CardTitle>Questions</CardTitle>
                  <CardDescription>
                    Add and arrange questions for your survey. Drag to reorder.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {questions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardList className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                      <p>No questions yet. Add your first question below.</p>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={questions.map((q) => q.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {questions.map((question, index) => (
                            <SortableQuestion
                              key={question.id}
                              question={question}
                              index={index}
                              onUpdate={(q) => handleUpdateQuestion(index, q)}
                              onDelete={() => handleDeleteQuestion(index)}
                              onDuplicate={() => handleDuplicateQuestion(index)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}

                  {/* Add question buttons */}
                  <div className="border-t border-border pt-4">
                    <p className="text-sm font-medium mb-3">Add Question</p>
                    <div className="flex flex-wrap gap-2">
                      {QUESTION_TYPES.map((type) => (
                        <Button
                          key={type.value}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleAddQuestion(type.value as QuestionType)
                          }
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    Survey Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Anonymous Responses</Label>
                      <p className="text-sm text-muted-foreground">
                        Don't link responses to patient records
                      </p>
                    </div>
                    <Switch
                      checked={isAnonymous}
                      onCheckedChange={setIsAnonymous}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Multiple Responses</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow patients to submit multiple times
                      </p>
                    </div>
                    <Switch
                      checked={allowMultiple}
                      onCheckedChange={setAllowMultiple}
                    />
                  </div>

                  <FormField label="Thank You Message">
                    <Textarea
                      value={thankYouMessage}
                      onChange={(e) => setThankYouMessage(e.target.value)}
                      placeholder="Message shown after completing the survey"
                      rows={2}
                    />
                  </FormField>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Link href="/communications/surveys">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => handleSubmit('DRAFT')}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button onClick={() => handleSubmit('ACTIVE')} disabled={saving}>
              <Play className="h-4 w-4 mr-2" />
              {saving ? 'Activating...' : 'Activate Survey'}
            </Button>
          </div>
        </div>
      </PageContent>
    </>
  );
}
