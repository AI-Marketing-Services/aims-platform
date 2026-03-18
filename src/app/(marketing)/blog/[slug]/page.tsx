import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Clock, ArrowLeft, User } from "lucide-react"
import { getAllSlugs, getAllPosts, getPostBySlug, type BlogSection } from "@/lib/blog"
import ReactMarkdown from "react-markdown"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: "Post Not Found — AIMS Blog" }
  return {
    title: `${post.title} — AIMS Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      ...(post.image ? { images: [{ url: post.image }] } : {}),
    },
  }
}

function renderSection(section: BlogSection, i: number) {
  switch (section.type) {
    case "h2":
      return (
        <h2 key={i} className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          {section.content as string}
        </h2>
      )
    case "h3":
      return (
        <h3 key={i} className="text-xl font-semibold text-gray-900 mt-8 mb-3">
          {section.content as string}
        </h3>
      )
    case "p":
      return (
        <p key={i} className="text-gray-600 leading-relaxed">
          {section.content as string}
        </p>
      )
    case "ul":
      return (
        <ul key={i} className="space-y-2">
          {(section.content as string[]).map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] flex-shrink-0 mt-2" />
              {item}
            </li>
          ))}
        </ul>
      )
    case "ol":
      return (
        <ol key={i} className="space-y-3">
          {(section.content as string[]).map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-gray-600">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-50 text-[#DC2626] text-xs font-bold flex items-center justify-center mt-0.5">
                {j + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      )
    case "blockquote":
      return (
        <blockquote key={i} className="border-l-4 border-[#DC2626] pl-4 py-1 text-gray-600 italic">
          {section.content as string}
        </blockquote>
      )
    case "callout":
      return (
        <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          {section.label && (
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">{section.label}</p>
          )}
          <p className="text-amber-900 text-sm leading-relaxed">{section.content as string}</p>
        </div>
      )
    default:
      return null
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const allPosts = getAllPosts()
  const relatedPosts = allPosts
    .filter((p) => p.slug !== slug)
    .slice(0, 3)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: "AIMS" },
    publisher: { "@type": "Organization", name: "AIMS", url: appUrl },
    ...(post.image ? { image: `${appUrl}${post.image}` } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="max-w-2xl mx-auto px-4 py-16">

          {/* Breadcrumb */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#DC2626] transition-colors mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Blog
          </Link>

          {/* Header */}
          <div className="mb-10">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-medium px-2 py-0.5 bg-red-50 text-[#DC2626] rounded-full">
                {post.category}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {post.readTime} min read
              </span>
              <span className="text-xs text-gray-400">
                {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
              {post.title}
            </h1>
            <p className="text-lg text-gray-500">{post.description}</p>
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
              <User className="w-3.5 h-3.5" />
              {post.author}
            </div>
          </div>

          {/* Content */}
          {post.source === "mdx" && post.content ? (
            <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-[#DC2626] prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-li:text-gray-600 prose-ul:space-y-1 prose-ol:space-y-2 prose-blockquote:border-l-[#DC2626] prose-blockquote:text-gray-600">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          ) : (
            <div className="space-y-6">
              {post.sections.map((section, i) => renderSection(section, i))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-14 bg-[#DC2626] rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-3">Ready to transform your business?</h2>
            <p className="text-red-100 mb-6">
              Take our free AI Readiness Quiz — 7 questions, 2 minutes, personalized recommendations for your business.
            </p>
            <Link
              href="/tools/ai-readiness-quiz"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#DC2626] font-semibold rounded-xl hover:bg-red-50 transition-colors"
            >
              Take the Free Quiz
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-14">
              <h2 className="text-xl font-bold text-gray-900 mb-6">More from the AIMS Blog</h2>
              <div className="space-y-4">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-gray-300 transition-all group"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-medium px-2 py-0.5 bg-red-50 text-[#DC2626] rounded-full">
                        {related.category}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(related.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#DC2626] transition-colors leading-snug mb-1">
                      {related.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2">{related.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/blog" className="text-sm text-gray-400 hover:text-[#DC2626] transition-colors">
              Back to all articles
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
