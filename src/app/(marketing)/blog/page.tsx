import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BookOpen, Clock } from "lucide-react"
import { getAllPosts } from "@/lib/blog"

export const metadata: Metadata = {
  title: "Blog — AIMS",
  description: "Insights on AI-powered sales, marketing, and operations. Practical guides for businesses building their growth infrastructure.",
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-[#DC2626] text-sm font-medium rounded-full mb-6">
            <BookOpen className="w-3.5 h-3.5" />
            AIMS Blog
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Insights & Playbooks</h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Practical guides on AI-powered sales, marketing, and operations — written for business owners who want results, not theory.
          </p>
        </div>

        {/* Posts */}
        <div className="space-y-6">
          {posts.map((post, i) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
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
                  <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#DC2626] transition-colors leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed">{post.excerpt}</p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-[#DC2626]">
                    Read article <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
                {i === 0 && (
                  <div className="hidden sm:flex flex-shrink-0 w-12 h-12 bg-red-50 rounded-xl items-center justify-center">
                    <span className="text-lg font-black text-[#DC2626]">1</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Want to see what AI could do for your business?</h2>
          <p className="text-gray-500 mb-6 text-sm">
            Take our free AI Readiness Quiz — 7 questions, 2 minutes, personalized recommendations.
          </p>
          <Link
            href="/tools/ai-readiness-quiz"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#DC2626] text-white font-semibold rounded-xl hover:bg-[#B91C1C] transition-colors"
          >
            Take the Free Quiz
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
