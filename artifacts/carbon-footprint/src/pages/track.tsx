import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateActivity, getListActivitiesQueryKey, getGetDashboardSummaryQueryKey, getGetDashboardTrendQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

import { CATEGORIES, CATEGORY_LABELS, ACTIVITY_TYPES } from "@/lib/constants";
import { Calculator } from "lucide-react";

const formSchema = z.object({
  category: z.string().min(1, "Please select a category"),
  activityType: z.string().min(1, "Please select an activity type"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional()
});

export default function Track() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createActivity = useCreateActivity();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      activityType: "",
      amount: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      notes: ""
    }
  });

  const category = form.watch("category");
  const activityType = form.watch("activityType");
  const amount = form.watch("amount");

  const selectedActivity = useMemo(() => {
    if (!category || !activityType) return null;
    return ACTIVITY_TYPES[category]?.find(a => a.id === activityType);
  }, [category, activityType]);

  const estimatedCO2 = useMemo(() => {
    if (!selectedActivity || !amount || isNaN(amount)) return 0;
    return selectedActivity.factor * amount;
  }, [selectedActivity, amount]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedActivity) return;
    
    createActivity.mutate({
      data: {
        category: values.category,
        activityType: values.activityType,
        amount: values.amount,
        unit: selectedActivity.unit,
        date: new Date(values.date).toISOString(),
        notes: values.notes || undefined
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListActivitiesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardTrendQueryKey() });
        toast({ title: "Activity logged", description: "Your carbon footprint has been updated." });
        setLocation("/history");
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to log activity.", variant: "destructive" });
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Log Activity</h1>
        <p className="text-muted-foreground mt-1">Record your actions to track your footprint over time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2">
          <Card className="shadow-xs border-border/60">
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={(val) => { field.onChange(val); form.setValue("activityType", ""); }} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-secondary/50">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CATEGORIES.map(c => (
                                <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="activityType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Activity Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!category}>
                            <FormControl>
                              <SelectTrigger className="bg-secondary/50">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {category && ACTIVITY_TYPES[category]?.map(a => (
                                <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount {selectedActivity ? `(${selectedActivity.unit})` : ""}</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" placeholder="0" className="bg-secondary/50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" className="bg-secondary/50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any context about this activity..." className="resize-none bg-secondary/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-2">
                    <Button type="submit" className="w-full sm:w-auto px-8 rounded-full" disabled={createActivity.isPending}>
                      {createActivity.isPending ? "Logging..." : "Log Activity"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="bg-primary text-primary-foreground border-transparent shadow-md overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Calculator className="w-24 h-24" />
            </div>
            <CardHeader className="relative z-10 pb-2">
              <CardTitle className="text-lg font-medium opacity-90">Estimated Impact</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-serif mt-2 mb-1">{estimatedCO2.toFixed(2)}</div>
              <div className="text-sm opacity-80 font-medium">kg CO₂ equivalent</div>
              
              {selectedActivity && (
                <div className="mt-6 pt-4 border-t border-primary-foreground/20 text-sm opacity-90">
                  Based on standard emissions factor: <br/>
                  <span className="font-semibold">{selectedActivity.factor} kg CO₂ / {selectedActivity.unit}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
