import { cn } from "@/utils/tailwindUtil";
import { CheckIcon, CopyIcon } from "lucide-react";
import { type FC, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeAutoLinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { SyntaxHighlighter } from "./syntax-highlighter";
import "katex/dist/katex.min.css";

interface CodeHeaderProps {
  language?: string;
  code: string;
}

const useCopyToClipboard = ({
  copiedDuration = 3000,
}: {
  copiedDuration?: number;
} = {}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const copyToClipboard = (value: string) => {
    if (!value) return;

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), copiedDuration);
    });
  };

  return { isCopied, copyToClipboard };
};

const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const onCopy = () => {
    if (!code || isCopied) return;
    copyToClipboard(code);
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-t-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 border-b border-zinc-700">
      <span className="lowercase text-xs font-mono">{language || "text"}</span>
      <button
        onClick={onCopy}
        className="p-1 rounded hover:bg-zinc-700 transition-colors"
        title={isCopied ? "Copied!" : "Copy code"}
      >
        {!isCopied && <CopyIcon size={16} />}
        {isCopied && <CheckIcon size={16} className="text-green-400" />}
      </button>
    </div>
  );
};

const defaultComponents: any = {
  h1: ({ className, ...props }: { className?: string }) => (
    <h1
      className={cn(
        "mb-6 mt-8 scroll-m-20 text-3xl font-bold tracking-tight text-zinc-100 first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }: { className?: string }) => (
    <h2
      className={cn(
        "mt-8 mb-4 scroll-m-20 text-2xl font-semibold tracking-tight text-zinc-100 first:mt-0 last:mb-0 border-b border-zinc-800 pb-2",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: { className?: string }) => (
    <h3
      className={cn(
        "mt-6 mb-3 scroll-m-20 text-xl font-semibold tracking-tight text-zinc-100 first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }: { className?: string }) => (
    <h4
      className={cn(
        "mt-6 mb-3 scroll-m-20 text-lg font-semibold tracking-tight text-zinc-200 first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h5: ({ className, ...props }: { className?: string }) => (
    <h5
      className={cn(
        "my-3 text-base font-semibold text-zinc-200 first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h6: ({ className, ...props }: { className?: string }) => (
    <h6
      className={cn("my-3 text-sm font-semibold text-zinc-300 first:mt-0 last:mb-0", className)}
      {...props}
    />
  ),
  p: ({ className, ...props }: { className?: string }) => (
    <p
      className={cn("mb-5 leading-7 text-zinc-200 first:mt-0 last:mb-0", className)}  // Changed mb-4 to mb-5
      {...props}
    />
  ),
  a: ({ className, href, ...props }: { className?: string; href?: string }) => (
    <a
      href={href}
      target={href?.startsWith('http') ? "_blank" : undefined}
      rel={href?.startsWith('http') ? "noopener noreferrer" : undefined}
      className={cn(
        "text-blue-400 hover:text-blue-300 font-medium underline underline-offset-4 transition-colors",
        className,
      )}
      {...props}
    />
  ),
  blockquote: ({ className, ...props }: { className?: string }) => (
    <blockquote
      className={cn(
        "my-4 border-l-4 border-zinc-600 pl-4 italic text-zinc-300 bg-zinc-900/50 py-2 rounded-r",
        className
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }: { className?: string }) => (
    <ul
      className={cn(
        "my-4 ml-6 space-y-2 list-none text-zinc-200",
        className
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }: { className?: string }) => (
    <ol
      className={cn("my-4 ml-8 list-decimal text-zinc-200 [&>li]:mt-2", className)}
      {...props}
    />
  ),
  li: ({ className, ...props }: { className?: string }) => (
    <li
      className={cn(
        "leading-7 pl-6 relative before:content-['•'] before:absolute before:left-0 before:text-zinc-400 before:font-bold",
        // This adds a bullet using CSS before pseudo-element with proper positioning
        className
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }: { className?: string }) => (
    <hr
      className={cn("my-6 border-zinc-700", className)}
      {...props}
    />
  ),
  table: ({ className, ...props }: { className?: string }) => (
    <div className="my-4 w-full overflow-x-auto">
      <table
        className={cn(
          "w-full border-collapse border border-zinc-700 rounded-lg overflow-hidden",
          className,
        )}
        {...props}
      />
    </div>
  ),
  th: ({ className, ...props }: { className?: string }) => (
    <th
      className={cn(
        "bg-zinc-800 border border-zinc-700 px-4 py-2 text-left font-semibold text-zinc-100 [&[align=center]]:text-center [&[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: { className?: string }) => (
    <td
      className={cn(
        "border border-zinc-700 px-4 py-2 text-left text-zinc-200 [&[align=center]]:text-center [&[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  tr: ({ className, ...props }: { className?: string }) => (
    <tr
      className={cn(
        "m-0 border-b border-zinc-700 p-0 even:bg-zinc-900/30",
        className,
      )}
      {...props}
    />
  ),
  sup: ({ className, ...props }: { className?: string }) => (
    <sup
      className={cn("[&>a]:text-xs [&>a]:no-underline", className)}
      {...props}
    />
  ),
  strong: ({ className, ...props }: { className?: string }) => (
    <strong
      className={cn("font-bold text-zinc-100", className)}
      {...props}
    />
  ),
  em: ({ className, ...props }: { className?: string }) => (
    <em
      className={cn("italic text-zinc-200", className)}
      {...props}
    />
  ),
  pre: ({ className, ...props }: { className?: string }) => (
    <pre
      className={cn(
        "my-4 overflow-x-auto rounded-lg bg-zinc-900 text-white",
        className,
      )}
      {...props}
    />
  ),
  code: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
  }) => {
    const match = /language-(\w+)/.exec(className || "");

    if (match) {
      const language = match[1];
      const code = String(children).replace(/\n$/, "");

      return (
        <div className="my-4 rounded-lg overflow-hidden border border-zinc-700">
          <CodeHeader
            language={language}
            code={code}
          />
          <SyntaxHighlighter
            language={language}
            className={className}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );
    }

    return (
      <code
        className={cn(
          "rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-sm text-zinc-100 border border-zinc-700",
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
};

export function AgentMarkdown({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
        rehypePlugins={[rehypeHighlight, rehypeAutoLinkHeadings, rehypeKatex]}
        components={defaultComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
