"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type BlogPost = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  author: string | null;
  reading_time: number | null;
  slug: string;
};

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await fetch('/api/blog');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        console.error("[BlogPage] Error loading posts");
      }
    } catch (error) {
      console.error("[BlogPage] Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#E6D9C6]/20 to-[#F8F5F0]">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#2F2A25] mb-6"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Blog
            </h1>
            <p
              className="text-xl md:text-2xl text-[#2F2A25]/80 max-w-3xl mx-auto leading-relaxed"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Découvrez mes articles sur la psychopédagogie, la neuroéducation et l'accompagnement des jeunes
            </p>
          </motion.div>
        </div>
      </section>

      {/* Articles List */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C6A664] mx-auto"></div>
            </div>
          ) : posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center py-12"
            >
              <p
                className="text-lg text-[#2F2A25]/70 mb-4"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Aucun article disponible pour le moment.
              </p>
              <p
                className="text-sm text-[#2F2A25]/60"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Les articles seront bientôt disponibles.
              </p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Link href={`/blog/${post.slug}`}>
                    <Card className="border-[#E6D9C6] bg-white h-full hover:shadow-xl transition-shadow cursor-pointer group">
                      {post.cover_image_url && (
                        <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                          <Image
                            src={post.cover_image_url}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 text-sm text-[#2F2A25]/60 mb-3">
                          {post.published_at && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(post.published_at)}</span>
                            </div>
                          )}
                          {post.reading_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{post.reading_time} min</span>
                            </div>
                          )}
                        </div>
                        <h2
                          className="text-xl font-bold text-[#2F2A25] mb-3 line-clamp-2 group-hover:text-[#C6A664] transition-colors"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                          }}
                        >
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p
                            className="text-[#2F2A25]/70 mb-4 line-clamp-3"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                            }}
                          >
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center text-[#C6A664] font-medium group-hover:gap-2 transition-all">
                          <span>Lire l'article</span>
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

