// Written by: Sarah Williams - Frontend Team Lead
// Reviewed by: Jake, Katie
// Status: Production-Ready

import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import './MarkdownRenderer.css';

interface MarkdownRendererProps {
  content: string;
  showLineNumbers?: boolean;
}

export default function MarkdownRenderer({
  content,
  showLineNumbers = false
}: MarkdownRendererProps) {
  return (
    <div className={`markdown-renderer ${showLineNumbers ? 'show-line-numbers' : ''}`}>
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        components={{
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;

            if (isInline) {
              return (
                <code className="inline-code" {...props}>
                  {children}
                </code>
              );
            }

            return (
              <div className="code-block-wrapper">
                {match && (
                  <div className="code-block-header">
                    <span className="code-language">{match[1]}</span>
                    <button
                      className="code-copy-button"
                      onClick={() => {
                        const code = String(children).replace(/\n$/, '');
                        navigator.clipboard.writeText(code);
                      }}
                      title="Copy code"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4 2a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V2z"/>
                        <path d="M2 5a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2v-1h-1v1a1 1 0 01-1 1H2a1 1 0 01-1-1V7a1 1 0 011-1h1V5H2z"/>
                      </svg>
                    </button>
                  </div>
                )}
                <pre>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          a: ({ node, children, href, ...props }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
          table: ({ node, children, ...props }) => (
            <div className="table-wrapper">
              <table {...props}>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
