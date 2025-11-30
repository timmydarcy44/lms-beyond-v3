"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLinkJuiceLinks, type LinkJuiceLink } from "@/lib/seo/link-juice-strategy";
import { Card, CardContent } from "@/components/ui/card";

interface StrategicInternalLinksProps {
  currentPage: string;
  title?: string;
}

export function StrategicInternalLinks({ currentPage, title = "Pages connexes" }: StrategicInternalLinksProps) {
  const links = getLinkJuiceLinks(currentPage);
  const highPriorityLinks = links.filter(link => link.priority === "high");
  const mediumPriorityLinks = links.filter(link => link.priority === "medium");

  if (links.length === 0) return null;

  return (
    <section className="py-12 mx-4 mb-8 bg-gradient-to-br from-[#E6D9C6]/30 to-[#F8F5F0] rounded-2xl">
      <div className="max-w-7xl mx-auto px-6">
        <h2
          className="text-3xl font-bold text-[#2F2A25] mb-8"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
          }}
        >
          {title}
        </h2>

        {/* Liens haute priorité */}
        {highPriorityLinks.length > 0 && (
          <div className="mb-8">
            <h3
              className="text-xl font-semibold text-[#2F2A25] mb-4"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Pages essentielles
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {highPriorityLinks.map((link, index) => (
                <Link key={index} href={link.url} className="group">
                  <Card className="border-[#E6D9C6] bg-white hover:shadow-lg hover:border-[#C6A664] transition-all h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4
                            className="font-semibold text-[#2F2A25] mb-2 group-hover:text-[#C6A664] transition-colors"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                            }}
                          >
                            {link.anchor}
                          </h4>
                          <p
                            className="text-sm text-[#2F2A25]/70"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                            }}
                          >
                            {link.context}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-[#C6A664] group-hover:translate-x-1 transition-transform flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Liens moyenne priorité */}
        {mediumPriorityLinks.length > 0 && (
          <div>
            <h3
              className="text-xl font-semibold text-[#2F2A25] mb-4"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Autres ressources
            </h3>
            <div className="flex flex-wrap gap-3">
              {mediumPriorityLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.url}
                  className="px-4 py-2 bg-white border border-[#E6D9C6] rounded-full text-sm font-medium text-[#2F2A25] hover:bg-[#C6A664] hover:text-white hover:border-[#C6A664] transition-all"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  {link.anchor}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

