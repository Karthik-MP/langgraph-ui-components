"use client";

import "./markdown-styles.css";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { type FC, memo, useState, useContext, createContext, useMemo } from "react";
import { CheckIcon, CopyIcon, ChevronLeft, ChevronRight } from "lucide-react";

import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";

import "katex/dist/katex.min.css";
import { cn } from "@/utils/tailwindUtil";
import { SyntaxHighlighter } from "./syntax-highlighter";
import { TooltipIconButton } from "./tooltip-icon-button";

interface LinkEntry {
  url: string;
  title: string;
}

const DomainGroupsContext = createContext<Map<string, LinkEntry[]>>(new Map());

function formatPathAsTitle(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/$/, "");
    if (!path || path === "/") return "";
    const last = path.split("/").filter(Boolean).pop() ?? "";
    return decodeURIComponent(last)
      .replace(/[-_]/g, " ")
      .replace(/\.\w+$/, "")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return "";
  }
}

function LinkPill({
  href,
  domain,
  displayLabel,
  titleText,
  className,
  ...props
}: {
  href: string;
  domain: string;
  displayLabel: string;
  titleText: string;
  className?: string;
}) {
  const domainGroups = useContext(DomainGroupsContext);
  const group = domainGroups.get(domain) ?? [{ url: href, title: titleText }];
  const extra = group.length - 1;
  const [pageIdx, setPageIdx] = useState(0);
  const current = group[pageIdx] ?? group[0];

  const currentTitle =
    current.title && current.title !== domain
      ? current.title
      : formatPathAsTitle(current.url) || domain;

  const pathDescription = (() => {
    try {
      const parsed = new URL(current.url);
      return parsed.hostname + parsed.pathname;
    } catch {
      return "";
    }
  })();

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <a
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-border/30 bg-muted px-2 py-0.5 text-xs font-medium text-foreground/80 no-underline transition-colors hover:bg-muted/70",
            className,
          )}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
            alt=""
            className="size-3.5 shrink-0 rounded-sm"
            loading="lazy"
          />
          <span className="max-w-[140px] truncate">{displayLabel}</span>
          {extra > 0 && (
            <span className="ml-0.5 rounded-full bg-muted-foreground/20 px-1.5 py-px text-[10px] font-semibold text-muted-foreground">
              +{extra}
            </span>
          )}
        </a>
      </HoverCardTrigger>
      <HoverCardContent side="top" align="start" className="w-[320px] p-0">
        {extra > 0 && (
          <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPageIdx((p) => Math.max(0, p - 1))}
                disabled={pageIdx === 0}
                className="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <span className="text-xs tabular-nums text-muted-foreground">
                {pageIdx + 1}/{group.length}
              </span>
              <button
                type="button"
                onClick={() => setPageIdx((p) => Math.min(group.length - 1, p + 1))}
                disabled={pageIdx === group.length - 1}
                className="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              {group.slice(0, 2).map((g) => (
                <img
                  key={g.url}
                  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                  alt=""
                  className="size-3.5 rounded-sm"
                  loading="lazy"
                />
              ))}
              <span className="text-xs text-muted-foreground">
                {group.length} sources
              </span>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-1.5 p-3">
          <div className="flex items-center gap-2">
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
              alt=""
              className="size-4 shrink-0 rounded-sm"
              loading="lazy"
            />
            <span className="text-xs text-muted-foreground">{domain}</span>
          </div>
          <a
            href={current.url}
            target="_blank"
            rel="noopener noreferrer"
            className="line-clamp-2 text-sm font-semibold leading-snug text-foreground no-underline transition-colors hover:text-teal-700 dark:hover:text-teal-400"
          >
            {currentTitle}
          </a>
          {pathDescription && (
            <p className="line-clamp-1 text-xs text-muted-foreground/60">
              {pathDescription}
            </p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

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
    <div className="flex items-center justify-between gap-4 rounded-t-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
      <span className="lowercase [&>span]:text-xs">{language}</span>
      <TooltipIconButton
        tooltip="Copy"
        onClick={onCopy}
      >
        {!isCopied && <CopyIcon />}
        {isCopied && <CheckIcon />}
      </TooltipIconButton>
    </div>
  );
};

