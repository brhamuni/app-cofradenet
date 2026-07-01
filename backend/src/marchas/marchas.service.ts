/**
 * @file marchas.service.ts
 * @brief Servicio de gestión del catálogo de marchas procesionales de CofradeNet.
 * @details Integra búsqueda dual (base de datos local + API de iTunes), creación
 *          inteligente evitando duplicados y gestión de listas personales
 *          (repertorio y favoritas) para usuarios y bandas.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Marcha } from './entities/marcha.entity';
import { RolUsuario, Usuario } from '../usuarios/entities/usuario.entity';
import { CreateMarchaDto } from './dto/create-marcha.dto';

/**
 * @brief Interfaz que mapea los campos relevantes de un resultado de la API de iTunes.
 */
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

    /**
     * @brief Busca marchas procesionales en la API pública de iTunes.
     *
     * @details
     * Realiza una petición HTTP GET al endpoint de búsqueda de iTunes con el
     * parámetro `entity=song&attribute=allArtistTerm`, limitando a 10 resultados.
     * La URL de la imagen se modifica reemplazando la miniatura `100x100bb` por
     * la versión de alta resolución `600x600bb` para uso en la interfaz.
     * Usa `firstValueFrom` para convertir el Observable de `HttpService` en una Promise.
     *
     * @param {string} query - Término de búsqueda (nombre de marcha o compositor).
     * @returns {Promise<Array<{ idExterno: string; titulo: string; compositor: string; imagenUrl: string }>>}
     *          Lista de hasta 10 resultados normalizados de iTunes.
     */
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

    /**
     * @brief Busca marchas en la base de datos local por título o compositor.
     *
     * @details
     * Utiliza el operador `Like` de TypeORM con comodines `%query%` para búsqueda
     * parcial insensible a mayúsculas (depende del cotejamiento de la BD).
     * Las condiciones de título y compositor se evalúan con OR (`where: [...]`).
     *
     * @param {string} query - Término de búsqueda parcial.
     * @returns {Promise<Marcha[]>} Hasta 10 marchas que coincidan con el término.
     */
    async buscarLocal(query: string) {
        return await this.marchasRepo.find({
            where: [
                { titulo: Like(`%${query}%`) },
                { compositor: Like(`%${query}%`) },
            ],
            take: 10,
        });
    }

    /**
     * @brief Realiza una búsqueda inteligente combinando el catálogo local e iTunes.
     *
     * @details
     * Ejecuta `buscarLocal` y `buscarEniTunes` en paralelo con `Promise.all`. Después,
     * filtra los resultados de iTunes para excluir las marchas que ya existen en el
     * catálogo local (comparación por `idExterno`), evitando mostrar duplicados al usuario.
     *
     * El resultado se estructura en dos secciones diferenciadas:
     * - `enMiCatalogo`: marchas ya guardadas en CofradeNet.
     * - `nuevasSugerencias`: resultados de iTunes no presentes en el catálogo local.
     *
     * @pre   El servicio HTTP debe estar configurado y la red debe ser accesible.
     * @post  Los resultados de iTunes ya filtrados no contienen marchas del catálogo local.
     *
     * @param {string} q - Término de búsqueda.
     * @returns {Promise<{ enMiCatalogo: Marcha[]; nuevasSugerencias: object[] }>}
     *          Resultado combinado con marchas locales y sugerencias externas deduplicadas.
     *
     * @complexity O(l * e) donde l = resultados locales y e = resultados de iTunes,
     *             para la operación de filtrado. En la práctica ambos conjuntos son <= 10.
     */
    async buscadorInteligente(q: string) {
        const [locales, externos] = await Promise.all([
            this.buscarLocal(q),
            this.buscarEniTunes(q),
        ]);

        const externosFiltrados = externos.filter(
            (ext) => !locales.some((loc) => loc.idExterno === ext.idExterno),
        );

        return {
            enMiCatalogo: locales,
            nuevasSugerencias: externosFiltrados,
        };
    }

    /**
     * @brief Busca una marcha por `idExterno` o la crea si no existe (patrón find-or-create).
     *
     * @details
     * Evita duplicados en el catálogo garantizando que cada marcha externa (iTunes)
     * tenga como máximo un registro en la base de datos, identificado por `idExterno`.
     * Si la marcha ya existe, devuelve la instancia existente sin modificarla.
     *
     * @pre   El campo `dto.idExterno` debe ser único en el catálogo para cada marcha externa.
     * @post  Existe exactamente un registro en `marchas` con ese `idExterno`.
     *
     * @param {Partial<CreateMarchaDto>} dto - Datos mínimos de la marcha (`titulo`, `compositor`,
     *        `idExterno`, `imagenUrl`).
     * @returns {Promise<Marcha>} Marcha existente o recién creada.
     */
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

    /**
     * @brief Guarda una marcha en la lista personal de un usuario (repertorio o favoritas).
     *
     * @details
     * Flujo completo de guardado:
     * 1. Llama a `obtenerOCrear` para garantizar la existencia de la marcha en el catálogo.
     * 2. Carga al usuario con las relaciones `favoritas` y `repertorio`.
     * 3. Según `dto.tipoGuardado`, añade la marcha al array correspondiente solo si
     *    no está ya presente (comprobación por `id`), evitando duplicados en la lista.
     * 4. Persiste el usuario, lo que actualiza la tabla intermedia de la relación M:N.
     *
     * @pre   El usuario debe existir en base de datos.
     * @post  La marcha queda añadida a la lista indicada si no estaba ya; en caso
     *        contrario, la operación es silenciosamente idempotente.
     *
     * @param {CreateMarchaDto} dto        - DTO con los datos de la marcha y `tipoGuardado`
     *        (`'favorita'` o `'repertorio'`).
     * @param {number} usuarioId           - Identificador del usuario que guarda la marcha.
     * @returns {Promise<{ message: string; marcha: Marcha }>} Mensaje de confirmación y
     *          entidad de la marcha guardada.
     *
     * @throws {NotFoundException} Si el usuario no existe.
     */
    async create(dto: CreateMarchaDto, usuarioId: number) {
        const marcha = await this.obtenerOCrear(dto);

        const usuario = await this.usuariosRepo.findOne({
            where: { id: usuarioId },
            relations: ['favoritas', 'repertorio'],
        });

        if (!usuario) throw new NotFoundException('Usuario no encontrado');

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

    /**
     * @brief Elimina una marcha de la lista personal de un usuario.
     *
     * @details
     * Carga al usuario con la relación dinámica (`repertorio` o `favoritas`) y
     * filtra el array en memoria para excluir la marcha con el `id` indicado.
     * Al persistir el usuario, TypeORM elimina automáticamente la fila correspondiente
     * en la tabla intermedia de la relación M:N, sin borrar la marcha del catálogo.
     *
     * @pre   El usuario debe existir en base de datos.
     * @post  La fila de la tabla intermedia queda eliminada; la entidad `Marcha` permanece.
     *
     * @param {number} usuarioId                  - Identificador del usuario.
     * @param {number} marchaId                   - Identificador de la marcha a eliminar.
     * @param {'repertorio' | 'favorita'} tipo    - Lista de la que se elimina la marcha.
     * @returns {Promise<{ message: string }>} Mensaje de confirmación.
     *
     * @throws {NotFoundException} Si el usuario no existe.
     */
    async remove(
        usuarioId: number,
        marchaId: number,
        tipo: 'repertorio' | 'favorita',
    ) {
        const usuario = await this.usuariosRepo.findOne({
            where: { id: usuarioId },
            relations: [tipo],
        });

        if (!usuario) throw new NotFoundException('Usuario no encontrado');

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        usuario[tipo] = (usuario[tipo] as Marcha[]).filter((m) => m.id !== marchaId);

        await this.usuariosRepo.save(usuario);

        return { message: `Marcha eliminada de tu ${tipo}` };
    }

    /**
     * @brief Obtiene el repertorio completo de una banda ordenado alfabéticamente.
     *
     * @details
     * Busca el usuario con rol `BANDA` correspondiente al `bandaId` y carga
     * su relación `repertorio` ordenada por `titulo` ascendente. Devuelve
     * tanto el nombre de la banda como el array de marchas.
     *
     * @param {number} bandaId - Identificador del usuario con rol `BANDA`.
     * @returns {Promise<{ nombreBanda: string; repertorio: Marcha[] }>}
     *          Nombre de la banda y su lista de marchas ordenada.
     *
     * @throws {NotFoundException} Si no existe un usuario con ese ID y rol `BANDA`.
     */
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

    /**
     * @brief Obtiene todas las marchas del catálogo.
     *
     * @returns {Promise<Marcha[]>} Lista completa de marchas sin filtrar ni paginar.
     */
    findAll() {
        return this.marchasRepo.find();
    }

    /**
     * @brief Busca una marcha por su identificador primario.
     *
     * @param {number} id - Identificador de la marcha.
     * @returns {Promise<Marcha | null>} Entidad de la marcha o `null` si no existe.
     */
    findOne(id: number) {
        return this.marchasRepo.findOne({ where: { id } });
    }

    /**
     * @brief Actualiza una marcha del catálogo (pendiente de implementación).
     *
     * @param {number} id             - Identificador de la marcha a actualizar.
     * @param {any} updateMarchaDto   - DTO con los campos a actualizar.
     * @returns {string} Mensaje provisional indicando la acción pendiente.
     */
    update(id: number, updateMarchaDto: any) {
        return `Esta acción actualizaría la marcha #${id}`;
    }
}
