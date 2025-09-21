"use client"

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Github, ExternalLink } from "lucide-react";

interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
  cloneUrl: string;
  private: boolean;
  updatedAt: string;
}

const GitHubRepoSelector = () => {
  const { data: session } = useSession();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const fetchRepositories = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const response = await fetch("/api/github/repos");
      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories);
      } else {
        console.error("Failed to fetch repositories");
      }
    } catch (error) {
      console.error("Error fetching repositories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && isOpen) {
      fetchRepositories();
    }
  }, [session, isOpen]);

  const filteredRepos = repositories.filter((repo) =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImportRepo = (repo: Repository) => {
    // TODO: Implement repository import logic
    console.log("Importing repository:", repo);
    // For now, just open the repo in a new tab
    window.open(repo.htmlUrl, "_blank");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Github className="mr-2 h-4 w-4" />
          Import from GitHub
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Import from GitHub</DialogTitle>
          <DialogDescription>
            Select a repository to import into Magic-IDE
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Search repositories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading repositories...</span>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {repositories.length === 0
                  ? "No repositories found"
                  : "No repositories match your search"}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className="border rounded-lg p-4 hover:bg-muted cursor-pointer"
                    onClick={() => handleImportRepo(repo)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{repo.name}</h3>
                        <p className="text-muted-foreground text-sm">
                          {repo.description || "No description"}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-muted-foreground">
                          <span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
                          {repo.private && (
                            <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded">
                              Private
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(repo.htmlUrl, "_blank");
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GitHubRepoSelector;
