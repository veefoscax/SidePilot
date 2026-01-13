/**
 * Markdown Component
 * 
 * Renders markdown content with syntax highlighting for code blocks.
 * Styled for both light and dark themes with proper link handling.
 */

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useEffect, useState } from 'react';

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  const [isDark, setIsDark] = useState(true);

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <ReactMarkdown
      components={{
        // Code blocks with syntax highlighting
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';

          if (!inline && language) {
            return (
              <SyntaxHighlighter
                style={isDark ? oneDark : oneLight}
                language={language}
                PreTag="div"
                className="rounded-md !mt-2 !mb-2"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            );
          }

          // Inline code
          return (
            <code 
              className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" 
              {...props}
            >
              {children}
            </code>
          );
        },

        // Links - open in new tab for external links
        a({ href, children, ...props }) {
          const isExternal = href?.startsWith('http');
          return (
            <a
              href={href}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="text-primary hover:underline"
              {...props}
            >
              {children}
            </a>
          );
        },

        // Headings with proper spacing
        h1: ({ children, ...props }) => (
          <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0" {...props}>
            {children}
          </h1>
        ),
        h2: ({ children, ...props }) => (
          <h2 className="text-lg font-semibold mt-3 mb-2 first:mt-0" {...props}>
            {children}
          </h2>
        ),
        h3: ({ children, ...props }) => (
          <h3 className="text-base font-medium mt-3 mb-1 first:mt-0" {...props}>
            {children}
          </h3>
        ),

        // Lists with proper spacing
        ul: ({ children, ...props }) => (
          <ul className="list-disc list-inside space-y-1 my-2" {...props}>
            {children}
          </ul>
        ),
        ol: ({ children, ...props }) => (
          <ol className="list-decimal list-inside space-y-1 my-2" {...props}>
            {children}
          </ol>
        ),

        // Paragraphs with spacing
        p: ({ children, ...props }) => (
          <p className="mb-2 last:mb-0" {...props}>
            {children}
          </p>
        ),

        // Blockquotes
        blockquote: ({ children, ...props }) => (
          <blockquote 
            className="border-l-4 border-muted-foreground/20 pl-4 italic my-2" 
            {...props}
          >
            {children}
          </blockquote>
        ),

        // Tables
        table: ({ children, ...props }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full border-collapse border border-border" {...props}>
              {children}
            </table>
          </div>
        ),
        th: ({ children, ...props }) => (
          <th className="border border-border px-2 py-1 bg-muted font-medium text-left" {...props}>
            {children}
          </th>
        ),
        td: ({ children, ...props }) => (
          <td className="border border-border px-2 py-1" {...props}>
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}