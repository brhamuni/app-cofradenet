import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('ciudades')
export class Ciudad {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column()
    pais: string;

    @Column()
    provincia: string;
}
