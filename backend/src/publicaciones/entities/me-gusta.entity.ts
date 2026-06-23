import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { Usuario } from '@backend/usuarios/entities/usuario.entity';
import { Publicacion } from './publicacion.entity';

@Entity('me_gusta')
@Unique(['usuarioId', 'publicacionId'])
export class MeGusta {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    usuarioId: number;

    @Column()
    publicacionId: number;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'usuarioId' })
    usuario: Usuario;

    @ManyToOne(() => Publicacion, (p) => p.meGustas, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'publicacionId' })
    publicacion: Publicacion;
}
