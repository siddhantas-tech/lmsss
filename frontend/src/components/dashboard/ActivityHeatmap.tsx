"use client"

import React, { useMemo } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface ActivityData {
    date: string // YYYY-MM-DD
    count: number
}

interface ActivityHeatmapProps {
    data: ActivityData[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
    // Generate last 365 days, starting from the Sunday of the week that was 364 days ago
    const days = useMemo(() => {
        const today = new Date()
        // To align with GitHub's style, we want the grid to start on a Sunday
        const endDate = new Date(today)
        const startDate = new Date(today)
        startDate.setDate(today.getDate() - 364)

        // Adjust start date to the nearest preceding Sunday
        while (startDate.getDay() !== 0) {
            startDate.setDate(startDate.getDate() - 1)
        }

        const result = []
        const dataMap = new Map((data || []).map(d => [d.date, d.count]))

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0]
            result.push({
                date: dateStr,
                count: dataMap.get(dateStr) || 0,
                dayOfWeek: d.getDay(),
                month: d.getMonth(),
                dayOfMonth: d.getDate(),
            })
        }
        return result
    }, [data])

    // Group by weeks for the grid
    const weeks = useMemo(() => {
        const w: any[][] = []
        let currentWeek: any[] = []

        days.forEach((day, i) => {
            currentWeek.push(day)
            if (currentWeek.length === 7 || i === days.length - 1) {
                w.push(currentWeek)
                currentWeek = []
            }
        })
        return w
    }, [days])

    // Calculate month labels and their positions (week index)
    const monthLabels = useMemo(() => {
        const labels: { month: string; index: number }[] = []
        let lastMonth = -1

        weeks.forEach((week, index) => {
            const firstDayOfMonthInWeek = week.find((d: any) => d.dayOfMonth <= 7 && d.month !== lastMonth)
            if (firstDayOfMonthInWeek) {
                labels.push({ month: MONTHS[firstDayOfMonthInWeek.month], index })
                lastMonth = firstDayOfMonthInWeek.month
            }
        })
        return labels
    }, [weeks])

    const getColorClass = (count: number) => {
        if (count === 0) return 'bg-muted/30 border border-border/5'
        if (count < 2) return 'bg-primary/30 border border-primary/10'
        if (count < 4) return 'bg-primary/50 border border-primary/20'
        if (count < 6) return 'bg-primary/70 border border-primary/30'
        return 'bg-primary border border-primary/40'
    }

    return (
        <TooltipProvider>
            <div className="flex flex-col space-y-3 pt-4">
                {/* Month Labels */}
                <div className="flex ml-10 mb-1 relative h-4">
                    {monthLabels.map((label, i) => (
                        <div
                            key={i}
                            className="absolute text-[10px] font-bold text-muted-foreground uppercase tracking-tight"
                            style={{ left: `${label.index * 14}px` }}
                        >
                            {label.month}
                        </div>
                    ))}
                </div>

                <div className="flex space-x-2">
                    {/* Day Labels */}
                    <div className="flex flex-col space-y-1 mt-1">
                        {DAYS.map((day, i) => (
                            <div key={day} className="h-3 flex items-center">
                                {i % 2 !== 0 && (
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase leading-none pr-2 w-8 text-right">
                                        {day}
                                    </span>
                                )}
                                {i % 2 === 0 && <span className="w-8" />}
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-hide flex-1">
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col space-y-1">
                                {week.map((day: any) => (
                                    <Tooltip key={day.date}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={cn(
                                                    "h-3 w-3 rounded-[2px] cursor-pointer transition-all hover:scale-110",
                                                    getColorClass(day.count)
                                                )}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p className="text-xs font-bold">
                                                {day.count} activities on {new Date(day.date).toLocaleDateString()}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                                {/* Pad short last week if needed */}
                                {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, i) => (
                                    <div key={`pad-${i}`} className="h-3 w-3" />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider pr-2">
                    <span>Less</span>
                    <div className="h-2.5 w-2.5 rounded-[2px] bg-muted/30" />
                    <div className="h-2.5 w-2.5 rounded-[2px] bg-primary/30" />
                    <div className="h-2.5 w-2.5 rounded-[2px] bg-primary/60" />
                    <div className="h-2.5 w-2.5 rounded-[2px] bg-primary" />
                    <span>More</span>
                </div>
            </div>
        </TooltipProvider>
    )
}
