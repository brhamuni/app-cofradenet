import { Hermandad } from '@backend/hermandades/entities/hermandad.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('ciudades')
export class Ciudad {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    nombre: string;

    @Column()
    pais: string;

    @Column()
    provincia: string;

    @OneToMany(() => Hermandad, (hermandad) => hermandad.ciudad)
    hermandades: Hermandad[];
}
