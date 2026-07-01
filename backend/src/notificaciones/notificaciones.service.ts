/**
 * @file notificaciones.service.ts
 * @brief Servicio de notificaciones en-app y push de CofradeNet.
 * @details Gestiona notificaciones persistentes en base de datos, suscripciones
 *          a push notifications mediante Web Push (VAPID), y el marcado de
 *          eventos importantes por parte de los usuarios.
 */

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

    /**
     * @brief Obtiene las últimas 50 notificaciones de un usuario ordenadas por fecha descendente.
     *
     * @param {number} usuarioId - Identificador del usuario.
     * @returns {Promise<Notificacion[]>} Lista de notificaciones más recientes.
     */
    async getMisNotificaciones(usuarioId: number): Promise<Notificacion[]> {
        return this.notificacionRepo.find({
            where: { usuarioId },
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }

    /**
     * @brief Marca una notificación concreta como leída.
     *
     * @param {number} id        - Identificador de la notificación.
     * @param {number} usuarioId - Identificador del usuario propietario (para verificar propiedad).
     * @returns {Promise<Notificacion>} Notificación actualizada con `leida = true`.
     *
     * @throws {NotFoundException} Si la notificación no existe o no pertenece al usuario.
     */
    async marcarLeida(id: number, usuarioId: number): Promise<Notificacion> {
        const notif = await this.notificacionRepo.findOne({
            where: { id, usuarioId },
        });
        if (!notif) throw new NotFoundException('Notificación no encontrada');
        notif.leida = true;
        return this.notificacionRepo.save(notif);
    }

    /**
     * @brief Marca todas las notificaciones no leídas de un usuario como leídas.
     *
     * @details
     * Realiza un `UPDATE` masivo sobre todos los registros donde `usuarioId` coincida
     * y `leida = false`, estableciendo `leida = true`. Operación eficiente que evita
     * cargar y actualizar cada notificación individualmente.
     *
     * @param {number} usuarioId - Identificador del usuario.
     * @returns {Promise<void>}
     */
    async marcarTodasLeidas(usuarioId: number): Promise<void> {
        await this.notificacionRepo.update(
            { usuarioId, leida: false },
            { leida: true },
        );
    }

    /**
     * @brief Elimina una notificación concreta de un usuario.
     *
     * @param {number} id        - Identificador de la notificación.
     * @param {number} usuarioId - Identificador del usuario propietario.
     * @returns {Promise<void>}
     *
     * @throws {NotFoundException} Si la notificación no existe o no pertenece al usuario.
     */
    async eliminar(id: number, usuarioId: number): Promise<void> {
        const notif = await this.notificacionRepo.findOne({
            where: { id, usuarioId },
        });
        if (!notif) throw new NotFoundException('Notificación no encontrada');
        await this.notificacionRepo.remove(notif);
    }

    /**
     * @brief Crea una notificación persistente y envía la push notification correspondiente.
     *
     * @details
     * Persiste la notificación en base de datos y, a continuación, invoca `enviarPushAUsuario`
     * para enviar la notificación push a todos los dispositivos suscritos del usuario.
     * Si el envío push falla para algún dispositivo (token expirado, etc.), ese dispositivo
     * se elimina automáticamente de la base de datos dentro de `enviarPushAUsuario`.
     *
     * @pre   Las variables de entorno `VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY` deben estar
     *        configuradas para que el envío push funcione.
     * @post  Existe un registro en `notificaciones` y se ha intentado el envío push.
     *
     * @param {number} usuarioId              - Identificador del usuario destinatario.
     * @param {TipoNotificacion} tipo         - Tipo semántico de la notificación.
     * @param {string} titulo                 - Título de la notificación.
     * @param {string} [cuerpo]               - Cuerpo/descripción de la notificación.
     * @param {string} [urlDestino]           - URL a la que redirige al hacer clic.
     * @returns {Promise<Notificacion>} Notificación recién creada y persistida.
     */
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

    /**
     * @brief Registra o actualiza la suscripción push de un dispositivo para un usuario.
     *
     * @details
     * Implementa un patrón upsert manual: busca si ya existe una suscripción con el mismo
     * `endpoint` para el usuario. Si existe, actualiza las claves `p256dh` y `auth`
     * (pueden cambiar cuando el navegador regenera las claves). Si no existe, crea una nueva.
     * Esto garantiza que un mismo dispositivo no genere múltiples registros.
     *
     * @pre   Las claves VAPID deben estar configuradas en el módulo.
     * @post  Existe exactamente un registro de suscripción para el par `(usuarioId, endpoint)`.
     *
     * @param {number} usuarioId - Identificador del usuario.
     * @param {{ endpoint: string; keys: { p256dh: string; auth: string } }} sub
     *        - Objeto de suscripción Web Push estándar.
     * @returns {Promise<SuscripcionPush>} Suscripción creada o actualizada.
     */
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

    /**
     * @brief Elimina la suscripción push de un endpoint concreto para un usuario.
     *
     * @details
     * Operación idempotente: si el endpoint no existe, no se produce ningún error.
     *
     * @param {number} usuarioId  - Identificador del usuario.
     * @param {string} endpoint   - URL del endpoint de suscripción a eliminar.
     * @returns {Promise<void>}
     */
    async desuscribir(usuarioId: number, endpoint: string): Promise<void> {
        const sub = await this.suscripcionRepo.findOne({
            where: { usuarioId, endpoint },
        });
        if (sub) await this.suscripcionRepo.remove(sub);
    }

    /**
     * @brief Envía una push notification a todos los dispositivos suscritos de un usuario.
     *
     * @details
     * Itera sobre todas las suscripciones del usuario y envía el payload JSON mediante
     * la biblioteca `web-push`. Si el envío falla para alguna suscripción (endpoint expirado,
     * token revocado, etc.), esa suscripción se elimina automáticamente de la BD para
     * mantener la lista limpia y evitar reintentos futuros sobre endpoints muertos.
     *
     * @pre   Las claves VAPID deben estar configuradas con `webpush.setVapidDetails`.
     * @post  Se ha intentado el envío a cada suscripción activa; las fallidas quedan eliminadas.
     *
     * @param {number} usuarioId  - Identificador del usuario destinatario.
     * @param {string} titulo     - Título de la notificación push.
     * @param {string} cuerpo     - Cuerpo de la notificación push.
     * @param {string} [url]      - URL de destino al hacer clic en la notificación.
     * @returns {Promise<void>}
     */
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

    /**
     * @brief Obtiene los eventos marcados como importantes por un usuario.
     *
     * @param {number} usuarioId - Identificador del usuario.
     * @returns {Promise<EventoImportante[]>} Lista de eventos importantes ordenada por `createdAt` descendente.
     */
    async getEventosImportantes(
        usuarioId: number,
    ): Promise<EventoImportante[]> {
        return this.eventoImportanteRepo.find({
            where: { usuarioId },
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * @brief Marca un evento como importante para un usuario (idempotente).
     *
     * @details
     * Si el evento ya está marcado como importante (`eventoTipo + eventoId + usuarioId`),
     * devuelve el registro existente sin crear uno nuevo. Si no existe, lo crea.
     *
     * @param {number} usuarioId    - Identificador del usuario.
     * @param {string} eventoTipo   - Tipo del evento (`'procesion'`, `'concierto'`, etc.).
     * @param {number} eventoId     - Identificador del evento en su tabla correspondiente.
     * @param {string} [titulo]     - Título descriptivo del evento (para mostrar sin JOIN).
     * @returns {Promise<EventoImportante>} Registro existente o recién creado.
     */
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

    /**
     * @brief Desmarca un evento como importante para un usuario.
     *
     * @details
     * Operación idempotente: si el evento no estaba marcado, no se produce ningún error.
     *
     * @param {number} usuarioId  - Identificador del usuario.
     * @param {string} eventoTipo - Tipo del evento.
     * @param {number} eventoId   - Identificador del evento.
     * @returns {Promise<void>}
     */
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
