import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MarkdownBody({ markdown }: { markdown: string }) {
  return (
    <div className="w-full text-slate-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ node, ...props }) => (
            <div className="pt-10 pb-3 mt-8 border-b border-slate-700/80">
              <h2
                className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3 tracking-tight"
                {...props}
              />
            </div>
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-xl sm:text-2xl font-bold text-sky-400 mt-8 mb-3 tracking-tight flex items-center gap-2"
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p
              className="text-slate-300 leading-relaxed text-base sm:text-lg mb-6 font-normal tracking-wide"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul className="space-y-3 mb-8 pl-1" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal space-y-3 mb-8 pl-6 text-slate-300 text-base sm:text-lg" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="flex items-start gap-3 text-slate-300 text-base sm:text-lg leading-relaxed">
              <span className="text-sky-400 mt-1 shrink-0 font-black text-sm">✓</span>
              <span className="flex-1">{props.children}</span>
            </li>
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-10 border border-slate-700/90 rounded-2xl shadow-2xl bg-gradient-to-b from-slate-900 to-[#071326]">
              <table className="w-full text-left border-collapse text-sm sm:text-base" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-[#000080]/90 text-white font-extrabold border-b border-slate-700 uppercase tracking-wider text-xs sm:text-sm" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="p-4 sm:p-5 font-black text-slate-100 border-r border-slate-700/50 last:border-none" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-slate-800/80" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-slate-800/40 transition-colors" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="p-4 sm:p-5 text-slate-200 border-r border-slate-800/60 last:border-none font-medium" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <div className="my-8 p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-slate-900 border-l-4 border-sky-400 text-slate-200 shadow-xl text-base sm:text-lg italic relative">
              <span className="absolute top-3 right-4 text-3xl text-sky-400/20 font-serif">“</span>
              <blockquote {...props} />
            </div>
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-extrabold text-white text-inherit" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-12 border-slate-800" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-sky-400 hover:text-sky-300 underline font-semibold transition-colors" {...props} />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
