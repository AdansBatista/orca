'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Link as LinkIcon,
  Image as ImageIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Undo,
  Redo,
  Unlink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import { Separator } from './separator';
import { useState, useCallback } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  disabled?: boolean;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
}

function ToolbarButton({ icon, onClick, isActive, disabled, title }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant={isActive ? 'soft' : 'ghost'}
      size="icon-sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="h-8 w-8"
    >
      {icon}
    </Button>
  );
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const setLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    setLinkUrl('');
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return;

    const url = imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`;
    editor.chain().focus().setImage({ src: url }).run();
    setImageUrl('');
  }, [editor, imageUrl]);

  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30 rounded-t-lg">
      {/* History */}
      <ToolbarButton
        icon={<Undo className="h-4 w-4" />}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      />
      <ToolbarButton
        icon={<Redo className="h-4 w-4" />}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Headings */}
      <ToolbarButton
        icon={<Heading1 className="h-4 w-4" />}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      />
      <ToolbarButton
        icon={<Heading2 className="h-4 w-4" />}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      />
      <ToolbarButton
        icon={<Heading3 className="h-4 w-4" />}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Text formatting */}
      <ToolbarButton
        icon={<Bold className="h-4 w-4" />}
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
      />
      <ToolbarButton
        icon={<Italic className="h-4 w-4" />}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
      />
      <ToolbarButton
        icon={<UnderlineIcon className="h-4 w-4" />}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline"
      />
      <ToolbarButton
        icon={<Strikethrough className="h-4 w-4" />}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Alignment */}
      <ToolbarButton
        icon={<AlignLeft className="h-4 w-4" />}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Align Left"
      />
      <ToolbarButton
        icon={<AlignCenter className="h-4 w-4" />}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Align Center"
      />
      <ToolbarButton
        icon={<AlignRight className="h-4 w-4" />}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Align Right"
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
      <ToolbarButton
        icon={<List className="h-4 w-4" />}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      />
      <ToolbarButton
        icon={<ListOrdered className="h-4 w-4" />}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Block elements */}
      <ToolbarButton
        icon={<Quote className="h-4 w-4" />}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
      />
      <ToolbarButton
        icon={<Code className="h-4 w-4" />}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="Code Block"
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Link */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant={editor.isActive('link') ? 'soft' : 'ghost'}
            size="icon-sm"
            title="Add Link"
            className="h-8 w-8"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3">
          <div className="space-y-3">
            <p className="text-sm font-medium">Insert Link</p>
            <Input
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setLink();
                }
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={setLink}>
                Add Link
              </Button>
              {editor.isActive('link') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => editor.chain().focus().unsetLink().run()}
                >
                  <Unlink className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Image */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Add Image"
            className="h-8 w-8"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3">
          <div className="space-y-3">
            <p className="text-sm font-medium">Insert Image</p>
            <Input
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addImage();
                }
              }}
            />
            <Button size="sm" onClick={addImage}>
              Add Image
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  className,
  minHeight = '300px',
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-2',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-lg',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
          'prose-headings:font-semibold prose-headings:tracking-tight',
          'prose-p:leading-relaxed',
          'prose-a:text-primary prose-a:underline-offset-2',
          'prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic',
          'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none',
          'prose-img:rounded-lg'
        ),
      },
    },
  });

  return (
    <div
      className={cn(
        'rounded-lg border border-input bg-background overflow-hidden',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <EditorToolbar editor={editor} />
      <EditorContent
        editor={editor}
        className={cn('p-4', `min-h-[${minHeight}]`)}
        style={{ minHeight }}
      />
    </div>
  );
}

export { type RichTextEditorProps };
