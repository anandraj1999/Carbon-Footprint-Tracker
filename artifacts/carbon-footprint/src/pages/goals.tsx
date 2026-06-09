import { useState } from "react";
import { useListGoals, getListGoalsQueryKey, useCreateGoal, useDeleteGoal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Target, Plus, Trash2 } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  targetCo2Kg: z.coerce.number().min(1, "Target must be at least 1 kg"),
  period: z.enum(["weekly", "monthly"])
});

export default function Goals() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: goals, isLoading } = useListGoals({ query: { queryKey: getListGoalsQueryKey() } });
  const createGoal = useCreateGoal();
  const deleteGoal = useDeleteGoal();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", targetCo2Kg: 100, period: "monthly" }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createGoal.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
        toast({ title: "Goal created successfully" });
        setIsDialogOpen(false);
        form.reset();
      }
    });
  }

  const handleDelete = (id: number) => {
    if (confirm("Delete this goal?")) {
      deleteGoal.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
          toast({ title: "Goal deleted" });
        }
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Goals</h1>
          <p className="text-muted-foreground mt-1">Set targets and track your progress.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-full px-6 shadow-sm">
              <Plus className="w-4 h-4" /> New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif">Create a Target Goal</DialogTitle>
              <DialogDescription>Set a maximum CO₂ limit for a period.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Low Carbon October" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetCo2Kg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target (kg CO₂)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full mt-4" disabled={createGoal.isPending}>
                  {createGoal.isPending ? "Creating..." : "Save Goal"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))
        ) : goals && goals.length > 0 ? (
          goals.map((goal) => {
            const progress = Math.min((goal.currentCo2Kg / goal.targetCo2Kg) * 100, 100);
            const isOver = goal.currentCo2Kg > goal.targetCo2Kg;
            return (
              <Card key={goal.id} className="shadow-xs border-border/60 relative overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="font-serif">{goal.title}</CardTitle>
                    <CardDescription className="capitalize mt-1">{goal.period} Limit</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive -mt-2 -mr-2" onClick={() => handleDelete(goal.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm items-end">
                      <span className="font-medium text-foreground text-xl leading-none">
                        {goal.currentCo2Kg.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">kg current</span>
                      </span>
                      <span className="text-muted-foreground font-medium">
                        {goal.targetCo2Kg} kg limit
                      </span>
                    </div>
                    <Progress value={progress} className="h-3" indicatorClassName={isOver ? "bg-destructive" : "bg-primary"} />
                    {isOver && (
                      <p className="text-xs text-destructive mt-2 font-medium">Over limit by {(goal.currentCo2Kg - goal.targetCo2Kg).toFixed(1)} kg</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-16 bg-card border border-border/60 rounded-xl shadow-xs">
            <Target className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium">No active goals</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1 mb-6">
              Setting a limit is a great way to start reducing your carbon footprint.
            </p>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>Create First Goal</Button>
          </div>
        )}
      </div>
    </div>
  );
}
