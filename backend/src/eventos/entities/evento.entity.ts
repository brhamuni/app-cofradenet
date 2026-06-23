import { Banda } from '@backend/bandas/entities/banda.entity';
import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
@Entity('eventos')
export class Evento {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    titulo: string; // Asegúrate de que se llame TITULO, no nombre

    @Column({ type: 'timestamp' })
    fechaHora: Date; // Asegúrate de que se llame FECHAHORA

    @Column()
    lugar: string;

    @Column({ nullable: true })
    descripcion: string;

    @Column({ nullable: true })
    tipo: string;

    @Column()
    bandaId: number;

    @ManyToOne(() => Banda, (banda) => banda.eventos)
    banda: Banda;
}
