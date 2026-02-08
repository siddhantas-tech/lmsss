'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getLabs, getLabsForCourse, assignLabToCourse } from '@/api/labs'

interface Lab {
    id: string
    name: string
    code: string
}

export function CourseLabsSelector({ courseId }: { courseId: string }) {
    const [open, setOpen] = useState(false)
    const [labs, setLabs] = useState<Lab[]>([])
    const [selectedLabIds, setSelectedLabIds] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        Promise.all([fetchLabs(), fetchAssignments()])
            .finally(() => setLoading(false))
    }, [courseId])

    async function fetchLabs() {
        try {
            const res = await getLabs()
            setLabs(Array.isArray(res.data) ? res.data : [])
        } catch (e) {
            console.error(e)
            setLabs([]) // Ensure labs is always an array
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load labs"
            })
        }
    }

    async function fetchAssignments() {
        try {
            const res = await getLabsForCourse(courseId)
            const data = Array.isArray(res.data) ? res.data : []
            setSelectedLabIds(data.map((l: Lab) => l.id))
        } catch (e) {
            console.error(e)
            setSelectedLabIds([]) // Ensure selectedLabIds is always an array
        }
    }

    async function toggleLab(labId: string) {
        const newSelected = selectedLabIds.includes(labId)
            ? selectedLabIds.filter(id => id !== labId)
            : [...selectedLabIds, labId]

        setSelectedLabIds(newSelected)

        try {
            await assignLabToCourse(courseId, { labIds: newSelected })

            toast({
                title: "Updated",
                description: "Course lab assignments updated"
            })
        } catch (error) {
            console.error(error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to save changes"
            })
            // Revert
            fetchAssignments()
        }
    }

    return (
        <Card className="border-4 border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader>
                <CardTitle className="font-black text-sm flex items-center gap-2">
                    <Monitor className="h-4 w-4" /> Lab Assignment
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between border-2 border-foreground font-bold"
                            disabled={loading}
                        >
                            {selectedLabIds.length > 0
                                ? `${selectedLabIds.length} labs assigned`
                                : "Select labs..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <Command>
                            <CommandInput placeholder="Search labs..." />
                            <CommandList>
                                <CommandEmpty>No labs found.</CommandEmpty>
                                <CommandGroup>
                                    {labs.map((lab) => (
                                        <CommandItem
                                            key={lab.id}
                                            value={lab.name}
                                            onSelect={() => toggleLab(lab.id)}
                                            className="cursor-pointer font-medium"
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedLabIds.includes(lab.id) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {lab.name}
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                ({lab.code})
                                            </span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {selectedLabIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {selectedLabIds.map(id => {
                            const lab = labs.find(l => l.id === id)
                            if (!lab) return null
                            return (
                                <Badge key={id} variant="secondary" className="border border-input">
                                    {lab.code}
                                </Badge>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
