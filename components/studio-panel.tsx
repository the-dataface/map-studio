'use client'

import type React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/** Shared flat panel — also targeted by .studio-panel-flat in globals.css */
export const studioPanelClass =
  'studio-panel-flat bg-background transition-colors duration-150 overflow-hidden rounded-none'

export const studioPanelTitleClass =
  'font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground'

export const studioPanelContentClass = 'px-4 py-3'

/** Very subtle separator below expanded panel headers (sidebar CSS overrides) */
export const studioPanelBodyClass = 'border-t border-border/40'

/** All expandable panel headers */
export const studioExpandableHeaderClass =
  'cursor-pointer transition-colors duration-150 rounded-none p-0 space-y-0'

/** Inner row — consistent 48px header bar across every panel */
export const studioPanelHeaderRowClass =
  'flex min-h-12 items-center justify-between gap-3 px-4'

/** Map-type tab bar */
export const studioTabBarClass =
  'inline-flex h-auto items-center justify-start gap-0.5 bg-transparent p-0'

/** Shared tab button styling (Radix Tabs, ToggleGroup, or plain buttons) */
export const studioTabClass =
  'inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-none px-3 text-xs font-normal shadow-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-muted/30 hover:text-foreground'

/** For Radix TabsTrigger — overrides ui/tabs defaults (shadow, no hover) */
export const studioTabTriggerClass = cn(
  studioTabClass,
  'rounded-none text-xs shadow-none',
  'hover:!bg-muted/30 hover:!text-foreground',
  'data-[state=active]:!bg-muted/60 data-[state=active]:!text-foreground data-[state=active]:!shadow-none',
  'data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground'
)

/** For Radix ToggleGroupItem map-type tabs */
export const studioTabToggleClass = cn(
  studioTabClass,
  'min-h-8 min-w-0 h-8 rounded-none shadow-none',
  'data-[state=on]:!bg-muted/60 data-[state=on]:!text-foreground',
  'data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground',
  'hover:!bg-muted/30 hover:!text-foreground'
)

/** Bordered toggle group — white card-style container (symbol type, shape, font style) */
export const studioToggleGroupClass =
  'flex h-auto w-full max-w-full flex-nowrap items-stretch justify-stretch gap-0.5 rounded-none border border-border bg-white p-1 text-muted-foreground dark:bg-popover'

export const studioToggleGroupItemClass = cn(
  studioTabClass,
  'h-8 min-h-8 min-w-0 flex-1 basis-0 rounded-none px-1.5 shadow-none hover:!shadow-none',
  'data-[state=on]:!bg-muted/60 data-[state=on]:!text-foreground data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground',
  'hover:!bg-muted/30 hover:!text-foreground'
)

export const studioToggleGroupIconItemClass = cn(
  studioToggleGroupItemClass,
  'p-0 [&_svg]:h-3.5 [&_svg]:w-3.5'
)

/** Alignment grid — same white card container; uses explicit 3-col template to avoid inspector stack override */
export const studioAlignmentGroupClass =
  'studio-alignment-grid grid w-full grid-cols-[repeat(3,minmax(0,1fr))] gap-0.5 rounded-none border border-border bg-white p-1 text-muted-foreground dark:bg-popover'

export const studioAlignmentButtonClass =
  'flex h-8 w-full min-w-0 items-center justify-center rounded-none p-0 text-xs shadow-none transition-colors duration-150 hover:!bg-muted/30 hover:!text-foreground hover:!shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

export const studioAlignmentAutoButtonClass = cn(studioAlignmentButtonClass, 'col-span-3 w-full')

export function studioAlignmentButtonActiveClass(active: boolean) {
  return cn(
    studioAlignmentButtonClass,
    active ? 'bg-muted/60 text-foreground' : 'bg-transparent text-muted-foreground'
  )
}

/** For button-based tab bars */
export function studioTabButtonClass(active: boolean, disabled = false) {
  return cn(
    studioTabClass,
    disabled && 'opacity-50 cursor-not-allowed text-muted-foreground hover:bg-transparent hover:text-muted-foreground',
    !disabled && active && 'bg-muted/60 text-foreground',
    !disabled && !active && 'bg-transparent text-muted-foreground'
  )
}

