import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { Ciudad } from '../../ciudades/entities/ciudad.entity';
import { Usuario } from '@backend/usuarios/entities/usuario.entity';
import { Procesion } from '@backend/procesiones/entities/procesion.entity';
@Entity('hermandades')
export class Hermandad {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column()
    nombrePopular: string;

    @Column({ type: 'simple-array' })
    titulares: string[];

    @Column({ nullable: true })
    añoFundacion: number;

    @Column()
    templo: string; // Nombre de la iglesia/capilla

    @Column({ nullable: true })
    direccion: string; // Calle y número

    @Column({ nullable: true })
    codigoPostal: string;

    @Column({ nullable: true })
    diaSalida: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({ nullable: true })
    imagenEscudo: string;

    @Column({ type: 'uuid', nullable: true })
    escudoArchivoId: string | null;

    @Column({ nullable: true })
    ciudadId: number;

    @ManyToOne(() => Ciudad, (ciudad) => ciudad.hermandades, {
        onDelete: 'CASCADE',
        eager: true,
    })
    @JoinColumn({ name: 'ciudadId' })
    ciudad: Ciudad;

    @Column({ nullable: true })
    usuarioId: number;
    @OneToOne(() => Usuario, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'usuarioId' })
    usuario: Usuario;

    @OneToMany(() => Procesion, (p) => p.hermandad)
    procesiones: Procesion[];

    proximaProcesion?: Procesion | null;

    @Column({ default: false })
    verificada: boolean;
}
