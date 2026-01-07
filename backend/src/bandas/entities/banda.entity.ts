import { Usuario } from '@backend/usuarios/entities/usuario.entity';
import {
    PrimaryGeneratedColumn,
    Column,
    Entity,
    OneToOne,
    JoinColumn,
} from 'typeorm';

@Entity('bandas')
export class Banda {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column()
    estiloMusical: string;

    @Column({ nullable: true })
    localidad: string;

    @Column({ nullable: true })
    numeroComponentes: number;

    @Column({ nullable: true })
    imagenLogo: string;

    @OneToOne(() => Usuario, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn()
    usuario: Usuario;
}
