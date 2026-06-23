import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '@backend/usuarios/entities/usuario.entity';

@Entity('eventos_importantes')
export class EventoImportante {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    usuarioId: number;

    @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'usuarioId' })
    usuario: Usuario;

    @Column()
    eventoTipo: string;

    @Column()
    eventoId: number;

    @Column({ nullable: true })
    titulo: string;

    @CreateDateColumn()
    createdAt: Date;
}
