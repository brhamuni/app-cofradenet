import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Banda } from './banda.entity';

export enum PlataformaEnlace {
    YOUTUBE = 'youtube',
    SPOTIFY = 'spotify',
    INSTAGRAM = 'instagram',
    OTRO = 'otro',
}

@Entity('enlaces_externos')
export class EnlaceExterno {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    bandaId: number;

    @ManyToOne(() => Banda, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bandaId' })
    banda: Banda;

    @Column({
        type: 'enum',
        enum: PlataformaEnlace,
        default: PlataformaEnlace.OTRO,
    })
    plataforma: PlataformaEnlace;

    @Column()
    url: string;

    @Column({ nullable: true })
    titulo: string;

    @CreateDateColumn()
    createdAt: Date;
}
