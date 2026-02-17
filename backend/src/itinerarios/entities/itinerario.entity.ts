import { Procesion } from '@backend/procesiones/entities/procesion.entity';
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('itinerarios')
export class Itinerario {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    anio: number;

    @Column({ type: 'time', nullable: true })
    horarioSalida: string;

    @Column({ type: 'time', nullable: true })
    horarioEntrada: string;

    @Column({ type: 'text', nullable: true })
    recorrido: string;

    @Column()
    procesionId: number;

    @ManyToOne(() => Procesion, (procesion) => procesion.itinerarios, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'procesionId' })
    procesion: Procesion;
}
