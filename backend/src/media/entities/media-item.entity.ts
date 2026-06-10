import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Ciudad } from '@backend/ciudades/entities/ciudad.entity';
import { Hermandad } from '@backend/hermandades/entities/hermandad.entity';
import { Banda } from '@backend/bandas/entities/banda.entity';
import { Procesion } from '@backend/procesiones/entities/procesion.entity';
import { Usuario } from '@backend/usuarios/entities/usuario.entity';

export enum TipoMedia {
    FOTO = 'foto',
    VIDEO = 'video',
    ENLACE = 'enlace',
}

@Entity('media_items')
export class MediaItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'enum', enum: TipoMedia })
    tipo: TipoMedia;

    @Column()
    url: string;

    /** Referencia al binario en PostgreSQL (tabla archivos) → MongoDB/local */
    @Column({ type: 'uuid', nullable: true })
    archivoId: string | null;

    @Column({ nullable: true })
    titulo: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({ nullable: true })
    anio: number;

    @Column({ nullable: true })
    ciudadId: number;

    @ManyToOne(() => Ciudad, { nullable: true, onDelete: 'SET NULL', eager: true })
    @JoinColumn({ name: 'ciudadId' })
    ciudad: Ciudad;

    @Column({ nullable: true })
    hermandadId: number;

    @ManyToOne(() => Hermandad, { nullable: true, onDelete: 'SET NULL', eager: true })
    @JoinColumn({ name: 'hermandadId' })
    hermandad: Hermandad;

    @Column({ nullable: true })
    bandaId: number;

    @ManyToOne(() => Banda, { nullable: true, onDelete: 'SET NULL', eager: true })
    @JoinColumn({ name: 'bandaId' })
    banda: Banda;

    @Column({ nullable: true })
    procesionId: number;

    @ManyToOne(() => Procesion, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'procesionId' })
    procesion: Procesion;

    @Column()
    autorId: number;

    @ManyToOne(() => Usuario, { onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'autorId' })
    autor: Usuario;

    @CreateDateColumn()
    createdAt: Date;
}