const defaultComponents: any = {
  h1: ({ className, ...props }: { className?: string }) => (
    <h1
      className={cn(
        "mb-8 scroll-m-20 text-4xl font-extrabold tracking-tight last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }: { className?: string }) => (
    <h2
      className={cn(
        "mt-8 mb-4 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: { className?: string }) => (
    <h3
      className={cn(
        "mt-6 mb-4 scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }: { className?: string }) => (
    <h4
      className={cn(
        "mt-6 mb-4 scroll-m-20 text-xl font-semibold tracking-tight first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h5: ({ className, ...props }: { className?: string }) => (
    <h5
      className={cn(
        "my-4 text-lg font-semibold first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h6: ({ className, ...props }: { className?: string }) => (
    <h6
      className={cn("my-4 font-semibold first:mt-0 last:mb-0", className)}
      {...props}
    />
  ),
  p: ({ className, ...props }: { className?: string }) => (
    <p
      className={cn("mt-5 mb-5 leading-7 first:mt-0 last:mb-0", className)}
      {...props}
    />
  ),
  a: ({
    className,
    href,
    children,
    ...props
  }: {
    className?: string;
    href?: string;
    children?: React.ReactNode;
  }) => {
    let domain = "";
    const fullUrl = href ?? "";
    try {
      const url = new URL(fullUrl);
      domain = url.hostname.replace(/^www\./, "");
    } catch {
      domain = String(children ?? href ?? "");
    }

    const displayLabel = domain || String(children ?? "");
    const titleText = String(children ?? domain);

    return (
      <LinkPill
        href={fullUrl}
        domain={domain}
        displayLabel={displayLabel}
        titleText={titleText}
        className={className}
        {...props}
      />
    );
  },
  blockquote: ({ className, ...props }: { className?: string }) => (
    <blockquote
      className={cn("border-l-2 pl-6 italic", className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }: { className?: string }) => (
    <ul
      className={cn("my-5 ml-6 list-disc [&>li]:mt-2", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }: { className?: string }) => (
    <ol
      className={cn("my-5 ml-6 list-decimal [&>li]:mt-2", className)}
      {...props}
    />
  ),
  hr: ({ className, ...props }: { className?: string }) => (
    <hr
      className={cn("my-5 border-b", className)}
      {...props}
    />
  ),
  table: ({ className, ...props }: { className?: string }) => (
    <table
      className={cn(
        "my-5 w-full border-separate border-spacing-0 overflow-y-auto",
        className,
      )}
      {...props}
    />
  ),
  th: ({ className, ...props }: { className?: string }) => (
    <th
      className={cn(
        "bg-muted px-4 py-2 text-left font-bold first:rounded-tl-lg last:rounded-tr-lg [&[align=center]]:text-center [&[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: { className?: string }) => (
    <td
      className={cn(
        "border-b border-l px-4 py-2 text-left last:border-r [&[align=center]]:text-center [&[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  tr: ({ className, ...props }: { className?: string }) => (
    <tr
      className={cn(
        "m-0 border-b p-0 first:border-t [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg",
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
  pre: ({ className, ...props }: { className?: string }) => (
    <pre
      className={cn(
        "max-w-4xl overflow-x-auto rounded-lg ",
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
        <>
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
        </>
      );
    }

    return (
      <code
        className={cn("rounded font-semibold", className)}
        {...props}
      >
        {children}
      </code>
    );
  },
};

function preprocessMarkdown(text: string): string {
  let result = text.replace(/([^\n])(#{1,6}\s)/g, "$1\n\n$2");
  result = result.replace(/\(\[([^\]]+)\]\((https?:\/\/[^)]+)\)\)/g, "[$1]($2)");
  return result;
}

const MarkdownTextImpl: FC<{ children: string }> = ({ children }) => {
  const domainGroups = useMemo(() => {
    const groups = new Map<string, LinkEntry[]>();
    const linkRegex = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
    const seenUrls = new Set<string>();
    let m;
    while ((m = linkRegex.exec(children)) !== null) {
      const title = m[1];
      const url = m[2];
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);
      let domain: string;
      try {
        domain = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        domain = url;
      }
      const list = groups.get(domain) ?? [];
      list.push({ url, title });
      groups.set(domain, list);
    }
    return groups;
  }, [children]);

  return (
    <DomainGroupsContext.Provider value={domainGroups}>
      <div className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={defaultComponents}
        >
          {preprocessMarkdown(children)}
        </ReactMarkdown>
      </div>
    </DomainGroupsContext.Provider>
  );
};

export const AgentMarkdown = memo(MarkdownTextImpl);