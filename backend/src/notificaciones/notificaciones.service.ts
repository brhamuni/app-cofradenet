import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { Notificacion, TipoNotificacion } from './entities/notificacion.entity';
import { SuscripcionPush } from './entities/suscripcion-push.entity';
import { EventoImportante } from './entities/evento-importante.entity';

@Injectable()
export class NotificacionesService {
    constructor(
        @InjectRepository(Notificacion)
        private readonly notificacionRepo: Repository<Notificacion>,
        @InjectRepository(SuscripcionPush)
        private readonly suscripcionRepo: Repository<SuscripcionPush>,
        @InjectRepository(EventoImportante)
        private readonly eventoImportanteRepo: Repository<EventoImportante>,
    ) {
        if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
            webpush.setVapidDetails(
                process.env.VAPID_EMAIL ?? 'mailto:info@cofradenet.es',
                process.env.VAPID_PUBLIC_KEY,
                process.env.VAPID_PRIVATE_KEY,
            );
        }
    }

    async getMisNotificaciones(usuarioId: number): Promise<Notificacion[]> {
        return this.notificacionRepo.find({
            where: { usuarioId },
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }

    async marcarLeida(id: number, usuarioId: number): Promise<Notificacion> {
        const notif = await this.notificacionRepo.findOne({
            where: { id, usuarioId },
        });
        if (!notif) throw new NotFoundException('Notificación no encontrada');
        notif.leida = true;
        return this.notificacionRepo.save(notif);
    }

    async marcarTodasLeidas(usuarioId: number): Promise<void> {
        await this.notificacionRepo.update(
            { usuarioId, leida: false },
            { leida: true },
        );
    }

    async eliminar(id: number, usuarioId: number): Promise<void> {
        const notif = await this.notificacionRepo.findOne({
            where: { id, usuarioId },
        });
        if (!notif) throw new NotFoundException('Notificación no encontrada');
        await this.notificacionRepo.remove(notif);
    }

    async crearNotificacion(
        usuarioId: number,
        tipo: TipoNotificacion,
        titulo: string,
        cuerpo?: string,
        urlDestino?: string,
    ): Promise<Notificacion> {
        const notif = this.notificacionRepo.create({
            usuarioId,
            tipo,
            titulo,
            cuerpo,
            urlDestino,
        });
        const saved = await this.notificacionRepo.save(notif);
        await this.enviarPushAUsuario(
            usuarioId,
            titulo,
            cuerpo ?? '',
            urlDestino,
        );
        return saved;
    }

    async suscribir(
        usuarioId: number,
        sub: { endpoint: string; keys: { p256dh: string; auth: string } },
    ): Promise<SuscripcionPush> {
        let suscripcion = await this.suscripcionRepo.findOne({
            where: { usuarioId, endpoint: sub.endpoint },
        });
        if (!suscripcion) {
            suscripcion = this.suscripcionRepo.create({
                usuarioId,
                endpoint: sub.endpoint,
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth,
            });
        } else {
            suscripcion.p256dh = sub.keys.p256dh;
            suscripcion.auth = sub.keys.auth;
        }
        return this.suscripcionRepo.save(suscripcion);
    }

    async desuscribir(usuarioId: number, endpoint: string): Promise<void> {
        const sub = await this.suscripcionRepo.findOne({
            where: { usuarioId, endpoint },
        });
        if (sub) await this.suscripcionRepo.remove(sub);
    }

    private async enviarPushAUsuario(
        usuarioId: number,
        titulo: string,
        cuerpo: string,
        url?: string,
    ): Promise<void> {
        const suscripciones = await this.suscripcionRepo.find({
            where: { usuarioId },
        });
        const payload = JSON.stringify({ title: titulo, body: cuerpo, url });
        for (const sub of suscripciones) {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth },
                    },
                    payload,
                );
            } catch {
                await this.suscripcionRepo.remove(sub);
            }
        }
    }

    async getEventosImportantes(
        usuarioId: number,
    ): Promise<EventoImportante[]> {
        return this.eventoImportanteRepo.find({
            where: { usuarioId },
            order: { createdAt: 'DESC' },
        });
    }

    async marcarEventoImportante(
        usuarioId: number,
        eventoTipo: string,
        eventoId: number,
        titulo?: string,
    ): Promise<EventoImportante> {
        const existente = await this.eventoImportanteRepo.findOne({
            where: { usuarioId, eventoTipo, eventoId },
        });
        if (existente) return existente;
        const ev = this.eventoImportanteRepo.create({
            usuarioId,
            eventoTipo,
            eventoId,
            titulo,
        });
        return this.eventoImportanteRepo.save(ev);
    }

    async desmarcarEventoImportante(
        usuarioId: number,
        eventoTipo: string,
        eventoId: number,
    ): Promise<void> {
        const ev = await this.eventoImportanteRepo.findOne({
            where: { usuarioId, eventoTipo, eventoId },
        });
        if (ev) await this.eventoImportanteRepo.remove(ev);
    }
}
