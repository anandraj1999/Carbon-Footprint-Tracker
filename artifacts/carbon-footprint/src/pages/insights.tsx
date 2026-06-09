import { useListTips, getListTipsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Sprout, Wind, ShoppingBag, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, React.ReactNode> = {
  transportation: <Wind className="w-5 h-5" />,
  food: <Sprout className="w-5 h-5" />,
  energy: <Zap className="w-5 h-5" />,
  shopping: <ShoppingBag className="w-5 h-5" />
};

export default function Insights() {
  const { data: tips, isLoading } = useListTips({ query: { queryKey: getListTipsQueryKey() } });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Insights & Tips</h1>
        <p className="text-muted-foreground mt-1">Personalized recommendations to lower your footprint.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))
        ) : tips && tips.length > 0 ? (
          tips.map((tip, i) => (
            <Card key={tip.id} className="shadow-xs border-border/60 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
                    {categoryIcons[tip.category] || <Lightbulb className="w-5 h-5" />}
                  </div>
                  <div>
                    <CardTitle className="text-lg leading-tight font-serif">{tip.title}</CardTitle>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1 inline-block">
                      {tip.category}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {tip.description}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-border/60">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary">Saves ~{tip.potentialSavingKg} kg CO₂</span>
                  </div>
                  <Badge variant={tip.difficulty === 'easy' ? 'default' : tip.difficulty === 'medium' ? 'secondary' : 'outline'}
                    className={cn(
                      "capitalize shadow-none",
                      tip.difficulty === 'easy' && "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400",
                      tip.difficulty === 'medium' && "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400",
                      tip.difficulty === 'hard' && "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 border-transparent"
                    )}
                  >
                    {tip.difficulty}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-2 text-center py-16 bg-card border border-border/60 rounded-xl shadow-xs">
            <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium">No tips available</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
              Log more activities to get personalized reduction tips.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
