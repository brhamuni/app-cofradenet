import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) {}

    @Get()
    async handleSearch(
        @Query('q') query: string,
        @Query('filtro') filtro: string = 'todo',
    ) {
        return this.searchService.globalSearch(query, filtro);
    }
}
