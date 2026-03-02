import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Search, ChevronsUpDown } from "lucide-react";
import type { DeliveryResult, MultipleLookupResponse, LookupResponse } from "@shared/types";

const MAX_RECENT = 5;

interface PostcodeLookupProps {
  onSingleResult: (result: DeliveryResult) => void;
  onSingleNotFound: (postcode: string) => void;
  onMultipleResults: (results: DeliveryResult[], notFound: string[]) => void;
}

export function PostcodeLookup({ onSingleResult, onSingleNotFound, onMultipleResults }: PostcodeLookupProps) {
  const [mode, setMode] = useState<"single" | "multiple">("single");
  const [singleInput, setSingleInput] = useState("");
  const [multiInput, setMultiInput] = useState("");
  const [open, setOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const { data: allPostcodesData } = useQuery({
    queryKey: ["/api/postcode/all"],
    queryFn: () => apiRequest<{ postcodes: string[] }>("GET", "/api/postcode/all"),
    staleTime: 5 * 60 * 1000,
  });
  const allPostcodes = allPostcodesData?.postcodes ?? [];

  const addRecent = useCallback((pc: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((p) => p.toUpperCase() !== pc.toUpperCase());
      return [pc, ...filtered].slice(0, MAX_RECENT);
    });
  }, []);

  const handleSingleSearch = async (postcode?: string) => {
    const pc = (postcode ?? singleInput).trim().toUpperCase();
    if (!pc) return;
    setIsSearching(true);
    try {
      const data = await apiRequest<LookupResponse>("POST", "/api/postcode/lookup", { postcode: pc });
      addRecent(pc);
      onSingleResult(data.result);
    } catch (err) {
      if (err instanceof Error && err.message.includes("404")) {
        addRecent(pc);
        onSingleNotFound(pc);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleMultipleSearch = async () => {
    const postcodes = multiInput
      .split(/[,\n\r]+/)
      .map((p) => p.trim().toUpperCase())
      .filter(Boolean);
    if (postcodes.length === 0) return;
    setIsSearching(true);
    try {
      const data = await apiRequest<MultipleLookupResponse>("POST", "/api/postcode/lookup-multiple", { postcodes });
      onMultipleResults(data.results, data.notFound);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredPostcodes = singleInput
    ? allPostcodes.filter((pc) => pc.toUpperCase().includes(singleInput.toUpperCase()))
    : allPostcodes.slice(0, 50);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={mode === "single" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("single")}
        >
          Single Postcode
        </Button>
        <Button
          variant={mode === "multiple" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("multiple")}
        >
          Multiple Postcodes
        </Button>
      </div>

      {mode === "single" ? (
        <div className="space-y-2">
          <Label>Search Postcode</Label>
          <div className="flex gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between font-normal"
                >
                  {singleInput || "Enter postcode..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search postcode..."
                    value={singleInput}
                    onValueChange={setSingleInput}
                  />
                  <CommandList>
                    <CommandEmpty>No postcodes found.</CommandEmpty>
                    <CommandGroup>
                      {filteredPostcodes.slice(0, 100).map((pc) => (
                        <CommandItem
                          key={pc}
                          value={pc}
                          onSelect={(v) => {
                            setSingleInput(v.toUpperCase());
                            setOpen(false);
                          }}
                        >
                          {pc}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button onClick={() => handleSingleSearch()} disabled={isSearching || !singleInput}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Enter postcodes (comma or newline separated)</Label>
          <Textarea
            placeholder={"SW1A 1AA\nEC1A 1BB\nW1A 0AX"}
            value={multiInput}
            onChange={(e) => setMultiInput(e.target.value)}
            rows={5}
          />
          <Button onClick={handleMultipleSearch} disabled={isSearching || !multiInput.trim()} className="w-full">
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search All
              </>
            )}
          </Button>
        </div>
      )}

      {recentSearches.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Recent searches:</p>
          <div className="flex flex-wrap gap-1">
            {recentSearches.map((pc) => (
              <Badge
                key={pc}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => {
                  setSingleInput(pc);
                  setMode("single");
                  handleSingleSearch(pc);
                }}
              >
                {pc}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
