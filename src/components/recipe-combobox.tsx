import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboRecipe = { id: string; title: string; content: string };

export function RecipeCombobox({
  recipes,
  value,
  isCustom,
  customLabel,
  onSelect,
  onClear,
  onUseLocal,
  onCreate,
}: {
  recipes: ComboRecipe[];
  value: string;
  isCustom?: boolean;
  customLabel?: string;
  onSelect: (recipe: ComboRecipe) => void;
  onClear: () => void;
  /** Usar el texto escrito solo para este paciente */
  onUseLocal: (title: string) => void;
  /** Guardar como receta nueva en la base de datos */
  onCreate: (title: string) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = recipes.find((r) => r.id === value);
  const label = selected ? selected.title : isCustom ? (customLabel ?? "Personalizada") : "— Sin receta —";

  const q = query.trim();
  const exact = useMemo(
    () => recipes.some((r) => r.title.trim().toLowerCase() === q.toLowerCase()),
    [recipes, q],
  );

  function close() {
    setOpen(false);
    setQuery("");
  }

  return (
    <Popover open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal shadow-[var(--shadow-elevated)]"
        >
          <span className={cn("truncate", !selected && !isCustom && "text-muted-foreground")}>{label}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(22rem,90vw)] p-0" align="start">
        <Command shouldFilter>
          <CommandInput placeholder="Buscar menú…" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="— Sin receta —"
                onSelect={() => {
                  onClear();
                  close();
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", !selected && !isCustom ? "opacity-100" : "opacity-0")} />
                — Sin receta —
              </CommandItem>
              {recipes.map((r) => (
                <CommandItem
                  key={r.id}
                  value={r.title}
                  onSelect={() => {
                    onSelect(r);
                    close();
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === r.id ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{r.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {q && !exact && (
              <CommandGroup heading="Nuevo menú" forceMount>
                <CommandItem value={`__local_${q}`} forceMount onSelect={() => { onUseLocal(q); close(); }}>
                  <User className="mr-2 h-4 w-4" />
                  Usar «{q}» solo para este paciente
                </CommandItem>
                <CommandItem
                  value={`__create_${q}`}
                  forceMount
                  onSelect={async () => {
                    await onCreate(q);
                    close();
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir «{q}» a la base de datos
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
