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
import { Hermandad } from '@backend/hermandades/entities/hermandad.entity';
import { Banda } from '@backend/bandas/entities/banda.entity';

@Entity('seguimientos')
@Unique(['seguidorId', 'hermandadId', 'bandaId', 'seguidoUsuarioId'])
export class Seguimiento {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    seguidorId: number;

    @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'seguidorId' })
    seguidor: Usuario;

    // Seguir hermandad
    @Column({ nullable: true })
    hermandadId: number;

    @ManyToOne(() => Hermandad, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'hermandadId' })
    hermandad: Hermandad;

    // Seguir banda
    @Column({ nullable: true })
    bandaId: number;

    @ManyToOne(() => Banda, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bandaId' })
    banda: Banda;

    // Seguir usuario
    @Column({ nullable: true })
    seguidoUsuarioId: number;

    @ManyToOne(() => Usuario, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'seguidoUsuarioId' })
    seguidoUsuario: Usuario;

    @CreateDateColumn()
    fecha: Date;
}
