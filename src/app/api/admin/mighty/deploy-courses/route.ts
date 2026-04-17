import { NextRequest, NextResponse } from "next/server"
import {
  buildCourseModule,
  publishCourse,
  setupCommunityTags,
  AI_OPERATOR_MODULES,
} from "@/lib/mighty/content-pipeline"
import { requireAdmin } from "@/lib/auth"
import { logger } from "@/lib/logger"

/**
 * POST /api/admin/mighty/deploy-courses
 * Deploys the AI Operator Collective course modules to Mighty Networks.
 *
 * Body:
 *   - modules?: number[]  — indices of modules to deploy (default: all)
 *   - publish?: boolean   — immediately publish (default: false, creates as hidden)
 *   - tags?: boolean      — also create community tags (default: false)
 */
export async function POST(req: NextRequest) {
  const userId = await requireAdmin()
  if (!userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const moduleIndices: number[] | undefined = body.modules
    const shouldPublish: boolean = body.publish ?? false
    const shouldCreateTags: boolean = body.tags ?? false

    const modulesToDeploy = moduleIndices
      ? moduleIndices
          .filter((i) => i >= 0 && i < AI_OPERATOR_MODULES.length)
          .map((i) => AI_OPERATOR_MODULES[i])
      : AI_OPERATOR_MODULES

    const results = []

    for (const moduleDef of modulesToDeploy) {
      const result = await buildCourseModule(moduleDef, {
        status: shouldPublish ? "posted" : "hidden",
        sequential: true,
      })

      if (result.space && shouldPublish) {
        await publishCourse(result.space.id)
      }

      results.push({
        module: moduleDef.name,
        spaceId: result.space?.id ?? null,
        sections: result.sections.length,
        lessons: result.lessons.length,
        published: shouldPublish,
      })
    }

    let tags = null
    if (shouldCreateTags) {
      tags = await setupCommunityTags()
    }

    logger.info("[Mighty] Course deployment complete", {
      action: "deployCourses",
      userId,
    })

    return NextResponse.json({
      success: true,
      data: {
        modules: results,
        tags: tags?.map((t) => ({ id: t.id, title: t.title })) ?? null,
      },
    })
  } catch (err) {
    logger.error("[Mighty] Course deployment failed", err)
    return NextResponse.json(
      { error: "Course deployment failed" },
      { status: 500 }
    )
  }
}
