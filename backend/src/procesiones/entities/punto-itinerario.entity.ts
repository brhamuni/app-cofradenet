import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Procesion } from '@backend/procesiones/entities/procesion.entity';

@Entity('puntos_itinerario')
export class PuntoItinerario {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    orden: number; // 1, 2, 3... fundamental para trazar la línea

    @Column()
    nombreLugar: string; // Ej: "Salida", "Plaza Mayor"

    @Column({ type: 'decimal', precision: 10, scale: 8 })
    latitud: number;

    @Column({ type: 'decimal', precision: 11, scale: 8 })
    longitud: number;

    @ManyToOne(() => Procesion, (p) => p.itinerario, { onDelete: 'CASCADE' })
    procesion: Procesion;
}
