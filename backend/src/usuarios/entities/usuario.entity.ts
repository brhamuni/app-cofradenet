import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum RolUsuario {
    ADMIN = 'admin',
    COFRADE = 'cofrade',
    HERMANDAD = 'hermandad',
    BANDA = 'banda',
}
@Entity('usuarios')
export class Usuario {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column({ unique: true })
    username: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({
        type: 'enum',
        enum: RolUsuario,
        default: RolUsuario.COFRADE,
    })
    rol: RolUsuario;
}
