import { Ciudad } from '@backend/ciudades/entities/ciudad.entity';
import { Usuario } from '@backend/usuarios/entities/usuario.entity';
import {
    PrimaryGeneratedColumn,
    Column,
    Entity,
    OneToOne,
    JoinColumn,
    ManyToOne,
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
    direccion: string;

    @Column({ nullable: true })
    localidad: string;

    @Column({ nullable: true })
    codigoPostal: string;

    @Column({ nullable: true })
    numeroComponentes: number;

    @Column({ nullable: true })
    imagenLogo: string;

    @Column({ nullable: true })
    usuarioId: number;
    @OneToOne(() => Usuario, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'usuarioId' })
    usuario: Usuario;

    @Column({ nullable: true })
    ciudadId: number;

    @ManyToOne(() => Ciudad, (ciudad) => ciudad.hermandades, {
        onDelete: 'CASCADE',
        eager: true,
    })
    @JoinColumn({ name: 'ciudadId' })
    ciudad: Ciudad;
}
