'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Filter } from 'lucide-react';
import { SearchFilters } from '@/components/search/search-filters';

export function FiltersPanel() {
    const [showFilters, setShowFilters] = useState(false);
    return (
        <div className="lg:w-64 space-y-6">
            <div className="lg:hidden">
                <Sheet open={showFilters} onOpenChange={setShowFilters}>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80">
                        <SearchFilters />
                    </SheetContent>
                </Sheet>
            </div>
            <div className="hidden lg:block">
                <SearchFilters />
            </div>
        </div>
    );
}


