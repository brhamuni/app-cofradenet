import { Module } from '@nestjs/common';
import { BandasService } from './bandas.service';
import { BandasController } from './bandas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Banda } from './entities/banda.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Banda])],
    controllers: [BandasController],
    providers: [BandasService],
    exports: [TypeOrmModule],
})
export class BandasModule {}
