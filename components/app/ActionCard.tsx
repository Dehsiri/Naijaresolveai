import * as React from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * Quick Action Card Component (Section 4 Spec):
 * - Card + title (16/700) + one-line description (14, muted), whole card is a link.
 */
interface ActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export function ActionCard({
  title,
  description,
  href,
  icon: Icon,
}: ActionCardProps) {
  return (
    <Link
      href={href}
      className="group block focus:outline-none focus:ring-2 focus:ring-emerald rounded-card"
    >
      <Card className="h-full flex flex-col justify-between transition-colors group-hover:border-emerald/60">
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <div className="h-10 w-10 rounded-btn bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <ArrowRight
              className="h-4 w-4 text-muted group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all"
              aria-hidden="true"
            />
          </div>
          <h3 className="text-[16px] font-bold text-navy mb-1 group-hover:text-emerald-700 transition-colors">
            {title}
          </h3>
          <p className="text-[14px] text-muted line-clamp-1">{description}</p>
        </div>
      </Card>
    </Link>
  );
}

