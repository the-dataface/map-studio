"use client"

import type React from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { ColorInput } from "@/components/color-input"
import { FormattedNumberInput } from "@/components/formatted-number-input"
import { Separator } from "@/components/ui/separator"

interface MapStylingProps {
  stylingSettings: any
  onUpdateStylingSettings: (newSettings: any) => void
  selectedGeography: string | null
}

const MapStyling: React.FC<MapStylingProps> = ({ stylingSettings, onUpdateStylingSettings, selectedGeography }) => {
  return (
    <Tabs defaultValue="base">
      <TabsContent value="base">
        {/* Nation Styling (always visible as part of the base map) */}
        <div className="space-y-2">
          <Label htmlFor="nationFillColor">Nation Fill Color</Label>
          <ColorInput
            id="nationFillColor"
            color={stylingSettings.base.nationFillColor}
            onChange={(color) =>
              onUpdateStylingSettings({
                ...stylingSettings,
                base: { ...stylingSettings.base, nationFillColor: color },
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nationStrokeColor">Nation Stroke Color</Label>
          <ColorInput
            id="nationStrokeColor"
            color={stylingSettings.base.nationStrokeColor}
            onChange={(color) =>
              onUpdateStylingSettings({
                ...stylingSettings,
                base: { ...stylingSettings.base, nationStrokeColor: color },
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nationStrokeWidth">Nation Stroke Width</Label>
          <FormattedNumberInput
            id="nationStrokeWidth"
            value={stylingSettings.base.nationStrokeWidth}
            onChange={(value) =>
              onUpdateStylingSettings({
                ...stylingSettings,
                base: { ...stylingSettings.base, nationStrokeWidth: value },
              })
            }
            min={0}
            max={10}
            step={0.1}
          />
        </div>

        {/* State/Province/County Styling (conditionally rendered) */}
        {(selectedGeography === "usa-states" ||
          selectedGeography === "usa-counties" ||
          selectedGeography === "canada-provinces") && (
          <>
            <Separator className="my-4" />
            <h4 className="text-md font-semibold mb-2">State/Province/County Styling</h4>
            <div className="space-y-2">
              <Label htmlFor="defaultStateFillColor">Default State/Province Fill Color</Label>
              <ColorInput
                id="defaultStateFillColor"
                color={stylingSettings.base.defaultStateFillColor}
                onChange={(color) =>
                  onUpdateStylingSettings({
                    ...stylingSettings,
                    base: { ...stylingSettings.base, defaultStateFillColor: color },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultStateStrokeColor">Default State/Province Stroke Color</Label>
              <ColorInput
                id="defaultStateStrokeColor"
                color={stylingSettings.base.defaultStateStrokeColor}
                onChange={(color) =>
                  onUpdateStylingSettings({
                    ...stylingSettings,
                    base: { ...stylingSettings.base, defaultStateStrokeColor: color },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultStateStrokeWidth">Default State/Province Stroke Width</Label>
              <FormattedNumberInput
                id="defaultStateStrokeWidth"
                value={stylingSettings.base.defaultStateStrokeWidth}
                onChange={(value) =>
                  onUpdateStylingSettings({
                    ...stylingSettings,
                    base: { ...stylingSettings.base, defaultStateStrokeWidth: value },
                  })
                }
                min={0}
                max={10}
                step={0.1}
              />
            </div>
          </>
        )}
      </TabsContent>
      <TabsContent value="data">
        <div>Data Styling</div>
      </TabsContent>
    </Tabs>
  )
}

export default MapStyling

// Provide a named export for consumers expecting `MapStyling`
export { MapStyling }
