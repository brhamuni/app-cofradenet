import { Usuario } from '@backend/usuarios/entities/usuario.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('marchas')
export class Marcha {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    titulo: string;

    @Column()
    compositor: string;

    @Column()
    año: number;

    @Column()
    duracion: number;

    @Column({ nullable: true })
    imagenUrl: string;

    @Column({ nullable: true })
    idExterno: string;

    //Relacion para las bandas que tienen esta marcha en su repertorio
    @ManyToMany(() => Usuario, (usuario) => usuario.repertorio)
    tocadaPor: Usuario[];

    //Relacion para los usuarios que tienen esta marcha como favorita
    @ManyToMany(() => Usuario, (usuario) => usuario.favoritas)
    leGustaA: Usuario[];
}
