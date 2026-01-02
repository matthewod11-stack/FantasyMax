import React from 'react';
import { LucideIcon, Rocket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PlaceholderCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  v2Features?: string[];
}

export function PlaceholderCard({
  title,
  description,
  icon: Icon = Rocket,
  v2Features = [],
}: PlaceholderCardProps) {
  return (
    <Card className="max-w-2xl mx-auto border-dashed">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono uppercase tracking-wider text-primary border-primary/30">
            Sprint 3-6: V2 Feature
          </Badge>
          <CardTitle className="font-display text-3xl tracking-wide uppercase">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="text-center space-y-6">
        <div className="space-y-2">
          <p className="text-muted-foreground font-body leading-relaxed">
            {description}
          </p>
          <p className="text-sm font-medium text-gold flex items-center justify-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
            </span>
            Coming Soon to the League of Degenerates
          </p>
        </div>

        {v2Features.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4">
              Planned Capabilities
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {v2Features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2 group">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6">
          <p className="text-xs italic text-muted-foreground/60">
            This feature is currently being staged in the V2 Backlog. 
            Check the roadmap for more details.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

