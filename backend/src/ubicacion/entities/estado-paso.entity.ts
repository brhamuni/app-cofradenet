import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Procesion } from '@backend/procesiones/entities/procesion.entity';
import { Usuario } from '@backend/usuarios/entities/usuario.entity';

@Entity('estados_paso')
export class EstadoPaso {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    procesionId: number;

    @ManyToOne(() => Procesion, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'procesionId' })
    procesion: Procesion;

    @Column()
    nombrePaso: string;

    @Column()
    estado: string;

    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
    latitud: number;

    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
    longitud: number;

    @Column()
    autorId: number;

    @ManyToOne(() => Usuario, { onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'autorId' })
    autor: Usuario;

    @CreateDateColumn()
    createdAt: Date;
}
