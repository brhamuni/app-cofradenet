import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Ciudad } from '../ciudades/entities/ciudad.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Ciudad])],
    providers: [SeedService],
})
export class SeedModule {}
