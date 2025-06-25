import type React from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface MapStylingProps {
  selectedGeography: "usa-states" | "usa-counties" | "usa-nation" | "canada-provinces" | "canada-nation" | "world"
  geoPluralTermLabel: string
}

const MapStyling: React.FC<MapStylingProps> = ({ selectedGeography, geoPluralTermLabel }) => {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>Base Map Styles</AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="name">States</Label>
              <AccordionTrigger className="flex-1">{geoPluralTermLabel}</AccordionTrigger>
              <Input id="name" value="" className="col-span-2" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="username">Counties</Label>
              <AccordionTrigger className="flex-1">Counties</AccordionTrigger>
              <Input id="username" value="" className="col-span-2" />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Data Layer Styles</AccordionTrigger>
        <AccordionContent>This is the second item's content.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default MapStyling
