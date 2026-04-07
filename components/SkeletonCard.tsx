import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCard() {
  return (
    <Card className="flex flex-col h-full bg-[#0e0e16] border-stone-800">
      <CardHeader className="pb-3 border-b border-stone-800/50">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-32 bg-stone-800" />
          <Skeleton className="h-5 w-16 bg-stone-800" />
        </div>
      </CardHeader>
      <CardContent className="py-4 flex-grow flex flex-col gap-3">
        <Skeleton className="h-10 w-16 bg-stone-800" />
        <div className="space-y-2 mt-2">
          <Skeleton className="h-4 w-full bg-stone-800" />
          <Skeleton className="h-4 w-[90%] bg-stone-800" />
          <Skeleton className="h-4 w-[60%] bg-stone-800" />
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t border-stone-800/50 flex justify-between">
        <Skeleton className="h-4 w-24 bg-stone-800" />
        <Skeleton className="h-4 w-24 bg-stone-800" />
      </CardFooter>
    </Card>
  );
}
