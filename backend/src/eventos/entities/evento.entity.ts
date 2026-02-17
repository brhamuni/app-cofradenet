import { Banda } from '@backend/bandas/entities/banda.entity';
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('eventos')
export class Evento {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    titulo: string; // Ej: "Certamen Santa Cecilia"

    @Column({ type: 'timestamp' }) // Guardamos fecha y hora exacta
    fechaHora: Date;

    @Column()
    lugar: string; // Ej: "Plaza de España, Sevilla"

    @Column({ type: 'text', nullable: true })
    descripcion: string; // Repertorio, notas, etc.

    @Column({ default: 'concierto' })
    tipo: string; // 'concierto', 'ensayo_puertas_abiertas', 'boda', etc.

    // Relación: Muchas actuaciones pertenecen a una Banda
    @Column()
    bandaId: number;

    @ManyToOne(() => Banda, (banda) => banda.eventos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bandaId' })
    banda: Banda;
}
