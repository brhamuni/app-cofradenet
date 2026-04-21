import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '@backend/usuarios/entities/usuario.entity';
import { Hermandad } from '@backend/hermandades/entities/hermandad.entity';
import { Banda } from '@backend/bandas/entities/banda.entity';

export enum TipoPublicacion {
    GENERAL = 'general',
    ITINERARIO = 'itinerario',
}

@Entity('publicaciones')
export class Publicacion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    contenido: string;

    @Column({ nullable: true })
    imagenUrl: string;

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
}
