import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Clock, ArrowLeft } from "lucide-react"
import { getAllSlugs, getPostBySlug, type BlogSection } from "@/lib/blog"
import { cn } from "@/lib/utils"

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
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aimseos.com"

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Organization", name: "AIMS" },
    publisher: { "@type": "Organization", name: "AIMS", url: appUrl },
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
            <p className="text-lg text-gray-500">{post.excerpt}</p>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {post.sections.map((section, i) => renderSection(section, i))}
          </div>

          {/* CTA */}
          <div className="mt-14 bg-[#DC2626] rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-3">Ready to put this into practice?</h2>
            <p className="text-red-100 mb-6">
              Book a free 30-minute strategy call. We&apos;ll show you exactly what AIMS would build for your business.
            </p>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#DC2626] font-semibold rounded-xl hover:bg-red-50 transition-colors"
            >
              Book Free Strategy Call
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="mt-8 text-center">
            <Link href="/blog" className="text-sm text-gray-400 hover:text-[#DC2626] transition-colors">
              ← Back to all articles
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
