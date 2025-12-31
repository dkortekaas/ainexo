import React from 'react';

/**
 * Lightweight markdown parser voor chatbot berichten
 * Ondersteunt: **bold**, *italic*, bullet points, numbered lists, links
 */

interface MarkdownToken {
  type: 'text' | 'bold' | 'italic' | 'link' | 'linebreak';
  content: string;
  href?: string;
}

/**
 * Parse inline markdown (bold, italic, links)
 */
function parseInlineMarkdown(text: string): MarkdownToken[] {
  const tokens: MarkdownToken[] = [];
  let currentIndex = 0;

  // Regex patterns
  const boldPattern = /\*\*([^*]+)\*\*/g;
  const italicPattern = /\*([^*]+)\*/g;
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

  // Find all matches
  const matches: Array<{
    index: number;
    length: number;
    type: 'bold' | 'italic' | 'link';
    content: string;
    href?: string;
  }> = [];

  // Find bold matches
  let match: RegExpExecArray | null;
  boldPattern.lastIndex = 0;
  while ((match = boldPattern.exec(text)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'bold',
      content: match[1],
    });
  }

  // Find italic matches (but not if part of bold)
  italicPattern.lastIndex = 0;
  while ((match = italicPattern.exec(text)) !== null) {
    // Check if this is not part of a bold pattern
    const matchIndex = match.index;
    const isBold = matches.some(
      (m) =>
        m.type === 'bold' &&
        matchIndex >= m.index - 1 &&
        matchIndex <= m.index + m.length
    );
    if (!isBold) {
      matches.push({
        index: match.index,
        length: match[0].length,
        type: 'italic',
        content: match[1],
      });
    }
  }

  // Find link matches
  linkPattern.lastIndex = 0;
  while ((match = linkPattern.exec(text)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: 'link',
      content: match[1],
      href: match[2],
    });
  }

  // Sort matches by index
  matches.sort((a, b) => a.index - b.index);

  // Build tokens
  matches.forEach((m) => {
    // Add text before match
    if (m.index > currentIndex) {
      tokens.push({
        type: 'text',
        content: text.substring(currentIndex, m.index),
      });
    }

    // Add matched token
    tokens.push({
      type: m.type,
      content: m.content,
      href: m.href,
    });

    currentIndex = m.index + m.length;
  });

  // Add remaining text
  if (currentIndex < text.length) {
    tokens.push({
      type: 'text',
      content: text.substring(currentIndex),
    });
  }

  return tokens.length > 0 ? tokens : [{ type: 'text', content: text }];
}

/**
 * Render inline tokens as React elements
 */
function renderInlineTokens(tokens: MarkdownToken[], key: string = '0'): React.ReactNode {
  return tokens.map((token, index) => {
    const tokenKey = `${key}-${index}`;

    switch (token.type) {
      case 'bold':
        return <strong key={tokenKey}>{token.content}</strong>;
      case 'italic':
        return <em key={tokenKey}>{token.content}</em>;
      case 'link':
        return (
          <a
            key={tokenKey}
            href={token.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'inherit',
              textDecoration: 'underline',
              fontWeight: 500,
            }}
          >
            {token.content}
          </a>
        );
      case 'text':
      default:
        return <React.Fragment key={tokenKey}>{token.content}</React.Fragment>;
    }
  });
}

/**
 * Parse en render markdown text naar React elements
 */
export function parseMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = (index: number) => {
    if (listItems.length > 0) {
      const List = listType === 'ol' ? 'ol' : 'ul';
      elements.push(
        <List key={`list-${index}`} style={{ margin: '8px 0', paddingLeft: '20px' }}>
          {listItems}
        </List>
      );
      listItems = [];
      listType = null;
    }
  };

  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();

    // Empty line
    if (!trimmedLine) {
      flushList(lineIndex);
      elements.push(<br key={`br-${lineIndex}`} />);
      return;
    }

    // Bullet point (• or -)
    const bulletMatch = trimmedLine.match(/^[•\-]\s+(.+)$/);
    if (bulletMatch) {
      if (listType !== 'ul') {
        flushList(lineIndex);
        listType = 'ul';
      }
      const tokens = parseInlineMarkdown(bulletMatch[1]);
      listItems.push(
        <li key={`li-${lineIndex}`}>{renderInlineTokens(tokens, `line-${lineIndex}`)}</li>
      );
      return;
    }

    // Numbered list (1. or 1))
    const numberedMatch = trimmedLine.match(/^(\d+)[.)]\s+(.+)$/);
    if (numberedMatch) {
      if (listType !== 'ol') {
        flushList(lineIndex);
        listType = 'ol';
      }
      const tokens = parseInlineMarkdown(numberedMatch[2]);
      listItems.push(
        <li key={`li-${lineIndex}`}>{renderInlineTokens(tokens, `line-${lineIndex}`)}</li>
      );
      return;
    }

    // Regular paragraph
    flushList(lineIndex);
    const tokens = parseInlineMarkdown(line);
    elements.push(
      <span key={`p-${lineIndex}`} style={{ display: 'block' }}>
        {renderInlineTokens(tokens, `line-${lineIndex}`)}
      </span>
    );
  });

  // Flush any remaining list
  flushList(lines.length);

  return <>{elements}</>;
}

/**
 * Component voor markdown rendering
 */
interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  return <div className={className}>{parseMarkdown(content)}</div>;
}
