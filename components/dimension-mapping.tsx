"use client"
import { useEffect } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

interface DimensionMappingProps {
  columns: string[]
  activeMapType: "symbol" | "choropleth" | "custom"
  dimensionSettings: Record<string, any>
  setDimensionSettings: (s: any) => void
  selectedGeography: string
}

/* ---------------- helpers ------------------ */
const safeArray = (cols: string[] | undefined) => (Array.isArray(cols) ? cols : [])
const colItems = (cols: string[]) =>
  cols.map((c) => (
    <SelectItem key={c} value={c}>
      {c}
    </SelectItem>
  ))

/* ------------------- component -------------------- */
export function DimensionMapping({
  columns,
  activeMapType,
  dimensionSettings,
  setDimensionSettings,
  selectedGeography,
}: DimensionMappingProps) {
  const current = dimensionSettings?.[activeMapType] ?? {}
  const { toast } = useToast()

  const schema = z.object({
    latitudeColumn: z.string().optional(),
    longitudeColumn: z.string().optional(),
    stateColumn: z.string().optional(),
    valueColumn: z.string().optional(),
    labelColumn: z.string().optional(),
    tooltipColumn: z.string().optional(),
    clusterRadius: z.string().default("120"),
    clusterMaxZoom: z.string().default("14"),
    clusterTextColor: z.string().default("#FFFFFF"),
    clusterTextSize: z.string().default("16"),
    clusterColor: z.string().default("#000000"),
  })

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      latitudeColumn: current.latitudeColumn ?? "",
      longitudeColumn: current.longitudeColumn ?? "",
      stateColumn: current.stateColumn ?? "",
      valueColumn: current.valueColumn ?? "",
      labelColumn: current.labelColumn ?? "",
      tooltipColumn: current.tooltipColumn ?? "",
      clusterRadius: current.clusterRadius ?? "120",
      clusterMaxZoom: current.clusterMaxZoom ?? "14",
      clusterTextColor: current.clusterTextColor ?? "#FFFFFF",
      clusterTextSize: current.clusterTextSize ?? "16",
      clusterColor: current.clusterColor ?? "#000000",
    },
  })

  /* sync defaults when user switches tab / geography */
  useEffect(() => {
    form.reset({
      latitudeColumn: current.latitudeColumn ?? "",
      longitudeColumn: current.longitudeColumn ?? "",
      stateColumn: current.stateColumn ?? "",
      valueColumn: current.valueColumn ?? "",
      labelColumn: current.labelColumn ?? "",
      tooltipColumn: current.tooltipColumn ?? "",
      clusterRadius: current.clusterRadius ?? "120",
      clusterMaxZoom: current.clusterMaxZoom ?? "14",
      clusterTextColor: current.clusterTextColor ?? "#FFFFFF",
      clusterTextSize: current.clusterTextSize ?? "16",
      clusterColor: current.clusterColor ?? "#000000",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMapType, selectedGeography, dimensionSettings])

  const save = form.handleSubmit((vals) => {
    setDimensionSettings((p: any) => ({ ...p, [activeMapType]: vals }))
    toast({ title: "Settings saved" })
  })

  /* ------------- shared JSX snippets -------------- */
  const columnSelect = (name: keyof z.infer<typeof schema>, label: string, placeholder = "Select column") => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>{colItems(safeArray(columns))}</SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <Form {...form}>
      <form onSubmit={save} className="space-y-8">
        {activeMapType === "symbol" && (
          <div className="grid grid-cols-2 gap-4">
            {columnSelect("latitudeColumn", "Latitude Column")}
            {columnSelect("longitudeColumn", "Longitude Column")}
          </div>
        )}

        {(activeMapType === "choropleth" || activeMapType === "custom") && (
          <div className="mb-4">
            {columnSelect(
              "stateColumn",
              selectedGeography === "usa-counties"
                ? "County Column"
                : selectedGeography.startsWith("canada")
                  ? "Province Column"
                  : "State/Province Column",
            )}
          </div>
        )}

        {columnSelect("valueColumn", "Value Column")}
        {columnSelect("labelColumn", "Label Column")}
        {columnSelect("tooltipColumn", "Tooltip Column")}

        {activeMapType === "symbol" && (
          <Accordion type="single" collapsible>
            <AccordionItem value="adv">
              <AccordionTrigger>Advanced Cluster Settings</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clusterRadius"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cluster Radius</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clusterMaxZoom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cluster Max Zoom</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clusterTextColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cluster Text Color</FormLabel>
                        <FormControl>
                          <Input type="color" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clusterTextSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cluster Text Size</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clusterColor"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Cluster Color</FormLabel>
                        <FormControl>
                          <Input type="color" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <Button type="submit">Save Settings</Button>
      </form>
    </Form>
  )
}

// default + named export
export default DimensionMapping
