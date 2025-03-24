"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { toast } from "sonner";
import TextIsland from "./TextIsland";
import { useEditorStore } from "../(students)/tools/store/editorStore";
import { HighlightWithinTextarea } from "react-highlight-within-textarea";
import type { Editor } from "draft-js";

interface TextEditorProps {
  initialContent: string;
  onSave: (content: string) => Promise<void>;
  placeholder?: string;
  className?: string;
  showIsland?: boolean;
  highlights?: Array<
    string | RegExp | { highlight: string | RegExp; className?: string }
  >;
  onSelectionChange?: (selection: string) => void;
  activeHighlight?: string;
  readOnly?: boolean;
}

export default function TextEditor({
  initialContent = "",
  onSave,
  placeholder = "Start writing your content here...",
  className = "",
  showIsland = true,
  highlights = [],
  onSelectionChange,
  activeHighlight,
  readOnly = false,
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
    setShowDynamicIsland,
  } = useEditorStore();

  const editorRef = useRef<Editor>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dynamicIslandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Process highlights to apply special styling to activeHighlight
  const processedHighlights = useMemo(() => {
    if (!activeHighlight) return highlights;

    // Create a processed list of highlights where activeHighlight gets special styling
    const processed = [...highlights].filter((h) => {
      // Filter out any highlights that match activeHighlight (we'll re-add it with special styling)
      if (typeof h === "string") {
        return h !== activeHighlight;
      } else if (h instanceof RegExp) {
        return true; // Keep regexp highlights
      } else {
        // For object highlights, filter out if the highlight matches activeHighlight
        return (
          typeof h.highlight === "string" && h.highlight !== activeHighlight
        );
      }
    });

    // Add the activeHighlight with special styling
    if (activeHighlight) {
      processed.push({
        highlight: activeHighlight,
        className: "active-highlight",
      });
    }

    return processed;
  }, [highlights, activeHighlight]);

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
  }, [
    initialContent,
    setContent,
    setInitialContent,
    setIsDirty,
    setIsSaving,
    setLastSaved,
    setShowDynamicIsland,
  ]);

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
      useEditorStore.setState({
        dynamicIslandTimeoutRef: dynamicIslandTimeoutRef.current,
      });
    }

    // Cleanup on unmount
    return () => {
      if (dynamicIslandTimeoutRef.current) {
        clearTimeout(dynamicIslandTimeoutRef.current);
        useEditorStore.setState({ dynamicIslandTimeoutRef: null });
      }
    };
  }, [content, isDirty, setShowDynamicIsland, showIsland]);

  // Scroll to active highlight when it changes
  useEffect(() => {
    if (activeHighlight && containerRef.current) {
      // Use setTimeout to ensure the editor has rendered the highlights
      setTimeout(() => {
        try {
          // First try to find by exact text content
          const highlightElements =
            containerRef.current?.querySelectorAll(".active-highlight");

          if (highlightElements && highlightElements.length > 0) {
            // First try to find exact match
            for (let i = 0; i < highlightElements.length; i++) {
              const element = highlightElements[i];
              if (element.textContent === activeHighlight) {
                element.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
                return; // Exit if found
              }
            }

            // If no exact match found, try to find containing text
            for (let i = 0; i < highlightElements.length; i++) {
              const element = highlightElements[i];
              if (
                element.textContent &&
                element.textContent.includes(activeHighlight)
              ) {
                element.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
                return; // Exit if found
              }
            }
          }
        } catch (error) {
          console.error("Error scrolling to highlight:", error);
        }
      }, 300); // Give a bit more time for the editor to render
    }
  }, [activeHighlight]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setIsDirty(newContent !== initialContent);
    if (showIsland) {
      setShowDynamicIsland(true);
    }
  };

  // Handle text selection
  const handleMouseUp = () => {
    if (onSelectionChange) {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        onSelectionChange(selection.toString().trim());
      }
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
        useEditorStore.setState({
          dynamicIslandTimeoutRef: dynamicIslandTimeoutRef.current,
        });
      }
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error("Failed to save content");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${className}`}
      onMouseUp={handleMouseUp}
    >
      <HighlightWithinTextarea
        ref={editorRef}
        value={content}
        onChange={handleContentChange}
        placeholder={placeholder}
        highlight={processedHighlights}
        onFocus={() => showIsland && setShowDynamicIsland(true)}
        onBlur={() => {}}
        readOnly={readOnly}
      />

      {showIsland && <TextIsland onSave={saveContent} />}
    </div>
  );
}
