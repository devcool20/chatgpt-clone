"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface StreamingMessageProps {
  content: string | any;
  isStreaming: boolean;
  onContentChange?: (content: string) => void;
  stopAnimation?: boolean;
  instantStop?: boolean;
}

export const StreamingMessage = ({ content, isStreaming, onContentChange, stopAnimation, instantStop }: StreamingMessageProps) => {
  // Ensure content is always a string
  const safeContent = typeof content === 'string' ? content : JSON.stringify(content);
  
  const [displayed, setDisplayed] = useState("");
  const bufferRef = useRef(safeContent);
  const displayedRef = useRef("");
  const animatingRef = useRef(false);
  const animationTimeout = useRef<NodeJS.Timeout | null>(null);

  // Always keep displayedRef in sync with displayed
  useEffect(() => {
    displayedRef.current = displayed;
  }, [displayed]);

  // When content changes, add new chars to buffer and animate
  useEffect(() => {
    if (safeContent !== bufferRef.current) {
      bufferRef.current = safeContent;
      if (!animatingRef.current) animateNext();
    }
  }, [safeContent]);

  // Animate one character at a time from displayed to buffer
  function animateNext() {
    animatingRef.current = true;
    const current = displayedRef.current;
    const buffer = bufferRef.current;
    const nextChar = buffer[current.length];
    if (nextChar !== undefined) {
      const next = current + nextChar;
      setDisplayed(next);
      onContentChange?.(next);
      animationTimeout.current = setTimeout(animateNext, 5);
    } else {
      animatingRef.current = false;
    }
  }

  // Stop animation and show full content if stopAnimation or instantStop is true
  useEffect(() => {
    if (stopAnimation || instantStop) {
      if (animationTimeout.current) clearTimeout(animationTimeout.current);
      setDisplayed(safeContent);
      animatingRef.current = false;
    }
  }, [stopAnimation, instantStop, safeContent]);

  // Reset on new message
  useEffect(() => {
    if (safeContent.length === 0) {
      setDisplayed("");
      bufferRef.current = "";
      displayedRef.current = "";
      animatingRef.current = false;
      if (animationTimeout.current) clearTimeout(animationTimeout.current);
    }
  }, [safeContent]);

  // Cleanup
  useEffect(() => () => {
    if (animationTimeout.current) clearTimeout(animationTimeout.current);
  }, []);

  // Format text with better structure like ChatGPT
  const formatText = (text: string) => {
    if (!text || typeof text !== 'string') return <span className="text-white">No content</span>;

    // Split text into paragraphs first (double line breaks)
    const sections = text.split(/\n\s*\n/);
    const elements: JSX.Element[] = [];

    sections.forEach((section, sectionIndex) => {
      const lines = section.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length === 0) return;

      let currentParagraph: string[] = [];
      let listItems: string[] = [];
      let listType: 'bullet' | 'numbered' | null = null;

      const flushParagraph = () => {
        if (currentParagraph.length > 0) {
          const content = currentParagraph.join(' ').trim();
          if (content) {
            // Check if this looks like a section header (ends with :)
            const isHeader = content.endsWith(':') && content.length < 100 && !content.includes('.');
            
            if (isHeader) {
              elements.push(
                <h3 key={`header-${elements.length}`} className="font-semibold text-white text-lg mb-3 mt-6 first:mt-0">
                  {formatInlineText(content)}
                </h3>
              );
            } else {
              elements.push(
                <p key={`paragraph-${elements.length}`} className="mb-4 leading-7 text-white">
                  {formatInlineText(content)}
                </p>
              );
            }
          }
          currentParagraph = [];
        }
      };

      const flushList = () => {
        if (listItems.length > 0) {
          if (listType === 'bullet') {
            elements.push(
              <ul key={`bullet-list-${elements.length}`} className="mb-6 space-y-3 ml-0">
                {listItems.map((item, index) => (
                  <li key={`bullet-item-${index}`} className="flex items-start">
                    <span className="text-zinc-400 mr-3 mt-1 flex-shrink-0 text-sm">•</span>
                    <div className="leading-7 text-white flex-1">{formatInlineText(item)}</div>
                  </li>
                ))}
              </ul>
            );
          } else if (listType === 'numbered') {
            elements.push(
              <ol key={`numbered-list-${elements.length}`} className="mb-6 space-y-3 ml-0">
                {listItems.map((item, index) => (
                  <li key={`numbered-item-${index}`} className="flex items-start">
                    <span className="text-zinc-400 mr-3 mt-1 flex-shrink-0 text-sm">{index + 1}.</span>
                    <div className="leading-7 text-white flex-1">{formatInlineText(item)}</div>
                  </li>
                ))}
              </ol>
            );
          }
          listItems = [];
          listType = null;
        }
      };

      lines.forEach((line) => {
        // Check for bullet points (*, -, •)
        const bulletMatch = line.match(/^[*\-•]\s+(.+)$/);
        if (bulletMatch) {
          flushParagraph();
          if (listType !== 'bullet') {
            flushList();
            listType = 'bullet';
          }
          listItems.push(bulletMatch[1]);
          return;
        }

        // Check for numbered lists
        const numberedMatch = line.match(/^\d+\.\s+(.+)$/);
        if (numberedMatch) {
          flushParagraph();
          if (listType !== 'numbered') {
            flushList();
            listType = 'numbered';
          }
          listItems.push(numberedMatch[1]);
          return;
        }

        // Check if line looks like a standalone section header
        const isStandaloneHeader = line.endsWith(':') && line.length < 100 && !line.includes('.') && lines.length > 1;
        if (isStandaloneHeader) {
          flushParagraph();
          flushList();
          elements.push(
            <h3 key={`standalone-header-${elements.length}`} className="font-semibold text-white text-lg mb-3 mt-6 first:mt-0">
              {formatInlineText(line)}
            </h3>
          );
          return;
        }

        // Regular text - add to paragraph
        flushList();
        currentParagraph.push(line);
      });

      // Flush remaining content for this section
      flushParagraph();
      flushList();
    });

    return elements.length > 0 ? elements : <span className="text-white">{formatInlineText(text)}</span>;
  };

  const formatInlineText = (text: string) => {
    if (!text || typeof text !== 'string') return <span className="text-white">No content</span>;
    
    // Handle bold text (**text**)
    const boldRegex = /\*\*(.+?)\*\*/g;
    const parts = text.split(boldRegex);
    
    return parts.map((part, index) => {
      // Odd indices are the content inside **
      if (index % 2 === 1) {
        return <strong key={`bold-${index}`} className="font-semibold">{part}</strong>;
      }
      return <span key={`text-${index}`}>{part}</span>;
    });
  };

  return (
    <div className="font-sans text-base text-white leading-7 break-words w-full overflow-x-hidden">
      {formatText(displayed)}
      {(isStreaming || animatingRef.current) && !(stopAnimation || instantStop) && displayed !== safeContent && (
        <motion.span
          className="inline-block w-0.5 h-5 bg-white ml-0.5"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          style={{ verticalAlign: 'text-top', marginTop: '2px' }}
        />
      )}
    </div>
  );
}; 