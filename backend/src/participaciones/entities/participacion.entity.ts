import { Banda } from '@backend/bandas/entities/banda.entity';
import { Procesion } from '@backend/procesiones/entities/procesion.entity';
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('participaciones')
export class Participacion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    anio: number;

    @Column({ nullable: true })
    ubicacion: string;

    @Column({ nullable: true })
    bandaId: number | null;

    @Column({ nullable: true })
    nombreBanda: string | null;

    @ManyToOne(() => Banda, (banda) => banda.participaciones, {
        onDelete: 'CASCADE',
        nullable: true,
    })
    @JoinColumn({ name: 'bandaId' })
    banda: Banda | null;

    @Column()
    procesionId: number;

    @ManyToOne(() => Procesion, (procesion) => procesion.participaciones, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'procesionId' })
    procesion: Procesion;
}
