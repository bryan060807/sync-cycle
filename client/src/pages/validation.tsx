import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Plus, Heart, Trash2, ChevronDown, ChevronUp, User, Send } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { ForumPost, ForumComment } from "@shared/schema";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Support", "Advice", "Celebration", "Vent", "Question"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Support: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Advice: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Celebration: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Vent: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  Question: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

function timeAgo(date: string | Date | null) {
  if (!date) return "";
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function AuthorDisplay({ userId, anonymous }: { userId: string; anonymous: boolean | null }) {
  const { data: profile } = useQuery<{ id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null }>({
    queryKey: [`/api/users/${userId}/profile`],
    enabled: !anonymous,
  });

  if (anonymous) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">Anonymous</span>
      </div>
    );
  }

  const name = profile ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "User" : "User";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-sm font-bold text-primary">{initial}</span>
      </div>
      <span className="text-sm font-medium">{name}</span>
    </div>
  );
}

function CommentSection({ postId }: { postId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const { data: comments = [] } = useQuery<ForumComment[]>({
    queryKey: [`/api/forum/posts/${postId}/comments`],
  });

  const addComment = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/forum/posts/${postId}/comments`, { content, anonymous });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/forum/posts/${postId}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
      setContent("");
      setAnonymous(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add comment", variant: "destructive" });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/forum/comments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/forum/posts/${postId}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete comment", variant: "destructive" });
    },
  });

  return (
    <div className="border-t pt-4 mt-4 space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex items-start gap-3 group" data-testid={`comment-${comment.id}`}>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <AuthorDisplay userId={comment.userId} anonymous={comment.anonymous} />
              <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
            </div>
            <p className="text-sm text-foreground pl-10">{comment.content}</p>
          </div>
          {user?.id === comment.userId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              onClick={() => deleteComment.mutate(comment.id)}
              data-testid={`delete-comment-${comment.id}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ))}

      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-2">
          <Input
            placeholder="Add a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && content.trim()) addComment.mutate();
            }}
            data-testid="input-comment"
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id={`anon-comment-${postId}`}
              checked={anonymous}
              onCheckedChange={(checked) => setAnonymous(checked === true)}
              data-testid="toggle-comment-anonymous"
            />
            <label htmlFor={`anon-comment-${postId}`} className="text-xs text-muted-foreground cursor-pointer">
              Post anonymously
            </label>
          </div>
        </div>
        <Button
          size="icon"
          disabled={!content.trim() || addComment.isPending}
          onClick={() => addComment.mutate()}
          data-testid="button-add-comment"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ValidationStation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  const { data: posts = [] } = useQuery<(ForumPost & { commentCount: number })[]>({
    queryKey: ["/api/forum/posts"],
  });

  const createPost = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/forum/posts", { title, content, category, anonymous });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
      setTitle("");
      setContent("");
      setCategory("");
      setAnonymous(false);
      toast({ title: "Posted!", description: "Your post has been shared with the community." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create post", variant: "destructive" });
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/forum/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
      toast({ title: "Deleted", description: "Post removed successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete post", variant: "destructive" });
    },
  });

  const toggleExpanded = (postId: string) => {
    setExpandedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
            <Heart className="h-7 w-7 text-primary" />
            Community
          </h1>
          <p className="text-muted-foreground mt-1">Lift each other up. Share your journey.</p>
        </div>

        <Card className="bg-white dark:bg-card/50" data-testid="card-create-post">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create a Post
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-post-title"
            />
            <Textarea
              placeholder="Share what's on your mind..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              data-testid="input-post-content"
            />
            <div className="flex flex-wrap items-center gap-4">
              <Select value={category} onValueChange={setCategory} data-testid="select-post-category">
                <SelectTrigger className="w-[160px]" data-testid="select-post-category-trigger">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} data-testid={`select-category-${cat.toLowerCase()}`}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="anon-post"
                  checked={anonymous}
                  onCheckedChange={(checked) => setAnonymous(checked === true)}
                  data-testid="toggle-post-anonymous"
                />
                <label htmlFor="anon-post" className="text-sm text-muted-foreground cursor-pointer">
                  Post anonymously
                </label>
              </div>
              <Button
                className="ml-auto"
                disabled={!title.trim() || !content.trim() || !category || createPost.isPending}
                onClick={() => createPost.mutate()}
                data-testid="button-create-post"
              >
                <Plus className="h-4 w-4 mr-1" />
                Post
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {posts.length === 0 && (
            <Card className="bg-white dark:bg-card/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No posts yet. Be the first to share!</p>
              </CardContent>
            </Card>
          )}

          {posts.map((post) => {
            const isExpanded = expandedPosts.has(post.id);
            return (
              <Card key={post.id} className="bg-white dark:bg-card/50" data-testid={`card-post-${post.id}`}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <AuthorDisplay userId={post.userId} anonymous={post.anonymous} />
                      {post.category && (
                        <span
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
                            CATEGORY_COLORS[post.category] || "bg-muted text-muted-foreground"
                          )}
                          data-testid={`badge-category-${post.id}`}
                        >
                          {post.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
                      {user?.id === post.userId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deletePost.mutate(post.id)}
                          data-testid={`button-delete-post-${post.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3 className="font-heading font-semibold text-foreground">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{post.content}</p>
                  </div>

                  <div className="mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground -ml-2"
                      onClick={() => toggleExpanded(post.id)}
                      data-testid={`button-toggle-comments-${post.id}`}
                    >
                      <MessageSquare className="h-4 w-4 mr-1.5" />
                      {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 ml-1" />
                      ) : (
                        <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </Button>
                  </div>

                  {isExpanded && <CommentSection postId={post.id} />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
