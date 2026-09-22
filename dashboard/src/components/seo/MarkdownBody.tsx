import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MarkdownBody({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-invert prose-headings:text-white prose-a:text-[#2997ff] max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  )
}
