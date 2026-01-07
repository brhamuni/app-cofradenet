import { Hermandad } from '@backend/hermandades/entities/hermandad.entity';
import { Banda } from '@backend/bandas/entities/banda.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';

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

    @Column({ select: false })
    password: string;

    @Column({
        type: 'enum',
        enum: RolUsuario,
        default: RolUsuario.COFRADE,
    })
    rol: RolUsuario;

    @OneToOne(() => Hermandad, (hermandad) => hermandad.usuario)
    hermandad: Hermandad;

    @OneToOne(() => Banda, (banda) => banda.usuario)
    banda: Banda;
}
