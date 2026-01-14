import { Hermandad } from '@backend/hermandades/entities/hermandad.entity';
import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { PuntoItinerario } from './punto-itinerario.entity';
import { Participacion } from '@backend/participaciones/entities/participacion.entity';

@Entity('procesiones')
export class Procesion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column()
    diaSemana: string;

    @Column({ type: 'date' })
    fecha: string;

    @Column({ type: 'time' })
    horaSalida: string;

    @Column({ type: 'time', nullable: true })
    horaEntrada: string;

    @ManyToOne(() => Hermandad, (h) => h.procesiones)
    hermandad: Hermandad;

    @OneToMany(() => PuntoItinerario, (punto) => punto.procesion, {
        cascade: true,
    })
    itinerario: PuntoItinerario[];

    @OneToMany(() => Participacion, (participacion) => participacion.procesion)
    participaciones: Participacion[];
}
