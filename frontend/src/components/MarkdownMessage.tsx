import ReactMarkdown from 'react-markdown';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

/**
 * Renders AI-generated markdown responses with proper styling.
 * Handles: headers, bold, italic, bullet lists, numbered lists,
 * inline code, code blocks, and horizontal rules.
 */
export default function MarkdownMessage({ content, className = '' }: MarkdownMessageProps) {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-lg font-bold text-slate-800 dark:text-white mt-4 mb-2 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-slate-800 dark:text-white mt-3 mb-2 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-3 mb-1 first:mt-0">{children}</h3>
          ),
          // Paragraph
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
          ),
          // Bold
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>
          ),
          // Italic
          em: ({ children }) => (
            <em className="italic text-slate-700 dark:text-slate-300">{children}</em>
          ),
          // Unordered list
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 mb-2 pl-2">{children}</ul>
          ),
          // Ordered list
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-2 pl-2">{children}</ol>
          ),
          // List item
          li: ({ children }) => (
            <li className="text-slate-700 dark:text-slate-300 leading-relaxed">{children}</li>
          ),
          // Inline code
          code: ({ children, className: codeClass }) => {
            const isBlock = codeClass?.includes('language-');
            if (isBlock) {
              return (
                <pre className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 my-2 overflow-x-auto text-sm">
                  <code className="text-indigo-600 dark:text-indigo-400 font-mono">{children}</code>
                </pre>
              );
            }
            return (
              <code className="bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[13px] font-mono">
                {children}
              </code>
            );
          },
          // Horizontal rule
          hr: () => (
            <hr className="my-3 border-slate-200 dark:border-slate-700" />
          ),
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-400 pl-3 my-2 text-slate-600 dark:text-slate-400 italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
