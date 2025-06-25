"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Form, FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

interface DimensionMappingProps {
  columns: string[]
  activeMapType: string
  dimensionSettings: any
  setDimensionSettings: (settings: any) => void
  selectedGeography: string
}

const DimensionMapping: React.FC<DimensionMappingProps> = ({
  columns,
  activeMapType,
  dimensionSettings,
  setDimensionSettings,
  selectedGeography,
}) => {
  // Safe reference to the settings object for the current tab
  const currentSettings = dimensionSettings?.[activeMapType] ?? {}
  const { toast } = useToast()

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

  const formSchema = z.object({
    latitudeColumn: z.string(),
    longitudeColumn: z.string(),
    stateColumn: z.string(),
    valueColumn: z.string(),
    labelColumn: z.string(),
    tooltipColumn: z.string(),
    clusterRadius: z.string(),
    clusterMaxZoom: z.string(),
    clusterTextColor: z.string(),
    clusterTextSize: z.string(),
    clusterColor: z.string(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      latitudeColumn: currentSettings.latitudeColumn || "",
      longitudeColumn: currentSettings.longitudeColumn || "",
      stateColumn: currentSettings.stateColumn || "",
      valueColumn: currentSettings.valueColumn || "",
      labelColumn: currentSettings.labelColumn || "",
      tooltipColumn: currentSettings.tooltipColumn || "",
      clusterRadius: currentSettings.clusterRadius || "120",
      clusterMaxZoom: currentSettings.clusterMaxZoom || "14",
      clusterTextColor: currentSettings.clusterTextColor || "#FFFFFF",
      clusterTextSize: currentSettings.clusterTextSize || "16",
      clusterColor: currentSettings.clusterColor || "#000000",
    },
    mode: "onChange",
  })

  useEffect(() => {
    form.reset({
      latitudeColumn: currentSettings.latitudeColumn || "",
      longitudeColumn: currentSettings.longitudeColumn || "",
      stateColumn: currentSettings.stateColumn || "",
      valueColumn: currentSettings.valueColumn || "",
      labelColumn: currentSettings.labelColumn || "",
      tooltipColumn: currentSettings.tooltipColumn || "",
      clusterRadius: currentSettings.clusterRadius || "120",
      clusterMaxZoom: currentSettings.clusterMaxZoom || "14",
      clusterTextColor: currentSettings.clusterTextColor || "#FFFFFF",
      clusterTextSize: currentSettings.clusterTextSize || "16",
      clusterColor: currentSettings.clusterColor || "#000000",
    })
  }, [activeMapType, dimensionSettings])

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setDimensionSettings((prevSettings: any) => ({
      ...prevSettings,
      [activeMapType]: {
        ...values,
      },
    }))

    toast({
      title: "Settings saved!",
      description: "Your dimension settings have been saved.",
    })
  }

  const getColumnsForCurrentMapType = () => {
    return Array.isArray(columns) ? columns : []
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {activeMapType === "symbol" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormItem>
                <FormLabel>Latitude Column</FormLabel>
                <Select onValueChange={form.setValue("latitudeColumn")}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={currentSettings.latitudeColumn || "Select latitude column"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getColumnsForCurrentMapType().map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Please select the column that contains the latitude values.</FormDescription>
                <FormMessage />
              </FormItem>
            </div>
            <div>
              <FormItem>
                <FormLabel>Longitude Column</FormLabel>
                <Select onValueChange={form.setValue("longitudeColumn")}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={currentSettings.longitudeColumn || "Select longitude column"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getColumnsForCurrentMapType().map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Please select the column that contains the longitude values.</FormDescription>
                <FormMessage />
              </FormItem>
            </div>
          </div>
        )}

        {(activeMapType === "choropleth" || activeMapType === "custom") && (
          <div>
            <FormItem>
              <FormLabel>State/Province Column</FormLabel>
              <Select onValueChange={form.setValue("stateColumn")}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        activeMapType === "choropleth" || activeMapType === "custom"
                          ? currentSettings.stateColumn
                          : selectedGeography === "usa-counties"
                            ? "Select county column"
                            : selectedGeography === "canada-provinces" || selectedGeography === "canada-nation"
                              ? "Select province column"
                              : "Select state/province column"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {getColumnsForCurrentMapType().map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Please select the column that contains the state/province values.</FormDescription>
              <FormMessage />
            </FormItem>
          </div>
        )}

        <div>
          <FormItem>
            <FormLabel>Value Column</FormLabel>
            <Select onValueChange={form.setValue("valueColumn")}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={currentSettings.valueColumn || "Select value column"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {getColumnsForCurrentMapType().map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Please select the column that contains the values to be displayed on the map.
            </FormDescription>
            <FormMessage />
          </FormItem>
        </div>

        <div>
          <FormItem>
            <FormLabel>Label Column</FormLabel>
            <Select onValueChange={form.setValue("labelColumn")}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={currentSettings.labelColumn || "Select label column"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {getColumnsForCurrentMapType().map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>This column will be used to display labels on the map.</FormDescription>
            <FormMessage />
          </FormItem>
        </div>

        <div>
          <FormItem>
            <FormLabel>Tooltip Column</FormLabel>
            <Select onValueChange={form.setValue("tooltipColumn")}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={currentSettings.tooltipColumn || "Select tooltip column"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {getColumnsForCurrentMapType().map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>This column will be used to display tooltips on the map.</FormDescription>
            <FormMessage />
          </FormItem>
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="advanced">
            <AccordionTrigger>Advanced Settings</AccordionTrigger>
            <AccordionContent>
              {activeMapType === "symbol" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FormItem>
                        <FormLabel>Cluster Radius</FormLabel>
                        <FormControl>
                          <Input type="number" {...form.register("clusterRadius")} />
                        </FormControl>
                        <FormDescription>The radius of each cluster. Adjust to fit your data.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    </div>
                    <div>
                      <FormItem>
                        <FormLabel>Cluster Max Zoom</FormLabel>
                        <FormControl>
                          <Input type="number" {...form.register("clusterMaxZoom")} />
                        </FormControl>
                        <FormDescription>The maximum zoom level at which clustering is enabled.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <FormItem>
                        <FormLabel>Cluster Text Color</FormLabel>
                        <FormControl>
                          <Input type="color" {...form.register("clusterTextColor")} />
                        </FormControl>
                        <FormDescription>The color of the cluster text.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    </div>
                    <div>
                      <FormItem>
                        <FormLabel>Cluster Text Size</FormLabel>
                        <FormControl>
                          <Input type="number" {...form.register("clusterTextSize")} />
                        </FormControl>
                        <FormDescription>The size of the cluster text.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    </div>
                    <div>
                      <FormItem>
                        <FormLabel>Cluster Color</FormLabel>
                        <FormControl>
                          <Input type="color" {...form.register("clusterColor")} />
                        </FormControl>
                        <FormDescription>The color of the cluster.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    </div>
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button type="submit">Save Settings</Button>
      </form>
    </Form>
  )
}

export default DimensionMapping

// Also provide a named export for consumers that import { DimensionMapping }
export { DimensionMapping }
