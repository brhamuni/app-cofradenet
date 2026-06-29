import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateBandaDto } from './dto/create-banda.dto';
import { UpdateBandaDto } from './dto/update-banda.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Banda } from './entities/banda.entity';
import { In, Repository } from 'typeorm';
import { Marcha } from '@backend/marchas/entities/marcha.entity';
import { Evento } from '@backend/eventos/entities/evento.entity';
import { CreateEventoDto } from '@backend/eventos/dto/create-evento.dto';
import { UpdateEventoDto } from '@backend/eventos/dto/update-evento.dto';
import { Participacion } from '@backend/participaciones/entities/participacion.entity';
import { EnlaceExterno } from './entities/enlace-externo.entity';
import { CreateEnlaceDto } from './dto/create-enlace.dto';
import type { RequestUser } from '@backend/auth/request-user.interface';

@Injectable()
export class BandasService {
    constructor(
        @InjectRepository(Banda)
        private readonly bandaRepo: Repository<Banda>,
        @InjectRepository(Marcha)
        private readonly marchaRepo: Repository<Marcha>,
        @InjectRepository(Evento)
        private readonly eventoRepo: Repository<Evento>,
        @InjectRepository(Participacion)
        private readonly participacionRepo: Repository<Participacion>,
        @InjectRepository(EnlaceExterno)
        private readonly enlaceRepo: Repository<EnlaceExterno>,
    ) {}

    async create(createBandaDto: CreateBandaDto) {
        const nuevaBanda = this.bandaRepo.create(createBandaDto);
        return await this.bandaRepo.save(nuevaBanda);
    }

    findAll() {
        return this.bandaRepo.find({ relations: ['usuario', 'ciudad'] });
    }

    async findAllByCiudad(ciudadId: number) {
        return await this.bandaRepo.find({
            where: { ciudadId },
            select: ['id', 'nombre', 'estiloMusical', 'imagenLogo'],
        });
    }

    async findOne(id: number) {
        const banda = await this.bandaRepo.findOne({
            where: { id },
            relations: ['ciudad', 'repertorio', 'eventos'],
        });
        if (!banda) throw new NotFoundException('La banda no existe');
        return banda;
    }

    async findByUsuario(usuarioId: number) {
        const banda = await this.bandaRepo.findOne({
            where: { usuarioId },
            relations: ['ciudad', 'repertorio', 'eventos'],
        });
        if (!banda) throw new NotFoundException('No tienes ninguna banda registrada');
        return banda;
    }

    async updateLogo(id: number, imagenLogo: string) {
        const banda = await this.bandaRepo.findOneByOrFail({ id });
        banda.imagenLogo = imagenLogo;
        return await this.bandaRepo.save(banda);
    }

    async update(id: number, updateBandaDto: UpdateBandaDto, user: RequestUser) {
        const banda = await this.bandaRepo.findOne({
            where: { id },
            relations: ['usuario'],
        });

        if (!banda) throw new NotFoundException('Banda no encontrada');

        // Seguridad: Solo el dueño o el admin pueden editar
        if (user.rol !== 'admin' && banda.usuarioId !== user.id) {
            throw new ForbiddenException(
                'No tienes permiso para editar esta formación',
            );
        }

        const { repertorioIds, ...datosRestantes } = updateBandaDto;

        // Actualizamos los datos básicos
        Object.assign(banda, datosRestantes);

        // Si nos pasan IDs de marchas, buscamos las entidades y las vinculamos
        if (repertorioIds) {
            const marchas = await this.marchaRepo.findBy({
                id: In(repertorioIds),
            });
            banda.repertorio = marchas;
        }

        return await this.bandaRepo.save(banda);
    }

    remove(id: number) {
        return `This action removes a #${id} banda`;
    }

    async crearEvento(bandaId: number, createEventoDto: CreateEventoDto) {
        const banda = await this.bandaRepo.findOneBy({ id: bandaId });
        if (!banda) throw new NotFoundException('Banda no encontrada');
        const nuevoEvento = this.eventoRepo.create({
            ...createEventoDto,
            banda: { id: bandaId },
        });
        return await this.eventoRepo.save(nuevoEvento);
    }

    async obtenerEventos(bandaId: number) {
        return await this.eventoRepo.find({
            where: { banda: { id: bandaId } },
            order: { fechaHora: 'ASC' },
        });
    }

