import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '@backend/usuarios/entities/usuario.entity';
import { Publicacion } from './publicacion.entity';

@Entity('comentarios')
export class Comentario {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    contenido: string;

    @Column()
    usuarioId: number;

    @Column()
    publicacionId: number;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Usuario, { onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'usuarioId' })
    autor: Usuario;

    @ManyToOne(() => Publicacion, (p) => p.comentarios, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'publicacionId' })
    publicacion: Publicacion;
}
