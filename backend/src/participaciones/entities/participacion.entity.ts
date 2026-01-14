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
    id: string;

    @Column()
    anio: number;

    @Column({ nullable: true })
    ubicacion: string;

    @Column()
    bandaId: string;

    @ManyToOne(() => Banda, (banda) => banda.participaciones, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'bandaId' })
    banda: Banda;

    @Column()
    procesionId: string;

    @ManyToOne(() => Procesion, (procesion) => procesion.participaciones, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'procesionId' })
    procesion: Procesion;
}