/** Compact outline button — matches header copy/download buttons */
export const studioOutlineButtonClass =
  'h-8 gap-1.5 rounded-none px-2.5 text-xs shadow-none border border-border bg-transparent hover:!bg-muted/40 hover:!text-foreground disabled:hover:!bg-transparent'

/** Primary action button — terracotta, no shadow on hover */
export const studioPrimaryButtonClass =
  'rounded-none bg-primary text-primary-foreground shadow-none hover:!bg-primary/90 hover:!text-primary-foreground hover:!shadow-none disabled:shadow-none disabled:hover:!shadow-none disabled:hover:!bg-primary/90'

/** Compact text button in panel headers (copy, download, etc.) */
export const studioHeaderActionButtonClass = studioOutlineButtonClass

/** Square icon button in panel headers */
export const studioHeaderIconButtonClass =
  'h-8 w-8 rounded-none p-0 shadow-none border border-border bg-transparent hover:bg-muted/40 hover:text-foreground'

/** Nested sub-panels */
export const studioSubPanelClass = 'border border-border overflow-hidden rounded-none'

export const studioSubPanelHeaderClass =
  'bg-muted/40 px-4 py-2.5 cursor-pointer hover:bg-muted/60 transition-colors duration-150'

export const studioSubPanelTitleClass = 'text-xs font-medium text-foreground'

export const studioSubPanelContentClass = 'p-4 bg-background'

/** Inspector sidebar — flat scrollable sections (Design mode) */
export type StudioPanelVariant = 'panel' | 'inspector'

export const studioInspectorBlockClass = 'studio-inspector-block bg-background'

/** Sticky headers in .studio-data-sidebar / .studio-design-inspector — styled in globals.css */
export const studioPanelStickyHeaderClass = 'studio-panel-sticky-header'

export const studioInspectorBlockHeaderClass = studioPanelStickyHeaderClass

export const studioInspectorBodyClass = 'studio-inspector-body min-w-0'

/** Tab row inside inspector blocks — sticky below panel header when scrolling */
export const studioInspectorTabRowClass =
  'studio-inspector-tab-row border-b border-border bg-background px-4 py-3'

/** Nested control groups inside inspector sections */
export const studioInspectorSubpaneClass =
  'space-y-4 border border-border/50 bg-muted/10 p-4'

export const studioInspectorGroupTitleClass =
  'px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/20 border-y border-border'

export const studioInspectorSectionClass = 'studio-inspector-section border-b border-border/20 last:border-b-0'

/** Sub-section titles — uppercase mono, distinct from field labels */
export const studioInspectorSectionTitleClass =
  'font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground'

export const studioInspectorSectionHeaderClass =
  'studio-inspector-section-header sticky z-[9] flex items-center gap-2 border-b border-border/20 bg-background px-4 py-2.5'

/** Field labels inside inspector sections */
export const studioInspectorFieldLabelClass = 'text-xs font-normal text-foreground'

export const studioInspectorSectionContentClass = 'studio-inspector-section-content px-4 pb-4 pt-3'

interface StudioInspectorBlockProps {
  title: string
  children: React.ReactNode
  className?: string
  isExpanded?: boolean
  onToggle?: () => void
}

export function StudioInspectorBlock({
  title,
  children,
  className,
  isExpanded = true,
  onToggle,
}: StudioInspectorBlockProps) {
  const collapsible = Boolean(onToggle)

  return (
    <section className={cn(studioInspectorBlockClass, className)}>
      <StudioExpandableHeader
        title={title}
        isExpanded={isExpanded}
        onToggle={onToggle ?? (() => {})}
        collapsible={collapsible}
      />
      {(collapsible ? isExpanded : true) && (
        <div className={studioInspectorBodyClass}>{children}</div>
      )}
    </section>
  )
}

interface StudioInspectorGroupProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function StudioInspectorGroup({ title, children, className }: StudioInspectorGroupProps) {
  return (
    <div className={cn('studio-inspector-group', className)}>
      <h3 className={studioInspectorGroupTitleClass}>{title}</h3>
      <div>{children}</div>
    </div>
  )
}

