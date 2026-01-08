import { Hermandad } from '@backend/hermandades/entities/hermandad.entity';
import { Banda } from '@backend/bandas/entities/banda.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    ManyToMany,
    JoinTable,
} from 'typeorm';
import { Marcha } from '@backend/marchas/entities/marcha.entity';

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

    @Column({ default: false })
    verificado: boolean;

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

    @ManyToMany(() => Marcha)
    @JoinTable({ name: 'bandas_repertorio' })
    repertorio: Marcha[];

    @ManyToMany(() => Marcha)
    @JoinTable({ name: 'usuarios_favoritas' })
    favoritas: Marcha[];
}
