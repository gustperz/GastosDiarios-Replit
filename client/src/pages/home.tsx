import { useState, useEffect } from "react";

import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Post } from "shared/schema";

function Home() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: posts, refetch } = useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: () => api.get("/posts").then((res) => res.data),
  });

  const createPost = useMutation({
    mutationFn: (post: { title: string; content: string }) =>
      api.post("/posts", post),
    onSuccess: () => {
      setTitle("");
      setContent("");
      refetch();
      toast({
        title: "Post created",
        description: "Your post has been created successfully",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPost.mutate({ title, content });
  };

  return (
    <div className="container py-8">
      <h1 className="mb-8 text-4xl font-bold">Blog</h1>

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-bold">New Post</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Textarea
              placeholder="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              className={buttonVariants()}
              disabled={createPost.isPending}
            >
              {createPost.isPending ? "Creating..." : "Create Post"}
            </button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Posts</h2>
        {posts?.length === 0 && (
          <p className="text-gray-500">No posts yet. Create one!</p>
        )}
        <div className="space-y-4">
          {posts?.map((post) => (
            <div
              key={post.id}
              className="rounded-lg border border-gray-200 p-4 shadow-sm"
            >
              <h3 className="mb-2 text-xl font-bold">{post.title}</h3>
              <p className="mb-2 text-gray-700">{post.content}</p>
              <p className="text-sm text-gray-500">
                {post.timestamp && format(new Date(post.timestamp), "PPP", { locale: es })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;