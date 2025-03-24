"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Message } from '../types';

export interface ParsedContent {
  cleanContent: string;
  resumeData: any | null;
  sopContent: string | null;
  lorRequestInfo: {
    requestId: string;
    programName: string;
    schoolName: string;
  } | null;
}

export default function useMessageContentParser(message: Message): ParsedContent {
  const [resumeData, setResumeData] = useState<any>(null);
  const [sopContent, setSopContent] = useState<string | null>(null);
  const [lorRequestInfo, setLorRequestInfo] = useState<ParsedContent['lorRequestInfo']>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Try to detect and parse resume metadata from the message content
    if (message.content) {
      try {
        // Look for JSON content in the message (could be in code blocks or directly in message)
        let jsonContent;

        // First try to match content between ```json and ``` tags
        const codeBlockMatch = message.content.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          jsonContent = JSON.parse(codeBlockMatch[1]);
        } else {
          // Otherwise try to match any JSON-like object
          const jsonMatches = message.content.match(/\{[\s\S]*\}/);
          if (jsonMatches) {
            jsonContent = JSON.parse(jsonMatches[0]);
          }
        }

        // Check if this looks like resume data in APA format
        if (jsonContent) {
          // Direct APA format: Contains personalInfo section (main indicator of APA format)
          if (jsonContent.personalInfo) {
            setResumeData({
              format: "APA",
              content: jsonContent
            });
          }
          // Wrapped format: Content inside a container with format specified
          else if (jsonContent.format === "APA" && jsonContent.content) {
            setResumeData(jsonContent);
          }
          // Check if this looks like SOP data or general text format
          else if (jsonContent.format === "text" && jsonContent.content) {
            setSopContent(jsonContent.content);
          }
          // Check if this looks like LoR request data
          else if (jsonContent.type === "lor_request" && jsonContent.requestId) {
            setLorRequestInfo({
              requestId: jsonContent.requestId,
              programName: jsonContent.programName || '',
              schoolName: jsonContent.schoolName || ''
            });
          }
        }
      } catch (error) {
        // Silent fail - not all messages will contain valid JSON
        console.log("No valid structured data found in message");

        // Check if this is SOP content (text format)
        if (message.content.includes("Statement of Purpose") ||
            message.content.includes("SOP") ||
            searchParams?.get("has_sop") === "true") {
          // Treat this as SOP content if it contains significant text
          const textContent = message.content.replace(/```[\s\S]*?```/g, "").trim();
          if (textContent.length > 200) {
            setSopContent(textContent);
          }
        }
      }

      // Check for LoR request in plain text
      const lorRegex = /I am applying for (.*?) at (.*?)\..*requestId[=:]\s*["']?([a-f0-9-]+)["']?/i;
      const lorMatch = message.content.match(lorRegex);
      if (lorMatch && lorMatch.length >= 4) {
        setLorRequestInfo({
          requestId: lorMatch[3],
          programName: lorMatch[1],
          schoolName: lorMatch[2]
        });
      }
    }
  }, [message.content, searchParams]);

  // Function to get message content without JSON metadata
  const getCleanMessageContent = (): string => {
    if (resumeData || sopContent || lorRequestInfo) {
      // If we found structured data, render the message without the JSON part
      let cleanContent = message.content;

      // Remove JSON code blocks
      cleanContent = cleanContent.replace(/```json\s*([\s\S]*?)\s*```/g, "");

      // Remove raw JSON objects
      cleanContent = cleanContent.replace(/\{[\s\S]*\}/, "");

      // Clean up any excessive newlines that may have been left
      cleanContent = cleanContent.replace(/\n{3,}/g, "\n\n");

      return cleanContent.trim();
    }
    return message.content;
  };

  return {
    cleanContent: getCleanMessageContent(),
    resumeData,
    sopContent,
    lorRequestInfo
  };
}