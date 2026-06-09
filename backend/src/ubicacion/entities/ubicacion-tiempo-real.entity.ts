import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Procesion } from '@backend/procesiones/entities/procesion.entity';
import { Usuario } from '@backend/usuarios/entities/usuario.entity';

@Entity('ubicaciones_tiempo_real')
export class UbicacionTiempoReal {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    procesionId: number;

    @ManyToOne(() => Procesion, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'procesionId' })
    procesion: Procesion;

    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
    latitud: number;

    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
    longitud: number;

    @Column({ default: false })
    estaActiva: boolean;

    @Column({ nullable: true })
    compartidoPorId: number;

    @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'compartidoPorId' })
    compartidoPor: Usuario;

    @UpdateDateColumn()
    updatedAt: Date;
}