    /**
     * @brief Construye la agenda anual unificada de una banda combinando sus procesiones
     *        y eventos propios ordenados cronológicamente.
     *
     * @details
     * Ejecuta dos consultas independientes en paralelo conceptual (secuencial en la
     * implementación actual) y fusiona sus resultados en un array homogéneo:
     *
     * 1. **Participaciones** — Procesiones en las que la banda actúa ese año.
     *    Se carga el grafo `participacion → procesion → hermandad` para obtener el templo
     *    como campo `lugar` y el campo `ubicacion` (posición en la procesión) como `detalle`.
     *
     * 2. **Eventos propios** — Conciertos, presentaciones y demás actos de la banda.
     *    Se cargan todos los eventos y se filtra en memoria por año para evitar complicar
     *    el QueryBuilder con operadores de fecha (TypeORM no tiene `YEAR()` nativo portátil).
     *
     * El resultado unificado usa el tipo `AgendaItem` con las propiedades:
     * `{ fecha, tipo, nombre, lugar, detalle }`.
     *
     * @pre   `bandaId` debe corresponder a una banda existente.
     * @post  El array devuelto está ordenado cronológicamente ascendente por `fecha`.
     *        Si no hay actividad ese año, se devuelve un array vacío (sin error).
     *
     * @param {number} bandaId - Identificador único de la banda.
     * @param {number} anio    - Año del que se quiere obtener la agenda (p.ej. 2025).
     * @returns {Promise<any[]>} Agenda cronológica unificada con items normalizados.
     *
     * @complexity O(e) siendo e el número total de eventos de la banda; el filtrado en
     *             memoria sobre todos los eventos puede ser lento si la banda tiene historial
     *             extenso. Migrar a filtro SQL (`EXTRACT(YEAR FROM fechaHora) = :anio`) si
     *             se detecta degradación.
     *
     * @warning El filtrado de eventos se hace en memoria (JS), no en SQL. Para bandas con
     *          cientos de eventos en años anteriores, esto carga datos innecesarios de la BD.
     *
     * @note Los campos `tipo` de evento tienen valor por defecto `'Concierto'` cuando la
     *       entidad `Evento` no especifica tipo, para mantener la homogeneidad del array.
     *
     * @see BandasController.agenda
     * @see findAgenda (openapi: GET /bandas/{id}/agenda/{anio})
     */
    async findAgenda(bandaId: number, anio: number): Promise<any[]> {
        // 1. Buscamos las procesiones (Participaciones)
        const procesiones = await this.participacionRepo.find({
            where: { bandaId, anio },
            relations: ['procesion', 'procesion.hermandad'],
        });

        // 2. Buscamos los eventos de la banda
        // Usamos el Repositorio de Eventos (necesitarás inyectarlo en el constructor)
        const eventos = await this.eventoRepo.find({
            where: { bandaId },
            // Filtramos por año de forma sencilla (o usando TypeORM operators)
        });

        // Filtramos los eventos por año manualmente para no complicar el QueryBuilder
        const eventosDelAnio = eventos.filter(
            (e) => new Date(e.fechaHora).getFullYear() === anio,
        );

        // 3. Unificamos y formateamos
        const agendaCompleta = [
            ...procesiones.map((p) => ({
                fecha: p.procesion.fecha,
                tipo: 'Procesión',
                nombre: p.procesion.nombre,
                lugar: p.procesion.hermandad.templo,
                detalle: p.ubicacion,
            })),
            ...eventosDelAnio.map((e) => ({
                fecha: e.fechaHora,
                tipo: e.tipo || 'Concierto',
                nombre: e.titulo,
                lugar: e.lugar,
                detalle: e.descripcion,
            })),
        ];

        // 4. Ordenamos por fecha
        return agendaCompleta.sort(
            (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
        );
    }

    async actualizarEvento(
        bandaId: number,
        eventoId: number,
        dto: UpdateEventoDto,
        user: RequestUser,
    ) {
        const evento = await this.eventoRepo.findOne({
            where: { id: eventoId, bandaId },
        });
        if (!evento) throw new NotFoundException('Evento no encontrado');
        if (user.rol !== 'admin') {
            const banda = await this.bandaRepo.findOneBy({ id: bandaId });
            if (!banda || banda.usuarioId !== user.id) {
                throw new ForbiddenException(
                    'No tienes permiso para editar este evento',
                );
            }
        }
        Object.assign(evento, dto);
        return this.eventoRepo.save(evento);
    }

    async eliminarEvento(bandaId: number, eventoId: number, user: RequestUser) {
        const evento = await this.eventoRepo.findOne({
            where: { id: eventoId, bandaId },
        });
        if (!evento) throw new NotFoundException('Evento no encontrado');
        if (user.rol !== 'admin') {
            const banda = await this.bandaRepo.findOneBy({ id: bandaId });
            if (!banda || banda.usuarioId !== user.id) {
                throw new ForbiddenException(
                    'No tienes permiso para eliminar este evento',
                );
            }
        }
        return this.eventoRepo.remove(evento);
    }

    async verificar(id: number, estado: boolean) {
        const banda = await this.bandaRepo.findOneBy({ id });
        if (!banda) throw new NotFoundException('Banda no encontrada');
        banda.verificada = estado;
        return await this.bandaRepo.save(banda);
    }

    async getEnlaces(bandaId: number): Promise<EnlaceExterno[]> {
        return this.enlaceRepo.find({
            where: { bandaId },
            order: { createdAt: 'ASC' },
        });
    }

    async addEnlace(
        bandaId: number,
        dto: CreateEnlaceDto,
    ): Promise<EnlaceExterno> {
        const banda = await this.bandaRepo.findOneBy({ id: bandaId });
        if (!banda) throw new NotFoundException('Banda no encontrada');
        const enlace = this.enlaceRepo.create({ bandaId, ...dto });
        return this.enlaceRepo.save(enlace);
    }

    async removeEnlace(enlaceId: number, user: RequestUser): Promise<void> {
        const enlace = await this.enlaceRepo.findOne({
            where: { id: enlaceId },
            relations: ['banda'],
        });
        if (!enlace) throw new NotFoundException('Enlace no encontrado');
        const isOwner = enlace.banda?.usuarioId === user.id;
        const isAdmin = user.rol === 'admin';
        if (!isOwner && !isAdmin)
            throw new ForbiddenException(
                'Sin permisos para eliminar este enlace',
            );
        await this.enlaceRepo.remove(enlace);
    }
}
