import { Procesion } from '@backend/procesiones/entities/procesion.entity';
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('pasos')
export class Paso {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column({ nullable: true })
    tipo: string;

    @Column({ nullable: true })
    orden: number;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column()
    procesionId: number;

    @ManyToOne(() => Procesion, (p) => p.pasos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'procesionId' })
    procesion: Procesion;
}
