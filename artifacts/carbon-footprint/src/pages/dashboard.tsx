import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetDashboardTrend, getGetDashboardTrendQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Flame, TrendingDown, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: trend, isLoading: loadingTrend } = useGetDashboardTrend({ query: { queryKey: getGetDashboardTrendQueryKey() } });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">Your recent climate impact at a glance.</p>
        </div>
        <Link href="/track">
          <Button className="gap-2 rounded-full px-6 shadow-sm">
            <Plus className="w-4 h-4" /> Log Activity
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-xs border-border/60 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">This Month's Impact</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? <Skeleton className="h-10 w-24" /> : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-serif">{summary?.totalCo2KgThisMonth.toFixed(1)}</span>
                <span className="text-muted-foreground text-sm font-medium mb-1">kg CO₂</span>
              </div>
            )}
            {summary && summary.percentageChange !== 0 && (
              <div className={cn("text-xs font-medium mt-2 flex items-center gap-1", summary.percentageChange < 0 ? "text-primary" : "text-destructive")}>
                {summary.percentageChange < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                {Math.abs(summary.percentageChange).toFixed(1)}% vs last month
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/60 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Activities Logged</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? <Skeleton className="h-10 w-16" /> : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-serif">{summary?.activitiesThisMonth}</span>
                <span className="text-muted-foreground text-sm font-medium mb-1">this month</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/60 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? <Skeleton className="h-10 w-16" /> : (
              <div className="flex items-baseline gap-2">
                <Flame className="w-8 h-8 text-orange-500 mr-1" />
                <span className="text-4xl font-serif">{summary?.streakDays}</span>
                <span className="text-muted-foreground text-sm font-medium mb-1">days</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-xs border-border/60">
          <CardHeader>
            <CardTitle className="font-serif">30-Day Trend</CardTitle>
            <CardDescription>Daily CO₂ emissions in kilograms.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {loadingTrend ? <Skeleton className="w-full h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => format(new Date(val), "MMM d")}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                      labelFormatter={(val) => format(new Date(val), "MMM d, yyyy")}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="co2Kg" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorCo2)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/60">
          <CardHeader>
            <CardTitle className="font-serif">Category Breakdown</CardTitle>
            <CardDescription>Where your impact comes from.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-5">
                {summary?.categoryBreakdown.map((cat) => (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">{cat.category.replace('_', ' ')}</span>
                      <span className="text-muted-foreground">{cat.co2Kg.toFixed(1)} kg ({Math.round(cat.percentage)}%)</span>
                    </div>
                    <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(!summary?.categoryBreakdown || summary.categoryBreakdown.length === 0) && (
                  <div className="text-center text-muted-foreground py-8 text-sm">
                    No data for this month yet.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Needed to add `cn` import above or define it locally, I will define a small one or import it from utils.
// Actually I missed the import for `cn` in this file, I'll add it.
import { cn } from "@/lib/utils";
