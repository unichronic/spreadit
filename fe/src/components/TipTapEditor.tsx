'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

interface TipTapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function TipTapEditor({ content, onChange, placeholder = "Start writing..." }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4 cursor-text',
      },
    },
    autofocus: true, // Auto-focus the editor
  })

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Focus editor on mount
  useEffect(() => {
    if (editor) {
      // Small delay to ensure editor is ready
      setTimeout(() => {
        editor.commands.focus()
      }, 100)
    }
  }, [editor])

  if (!editor) {
    return (
      <div className="border border-gray-300 rounded-lg">
        <div className="border-b border-gray-200 p-2 flex flex-wrap gap-2">
          <div className="animate-pulse h-8 bg-gray-200 rounded w-20"></div>
          <div className="animate-pulse h-8 bg-gray-200 rounded w-20"></div>
          <div className="animate-pulse h-8 bg-gray-200 rounded w-20"></div>
        </div>
        <div className="p-4 min-h-[400px] animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-3 bg-gray-50 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1.5 text-sm rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('bold') ? 'bg-gray-300 font-semibold' : 'bg-white'
          }`}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1.5 text-sm rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('italic') ? 'bg-gray-300 italic' : 'bg-white'
          }`}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`px-3 py-1.5 text-sm rounded hover:bg-gray-200 transition-colors font-mono ${
            editor.isActive('code') ? 'bg-gray-300' : 'bg-white'
          }`}
        >
          Code
        </button>
        <div className="w-px bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-1.5 text-sm rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('heading', { level: 1 }) ? 'bg-gray-300 font-bold' : 'bg-white'
          }`}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1.5 text-sm rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-300 font-semibold' : 'bg-white'
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-1.5 text-sm rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-300 font-medium' : 'bg-white'
          }`}
        >
          H3
        </button>
        <div className="w-px bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1.5 text-sm rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('bulletList') ? 'bg-gray-300' : 'bg-white'
          }`}
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1.5 text-sm rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('orderedList') ? 'bg-gray-300' : 'bg-white'
          }`}
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-3 py-1.5 text-sm rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('blockquote') ? 'bg-gray-300' : 'bg-white'
          }`}
        >
          Quote
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`px-3 py-1.5 text-sm rounded hover:bg-gray-200 transition-colors font-mono ${
            editor.isActive('codeBlock') ? 'bg-gray-300' : 'bg-white'
          }`}
        >
          Code Block
        </button>
      </div>
      
      {/* Editor */}
      <div 
        className="cursor-text" 
        onClick={() => editor.commands.focus()}
      >
        <EditorContent 
          editor={editor} 
          className="prose prose-sm max-w-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50 transition-all [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[400px] [&_.ProseMirror]:p-4"
        />
      </div>
    </div>
  )
} 