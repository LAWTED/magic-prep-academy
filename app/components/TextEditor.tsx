"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import TextIsland from "./TextIsland";
import { useEditorStore } from "../(students)/tools/store/editorStore";

interface TextEditorProps {
  initialContent: string;
  onSave: (content: string) => Promise<void>;
  placeholder?: string;
  className?: string;
  showIsland?: boolean;
}

export default function TextEditor({
  initialContent = "",
  onSave,
  placeholder = "Start writing your content here...",
  className = "",
  showIsland = true,
}: TextEditorProps) {
  // Use the store for all state
  const {
    content,
    setContent,
    setInitialContent,
    isDirty,
    setIsDirty,
    isSaving,
    setIsSaving,
    setLastSaved,
    showDynamicIsland,
    setShowDynamicIsland
  } = useEditorStore();

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const dynamicIslandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize the editor with the initial content
  useEffect(() => {
    setContent(initialContent);
    setInitialContent(initialContent);

    // Clean up function to reset the editor state when component unmounts
    return () => {
      // Reset all editor state values to initial state
      setContent("");
      setInitialContent("");
      setIsDirty(false);
      setIsSaving(false);
      setLastSaved(null);
      setShowDynamicIsland(false);

      // Clear any timeouts
      if (dynamicIslandTimeoutRef.current) {
        clearTimeout(dynamicIslandTimeoutRef.current);
        useEditorStore.setState({ dynamicIslandTimeoutRef: null });
      }
    };
  }, [initialContent, setContent, setInitialContent, setIsDirty, setIsSaving, setLastSaved, setShowDynamicIsland]);

  // Auto-resize the textarea as content changes
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Show the dynamic island when content changes
  useEffect(() => {
    if (isDirty && showIsland) {
      setShowDynamicIsland(true);

      // Clear any existing timeout
      if (dynamicIslandTimeoutRef.current) {
        clearTimeout(dynamicIslandTimeoutRef.current);
      }

      // Hide the island after 5 seconds if not actively typing
      dynamicIslandTimeoutRef.current = setTimeout(() => {
        setShowDynamicIsland(false);
      }, 5000);

      // Store the timer reference in Zustand
      useEditorStore.setState({ dynamicIslandTimeoutRef: dynamicIslandTimeoutRef.current });
    }

    // Cleanup on unmount
    return () => {
      if (dynamicIslandTimeoutRef.current) {
        clearTimeout(dynamicIslandTimeoutRef.current);
        useEditorStore.setState({ dynamicIslandTimeoutRef: null });
      }
    };
  }, [content, isDirty, setShowDynamicIsland, showIsland]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setIsDirty(newContent !== initialContent);
    if (showIsland) {
      setShowDynamicIsland(true);
    }
  };

  const saveContent = async () => {
    if (!isDirty) return;

    try {
      setIsSaving(true);
      await onSave(content);
      setLastSaved(new Date());
      setIsDirty(false);

      // Show the dynamic island with success state for 3 seconds
      if (showIsland) {
        setShowDynamicIsland(true);
        if (dynamicIslandTimeoutRef.current) {
          clearTimeout(dynamicIslandTimeoutRef.current);
        }
        dynamicIslandTimeoutRef.current = setTimeout(() => {
          setShowDynamicIsland(false);
        }, 3000);

        // Store the timer reference in Zustand
        useEditorStore.setState({ dynamicIslandTimeoutRef: dynamicIslandTimeoutRef.current });
      }
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error("Failed to save content");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      <textarea
        ref={textAreaRef}
        value={content}
        onChange={handleContentChange}
        placeholder={placeholder}
        className="w-full h-full p-4 font-serif text-base leading-relaxed resize-none focus:outline-none focus:ring-0"
        onFocus={() => showIsland && setShowDynamicIsland(true)}
        onClick={() => showIsland && setShowDynamicIsland(true)}
      />

      {showIsland && <TextIsland onSave={saveContent} />}
    </div>
  );
}