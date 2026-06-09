import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListOffsetProjects, 
  getListOffsetProjectsQueryKey,
  useListOffsetPurchases,
  getListOffsetPurchasesQueryKey,
  usePurchaseOffset
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { Check, ChevronDown, ChevronUp, Leaf, Info, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

function ProjectCard({ project, netEmissionsKg }: { project: any, netEmissionsKg: number }) {
  const [amountKg, setAmountKg] = useState<number>(Math.max(1, netEmissionsKg || 100));
  const [isExpanded, setIsExpanded] = useState(false);
  const purchaseOffset = usePurchaseOffset();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const cost = (amountKg / 1000) * project.pricePerTonneCo2;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "nature": return "bg-primary/80";
      case "energy": return "bg-blue-600/80";
      case "community": return "bg-amber-600/80";
      default: return "bg-muted";
    }
  };

  const handlePurchase = () => {
    if (amountKg < 1) return;
    purchaseOffset.mutate({ data: { projectId: project.id, amountKg } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOffsetPurchasesQueryKey() });
        toast({ title: "Offset purchased successfully", description: `You offset ${amountKg} kg CO₂.` });
      },
      onError: () => {
        toast({ title: "Purchase failed", description: "Could not complete the purchase.", variant: "destructive" });
      }
    });
  };

  return (
    <Card className="shadow-xs border-border/60 overflow-hidden flex flex-col relative h-full">
      <div className={cn("h-2 w-full", getCategoryColor(project.impactCategory))} />
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{project.type}</span>
          <Badge variant="outline" className="text-xs bg-secondary/50 font-normal flex gap-1 items-center">
            <Check className="w-3 h-3 text-primary" /> {project.certifier}
          </Badge>
        </div>
        <CardTitle className="font-serif text-xl leading-tight">{project.name}</CardTitle>
        <CardDescription className="flex items-center gap-1 mt-1 text-xs">
          {project.location}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="text-sm text-foreground/80 mb-6">
          <p className={cn(!isExpanded && "line-clamp-2")}>{project.description}</p>
          {project.description.length > 100 && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="text-primary text-xs font-medium mt-1 hover:underline focus:outline-none"
            >
              {isExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
        
        <div className="mt-auto space-y-4 bg-secondary/30 p-4 rounded-xl">
          <div className="flex justify-between items-end">
            <div className="text-sm font-medium text-muted-foreground">Price</div>
            <div className="text-sm font-medium">${project.pricePerTonneCo2.toFixed(2)} <span className="text-xs text-muted-foreground font-normal">/ tonne CO₂</span></div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium flex justify-between">
              <span>Amount to offset (kg)</span>
            </label>
            <div className="flex gap-3 items-center">
              <Input 
                type="number" 
                min={1}
                value={amountKg} 
                onChange={(e) => setAmountKg(Number(e.target.value))}
                className="bg-background"
              />
              <div className="shrink-0 text-sm font-medium min-w-[80px] text-right">
                Cost: ${cost.toFixed(2)}
              </div>
            </div>
          </div>
          
          <Button 
            className="w-full" 
            onClick={handlePurchase}
            disabled={purchaseOffset.isPending || amountKg < 1}
          >
            {purchaseOffset.isPending ? "Processing..." : "Purchase Offset"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Offsets() {
  const { data: projects, isLoading: loadingProjects } = useListOffsetProjects({ query: { queryKey: getListOffsetProjectsQueryKey() } });
  const { data: summary, isLoading: loadingSummary } = useListOffsetPurchases({ query: { queryKey: getListOffsetPurchasesQueryKey() } });
  const [historyOpen, setHistoryOpen] = useState(false);

  const isNeutral = summary ? summary.netEmissionsKg <= 0 : false;
  const progressVal = summary && summary.totalEmissionsKg > 0 
    ? Math.min((summary.totalOffsetKg / summary.totalEmissionsKg) * 100, 100) 
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Carbon Offsets</h1>
          <p className="text-muted-foreground mt-1">Invest in verified climate projects to balance your footprint.</p>
        </div>
      </div>

      {loadingSummary ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : summary ? (
        <Card className="shadow-xs border-border/60 bg-card overflow-hidden relative">
          {isNeutral && (
            <div className="absolute top-0 right-0 p-4">
              <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-1 px-3 shadow-sm border-0">
                Carbon Neutral
              </Badge>
            </div>
          )}
          <CardHeader className="pb-2">
            <CardTitle className="font-serif">Your Impact Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6 mt-2">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Emissions</div>
                <div className="text-2xl font-serif">{summary.totalEmissionsKg.toFixed(1)} <span className="text-sm font-sans text-muted-foreground">kg</span></div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Offset</div>
                <div className="text-2xl font-serif text-primary">{summary.totalOffsetKg.toFixed(1)} <span className="text-sm font-sans text-muted-foreground">kg</span></div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Net Emissions</div>
                <div className={cn("text-2xl font-serif", summary.netEmissionsKg < summary.totalEmissionsKg ? "text-primary" : "")}>
                  {Math.max(0, summary.netEmissionsKg).toFixed(1)} <span className="text-sm font-sans text-muted-foreground">kg</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Offset Progress</span>
                <span>{progressVal.toFixed(1)}%</span>
              </div>
              <Progress value={progressVal} className="h-3 bg-secondary" />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div>
        <h2 className="text-xl font-serif mb-4">Available Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loadingProjects ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-xl" />
            ))
          ) : projects && projects.length > 0 ? (
            projects.map((project) => (
              <ProjectCard key={project.id} project={project} netEmissionsKg={summary ? Math.max(0, summary.netEmissionsKg) : 100} />
            ))
          ) : (
            <div className="col-span-2 text-center py-12 bg-card border border-border/60 rounded-xl shadow-xs">
              <Leaf className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium">No projects available</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
                Check back later for verified carbon offset projects.
              </p>
            </div>
          )}
        </div>
      </div>

      <Collapsible open={historyOpen} onOpenChange={setHistoryOpen} className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-xs">
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
          <div className="font-medium">Purchase History</div>
          {historyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="pt-2 border-t border-border/60">
            {loadingSummary ? (
              <div className="space-y-3 py-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : summary?.purchases && summary.purchases.length > 0 ? (
              <div className="space-y-4 py-2">
                {summary.purchases.map((purchase: any) => (
                  <div key={purchase.id} className="flex justify-between items-center text-sm border-b border-border/40 last:border-0 pb-3 last:pb-0">
                    <div>
                      <div className="font-medium text-foreground">{purchase.projectName}</div>
                      <div className="text-muted-foreground text-xs">{format(new Date(purchase.purchasedAt), "MMM d, yyyy")}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-primary">{purchase.amountKg} kg</div>
                      <div className="text-muted-foreground text-xs">${purchase.amountUsd.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No offsets purchased yet. Choose a project above to get started.
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
