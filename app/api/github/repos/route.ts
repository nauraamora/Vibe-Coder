import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the access token from the session
  const account = await db.account.findFirst({
    where: {
      userId: session.user.id,
      provider: "github",
    },
  });

  if (!account || !account.accessToken) {
    return NextResponse.json({ error: "GitHub account not linked" }, { status: 400 });
  }

  try {
    // Fetch user's repositories from GitHub API
    const response = await fetch("https://api.github.com/user/repos?sort=updated", {
      headers: {
        Authorization: `token ${account.accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos = await response.json();

    return NextResponse.json({
      success: true,
      repositories: repos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        htmlUrl: repo.html_url,
        cloneUrl: repo.clone_url,
        private: repo.private,
        updatedAt: repo.updated_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching GitHub repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
