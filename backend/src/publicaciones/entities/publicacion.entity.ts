import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '@backend/usuarios/entities/usuario.entity';
import { Hermandad } from '@backend/hermandades/entities/hermandad.entity';
import { Banda } from '@backend/bandas/entities/banda.entity';
import { MeGusta } from './me-gusta.entity';
import { Comentario } from './comentario.entity';

export enum TipoPublicacion {
    GENERAL = 'general',
    ITINERARIO = 'itinerario',
    ENLACE_SOCIAL = 'enlace_social',
}

@Entity('publicaciones')
export class Publicacion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    contenido: string;

    @Column({ nullable: true })
    imagenUrl: string;

    @Column({ nullable: true })
    urlExterna: string;

    @Column({ type: 'enum', enum: TipoPublicacion, default: TipoPublicacion.GENERAL })
    tipo: TipoPublicacion;

    @CreateDateColumn()
    fechaCreacion: Date;

    @Column()
    autorId: number;

    @ManyToOne(() => Usuario, { onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'autorId' })
    autor: Usuario;

    @Column({ nullable: true })
    hermandadId: number;

    @ManyToOne(() => Hermandad, { nullable: true, onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'hermandadId' })
    hermandad: Hermandad;

    @Column({ nullable: true })
    bandaId: number;

    @ManyToOne(() => Banda, { nullable: true, onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'bandaId' })
    banda: Banda;

    @OneToMany(() => MeGusta, (mg) => mg.publicacion)
    meGustas: MeGusta[];

    @OneToMany(() => Comentario, (c) => c.publicacion)
    comentarios: Comentario[];
}
