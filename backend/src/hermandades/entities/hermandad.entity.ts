import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Ciudad } from '../../ciudades/entities/ciudad.entity';

@Entity('hermandades')
export class Hermandad {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

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

    @ManyToOne(() => Ciudad, (ciudad) => ciudad.hermandades, {
        onDelete: 'CASCADE',
        eager: true,
    })
    ciudad: Ciudad;
}
