import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesService } from './notificaciones.service';
import { Notificacion } from './entities/notificacion.entity';
import { SuscripcionPush } from './entities/suscripcion-push.entity';
import { EventoImportante } from './entities/evento-importante.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Notificacion, SuscripcionPush, EventoImportante])],
    controllers: [NotificacionesController],
    providers: [NotificacionesService],
    exports: [NotificacionesService],
})
export class NotificacionesModule {}
