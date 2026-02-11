'use client'

import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Markdown } from 'tiptap-markdown'
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Heading1, Heading2, Quote, Code, ArrowLeft, ArrowRight } from 'lucide-react'
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
      StarterKit,
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
        breaks: true, // Handle newlines as <br>
      }),
      Placeholder.configure({
        placeholder,
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
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
                title="Quote"
              >
                <Quote size={16} />
              </button>
              <button 
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={editor.isActive('codeBlock') ? styles.active : ''}
                title="Code Block"
              >
                <Code size={16} />
              </button>
           </div>
        </div>
      )}
      
      <EditorContent editor={editor} className={styles.contentArea} />
    </div>
  )
}
