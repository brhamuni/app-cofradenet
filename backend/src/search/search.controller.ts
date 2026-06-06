import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) {}

    @ApiOperation({ summary: 'Búsqueda global por hermandades, bandas, procesiones y usuarios' })
    @ApiResponse({ status: 200, description: 'Resultados de la búsqueda global' })
    @Get()
    async handleSearch(
        @Query('q') query: string,
        @Query('filtro') filtro: string = 'todo',
    ) {
        return this.searchService.globalSearch(query, filtro);
    }
}
