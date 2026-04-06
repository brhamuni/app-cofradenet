import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hermandad } from '@backend/hermandades/entities/hermandad.entity';
import { Procesion } from '@backend/procesiones/entities/procesion.entity';
import { Ciudad } from '@backend/ciudades/entities/ciudad.entity';
import { Banda } from '@backend/bandas/entities/banda.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Ciudad, Hermandad, Banda, Procesion])],
    controllers: [SearchController],
    providers: [SearchService],
})
export class SearchModule {}