interface StudioInspectorSectionProps {
  title: string
  icon?: React.ReactNode
  badge?: React.ReactNode
  typeIcons?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function StudioInspectorSection({
  title,
  icon,
  badge,
  typeIcons,
  children,
  className,
}: StudioInspectorSectionProps) {
  return (
    <section className={cn(studioInspectorSectionClass, className)}>
      <div className={cn(studioInspectorSectionHeaderClass, 'justify-between gap-3')}>
        <div className="flex min-w-0 items-center gap-2">
          {icon ? <div className="text-muted-foreground scale-75">{icon}</div> : null}
          <h4 className={studioInspectorSectionTitleClass}>{title}</h4>
          {badge}
        </div>
        {typeIcons ? <div className="flex shrink-0 items-center gap-1">{typeIcons}</div> : null}
      </div>
      <div className={studioInspectorSectionContentClass}>{children}</div>
    </section>
  )
}

interface StudioCollapsibleSectionProps {
  title: string
  isExpanded: boolean
  onToggle: () => void
  badge?: React.ReactNode
  typeIcons?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

/** Wrapper for a stack of edge-to-edge collapsible sub-panes */
export const studioCollapsibleSectionListClass =
  'divide-y divide-border border-y border-border'

/** Collapsible sub-pane — light all-caps mono header with left caret */
export function StudioCollapsibleSection({
  title,
  isExpanded,
  onToggle,
  badge,
  typeIcons,
  children,
  className,
  contentClassName,
}: StudioCollapsibleSectionProps) {
  return (
    <section className={cn('studio-collapsible-section', className)}>
      <button
        type="button"
        className={cn(
          'flex w-full cursor-pointer items-center gap-2 bg-muted/20 px-4 py-2 text-left transition-colors duration-150 hover:bg-muted/40',
        )}
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <ChevronDown
          className={cn(
            'h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200',
            isExpanded && '-rotate-180',
          )}
        />
        <span className={cn(studioInspectorSectionTitleClass, 'min-w-0 flex-1 truncate')}>
          {title}
        </span>
        {badge ? <span className="shrink-0 font-sans font-normal normal-case">{badge}</span> : null}
        {typeIcons ? <span className="ml-auto flex shrink-0 items-center gap-1">{typeIcons}</span> : null}
      </button>
      {isExpanded ? (
        <div
          className={cn(
            studioInspectorSectionContentClass,
            'border-t border-border',
            contentClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </section>
  )
}

/** @deprecated use studioExpandableHeaderClass */
export const studioPanelHeaderClass = studioExpandableHeaderClass

interface StudioExpandableHeaderProps {
  title: string
  isExpanded: boolean
  onToggle: () => void
  badges?: React.ReactNode
  actions?: React.ReactNode
  className?: string
  /** When false, panel stays open and header is not clickable (e.g. map preview on desktop) */
  collapsible?: boolean
}

/** Shared expandable panel header — same height and behaviour everywhere */
export function StudioExpandableHeader({
  title,
  isExpanded,
  onToggle,
  badges,
  actions,
  className,
  collapsible = true,
}: StudioExpandableHeaderProps) {
  const effectivelyExpanded = collapsible ? isExpanded : true

  return (
    <CardHeader
      className={cn(
        studioExpandableHeaderClass,
        studioPanelStickyHeaderClass,
        !collapsible && 'cursor-default',
        className
      )}
      onClick={collapsible ? onToggle : undefined}
      onKeyDown={
        collapsible
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onToggle()
              }
            }
          : undefined
      }
      role={collapsible ? 'button' : undefined}
      tabIndex={collapsible ? 0 : undefined}
      aria-expanded={effectivelyExpanded}>
      <div className={studioPanelHeaderRowClass}>
        <div className="flex min-w-0 items-center gap-2">
          <CardTitle className={studioPanelTitleClass}>{title}</CardTitle>
          {badges}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {actions ? (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {actions}
            </div>
          ) : null}
          {collapsible ? (
            effectivelyExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            )
          ) : null}
        </div>
      </div>
    </CardHeader>
  )
}

interface StudioPanelProps {
  title: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
  className?: string
  badge?: React.ReactNode
  action?: React.ReactNode
}

export function StudioPanel({
  title,
  isExpanded,
  onToggle,
  children,
  className,
  badge,
  action,
}: StudioPanelProps) {
  return (
    <section className={cn(studioPanelClass, className)}>
      <StudioExpandableHeader
        title={title}
        isExpanded={isExpanded}
        onToggle={onToggle}
        badges={badge}
        actions={action}
      />
      {isExpanded && <div className={studioPanelContentClass}>{children}</div>}
    </section>
  )
}
