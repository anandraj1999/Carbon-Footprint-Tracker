import { useState } from "react";
import { useListActivities, getListActivitiesQueryKey, useDeleteActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Trash2, Edit2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";

export default function History() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { data: activities, isLoading } = useListActivities({ query: { queryKey: getListActivitiesQueryKey() } });
  const deleteActivity = useDeleteActivity();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filteredActivities = activities?.filter(a => categoryFilter === "all" || a.category === categoryFilter) || [];

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this activity?")) {
      deleteActivity.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListActivitiesQueryKey() });
          toast({ title: "Activity deleted" });
        }
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Activity History</h1>
          <p className="text-muted-foreground mt-1">Review and manage your past logs.</p>
        </div>
        <div className="w-full sm:w-48">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border/60 rounded-xl shadow-xs">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium">No activities found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
              You haven't logged any activities in this category yet. Head over to the Track tab to record your first entry.
            </p>
          </div>
        ) : (
          filteredActivities.map((activity, i) => (
            <Card key={activity.id} className="shadow-sm border-border/60 overflow-hidden animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}>
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium capitalize">
                        {activity.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(activity.date), "MMM d, yyyy")}
                      </span>
                    </div>
                    <h4 className="text-base font-semibold capitalize truncate">
                      {activity.activityType.replace('_', ' ')}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {activity.amount} {activity.unit}
                      {activity.notes && <span className="ml-2 italic opacity-80">- "{activity.notes}"</span>}
                    </p>
                  </div>
                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:pl-4 sm:border-l border-border/60">
                    <div className="text-right">
                      <div className="text-xl font-serif text-primary font-medium">{activity.co2Kg.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">kg CO₂</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(activity.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
