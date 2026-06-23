import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '@backend/usuarios/entities/usuario.entity';

@Entity('suscripciones_push')
export class SuscripcionPush {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    usuarioId: number;

    @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'usuarioId' })
    usuario: Usuario;

    @Column()
    endpoint: string;

    @Column({ type: 'text' })
    p256dh: string;

    @Column({ type: 'text' })
    auth: string;

    @CreateDateColumn()
    createdAt: Date;
}
