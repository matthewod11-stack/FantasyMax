import { getRules } from '@/lib/supabase/queries/governance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Constitution | League of Degenerates',
};

export default async function ConstitutionPage() {
  const rules = await getRules();

  const byCategory = rules.reduce(
    (acc, rule) => {
      const cat = rule.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(rule);
      return acc;
    },
    {} as Record<string, typeof rules>,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-wide uppercase flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          Constitution
        </h1>
        <p className="text-muted-foreground">The official rulebook — single source of truth</p>
      </div>

      {Object.keys(byCategory).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Rules not seeded yet. Commissioner can import league bylaws in admin.
          </CardContent>
        </Card>
      ) : (
        Object.entries(byCategory).map(([category, catRules]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="font-display text-xl uppercase tracking-wide">
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {catRules.map((rule) => (
                <div key={rule.id}>
                  <h3 className="font-medium mb-2">{rule.title}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {rule.content}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
