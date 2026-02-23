import { Ciudad } from '@backend/ciudades/entities/ciudad.entity';
import { Evento } from '@backend/eventos/entities/evento.entity';
import { Marcha } from '@backend/marchas/entities/marcha.entity';
import { Participacion } from '@backend/participaciones/entities/participacion.entity';
import { Usuario } from '@backend/usuarios/entities/usuario.entity';
import {
    PrimaryGeneratedColumn,
    Column,
    Entity,
    OneToOne,
    JoinColumn,
    ManyToOne,
    ManyToMany,
    JoinTable,
    OneToMany,
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

    @Column({ type: 'text', nullable: true })
    historia: string;

    @ManyToMany(() => Marcha, (marcha) => marcha.bandas)
    @JoinTable({
        name: 'repertorios_bandas', // Nombre de la tabla intermedia
        joinColumn: { name: 'bandaId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'marchaId', referencedColumnName: 'id' },
    })
    repertorio: Marcha[];

    @OneToMany(() => Participacion, (participacion) => participacion.banda)
    participaciones: Participacion[];

    @OneToMany(() => Evento, (evento) => evento.banda)
    eventos: Evento[];

    @Column({ default: false })
    verificada: boolean;
}
