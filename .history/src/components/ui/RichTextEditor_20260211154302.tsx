'use client'

import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableRow } from '@tiptap/extension-table-row'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Markdown } from 'tiptap-markdown'
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Heading1, Heading2, Quote, Code, ArrowLeft, ArrowRight, Undo, Redo, Minus, Table as TableIcon, CheckSquare, Info, StickyNote } from 'lucide-react'
import styles from './RichTextEditor.module.css'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  editable?: boolean
  placeholder?: string
}

export default function RichTextEditor({ content, onChange, editable = true, placeholder = 'Start writing...' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
        breaks: true, // IMPORTANT: Respect soft breaks to match Read View
      }),
      Placeholder.configure({
        placeholder,
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
       // We want to save clean markdown, so we might need to strip the extra spaces if strictly needed,
       // but typically markdown-it handles '  \n' as just '\n' in output or BR.
       // Let's rely on the extension's output first.
       onChange(editor.storage.markdown.getMarkdown())
    },
    editorProps: {
        attributes: {
            class: styles.editorContent
        }
    }
  })

  if (!editor) {
    return null
  }

  // Floating Menu could be added here for / commands

  return (
    <div className={styles.editorContainer}>
      {editable && (
        <div className={styles.toolbar}>
           <div className={styles.toolbarGroup}>
              <button 
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? styles.active : ''}
                title="Bold (Cmd+B)"
              >
                <Bold size={16} />
              </button>
              <button 
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? styles.active : ''}
                title="Italic (Cmd+I)"
              >
                <Italic size={16} />
              </button>
           </div>
           
           <div className={styles.toolbarDivider} />

           <div className={styles.toolbarGroup}>
              <button 
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? styles.active : ''}
                title="Heading 1"
              >
                <Heading1 size={16} />
              </button>
              <button 
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? styles.active : ''}
                title="Heading 2"
              >
                <Heading2 size={16} />
              </button>
           </div>

           <div className={styles.toolbarDivider} />

           <div className={styles.toolbarGroup}>
              <button 
                onClick={() => {
                  const previousUrl = editor.getAttributes('link').href
                  const url = window.prompt('URL', previousUrl)
                  
                  if (url === null) return // cancelled
                  if (url === '') {
                    editor.chain().focus().extendMarkRange('link').unsetLink().run()
                    return
                  }
                  
                  editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
                }}
                className={editor.isActive('link') ? styles.active : ''}
                title="Add Link"
              >
                <LinkIcon size={16} />
              </button>
              <button 
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title="Horizontal Rule"
              >
                <Minus size={16} />
              </button>
           </div>

           <div className={styles.toolbarDivider} />

           <div className={styles.toolbarGroup}>
              <button 
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? styles.active : ''}
                title="Bullet List"
              >
                <List size={16} />
              </button>
              <button 
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? styles.active : ''}
                title="Ordered List"
              >
                <ListOrdered size={16} />
              </button>
           </div>

           <div className={styles.toolbarDivider} />

           <div className={styles.toolbarGroup}>
              <button 
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={editor.isActive('blockquote') ? styles.active : ''}
                title="Info Panel"
              >
                <Info size={16} />
              </button>
              <button 
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={editor.isActive('codeBlock') ? styles.active : ''}
                title="Code Block"
              >
                <Code size={16} />
              </button>
           </div>

           <div className={styles.toolbarDivider} />

           <div className={styles.toolbarGroup}>
              <button 
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                className={editor.isActive('taskList') ? styles.active : ''}
                title="Action Item"
              >
                <CheckSquare size={16} />
              </button>
              <button 
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                title="Insert Table"
              >
                <TableIcon size={16} />
              </button>
           </div>

           <div className={styles.toolbarDivider} />

            <div className={styles.toolbarGroup}>
               <button 
                 onClick={() => editor.chain().focus().undo().run()}
                 disabled={!editor.can().chain().focus().undo().run()}
                 title="Undo (Cmd+Z)"
               >
                 <Undo size={16} />
               </button>
               <button 
                 onClick={() => editor.chain().focus().redo().run()}
                 disabled={!editor.can().chain().focus().redo().run()}
                 title="Redo (Cmd+Shift+Z)"
               >
                 <Redo size={16} />
               </button>
            </div>
        </div>
      )}
      
      <EditorContent editor={editor} className={styles.contentArea} />
    </div>
  )
}
