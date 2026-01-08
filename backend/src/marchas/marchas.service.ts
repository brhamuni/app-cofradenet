import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Marcha } from './entities/marcha.entity';
import { RolUsuario, Usuario } from '../usuarios/entities/usuario.entity';
import { CreateMarchaDto } from './dto/create-marcha.dto';

// Interfaz para los resultados de iTunes
interface iTunesSong {
    trackId: number;
    trackName: string;
    artistName: string;
    artworkUrl100: string;
}

@Injectable()
export class MarchasService {
    constructor(
        @InjectRepository(Marcha)
        private readonly marchasRepo: Repository<Marcha>,
        @InjectRepository(Usuario)
        private readonly usuariosRepo: Repository<Usuario>,
        private readonly httpService: HttpService,
    ) {}

    // 1. BUSCAR FUERA (iTunes)
    async buscarEniTunes(query: string) {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&attribute=allArtistTerm&limit=10`;
        const { data } = await firstValueFrom(
            this.httpService.get<{ results: iTunesSong[] }>(url),
        );

        return data.results.map((item) => ({
            idExterno: item.trackId.toString(),
            titulo: item.trackName,
            compositor: item.artistName,
            imagenUrl: item.artworkUrl100.replace('100x100bb', '600x600bb'),
        }));
    }

    // 2. BUSCAR DENTRO (Nuestra DB)
    async buscarLocal(query: string) {
        return await this.marchasRepo.find({
            where: [
                { titulo: Like(`%${query}%`) },
                { compositor: Like(`%${query}%`) },
            ],
            take: 10,
        });
    }

    async buscadorInteligente(q: string) {
        //Buscamos en paralelo en ambas fuentes
        const [locales, externos] = await Promise.all([
            this.buscarLocal(q),
            this.buscarEniTunes(q),
        ]);

        // Filtramos los resultados de iTunes para no mostrar lo que ya tenemos guardado
        // (Comparamos por el idExterno)
        const externosFiltrados = externos.filter(
            (ext) => !locales.some((loc) => loc.idExterno === ext.idExterno),
        );

        return {
            enMiCatalogo: locales,
            nuevasSugerencias: externosFiltrados,
        };
    }

    // 3. MÉTODO PRIVADO: BUSCAR O CREAR (Para no duplicar marchas)
    private async obtenerOCrear(
        dto: Partial<CreateMarchaDto>,
    ): Promise<Marcha> {
        let marcha = await this.marchasRepo.findOne({
            where: { idExterno: dto.idExterno },
        });

        if (!marcha) {
            marcha = this.marchasRepo.create({
                titulo: dto.titulo,
                compositor: dto.compositor,
                idExterno: dto.idExterno,
                imagenUrl: dto.imagenUrl,
            });
            marcha = await this.marchasRepo.save(marcha);
        }
        return marcha;
    }

    // 4. GUARDAR EN LISTA (Repertorio o Favoritos)
    async create(dto: CreateMarchaDto, usuarioId: number) {
        // Buscamos la marcha en la DB o la creamos si es nueva
        const marcha = await this.obtenerOCrear(dto);

        // Cargamos al usuario con sus relaciones
        const usuario = await this.usuariosRepo.findOne({
            where: { id: usuarioId },
            relations: ['favoritas', 'repertorio'],
        });

        if (!usuario) throw new NotFoundException('Usuario no encontrado');

        //Depende de qué lista quiera añadir, la añadimos si no está ya
        if (dto.tipoGuardado === 'favorita') {
            const yaEsFavorita = usuario.favoritas.some(
                (m) => m.id === marcha.id,
            );
            if (!yaEsFavorita) {
                usuario.favoritas.push(marcha);
            }
        } else if (dto.tipoGuardado === 'repertorio') {
            const yaEstaEnRepertorio = usuario.repertorio.some(
                (m) => m.id === marcha.id,
            );
            if (!yaEstaEnRepertorio) {
                usuario.repertorio.push(marcha);
            }
        }

        await this.usuariosRepo.save(usuario);

        return { message: `Marcha añadida a tus ${dto.tipoGuardado}s`, marcha };
    }

    async remove(
        usuarioId: number,
        marchaId: number,
        tipo: 'repertorio' | 'favorita',
    ) {
        // 1. Cargamos al usuario con la relación que queremos limpiar
        const usuario = await this.usuariosRepo.findOne({
            where: { id: usuarioId },
            relations: [tipo], // Cargará 'repertorio' o 'favoritas' dinámicamente
        });

        if (!usuario) throw new NotFoundException('Usuario no encontrado');

        // 2. Filtramos el array para quitar la marcha con ese ID
        // Si tipo es 'repertorio', editamos usuario.repertorio
        usuario[tipo] = usuario[tipo].filter((m) => m.id !== marchaId);

        // 3. Guardamos al usuario (TypeORM eliminará la fila en la tabla intermedia)
        await this.usuariosRepo.save(usuario);

        return { message: `Marcha eliminada de tu ${tipo}` };
    }

    async obtenerRepertorioBanda(bandaId: number) {
        const banda = await this.usuariosRepo.findOne({
            where: { id: bandaId, rol: RolUsuario.BANDA },
            relations: ['repertorio'],
            order: {
                repertorio: { titulo: 'ASC' },
            },
        });

        if (!banda) throw new NotFoundException('Banda no encontrada');

        return {
            nombreBanda: banda.nombre,
            repertorio: banda.repertorio,
        };
    }

    findAll() {
        return this.marchasRepo.find();
    }

    findOne(id: number) {
        return this.marchasRepo.findOne({ where: { id } });
    }

    update(id: number, updateMarchaDto: any) {
        return `Esta acción actualizaría la marcha #${id}`;
    }
}
