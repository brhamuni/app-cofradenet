import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '@backend/usuarios/entities/usuario.entity';

export enum TipoNotificacion {
    EVENTO_IMPORTANTE = 'evento_importante',
    NUEVA_PROCESION = 'nueva_procesion',
    NUEVO_EVENTO = 'nuevo_evento',
    NUEVA_PUBLICACION = 'nueva_publicacion',
    SISTEMA = 'sistema',
}

@Entity('notificaciones')
export class Notificacion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    usuarioId: number;

    @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'usuarioId' })
    usuario: Usuario;

    @Column({ type: 'enum', enum: TipoNotificacion })
    tipo: TipoNotificacion;

    @Column()
    titulo: string;

    @Column({ type: 'text', nullable: true })
    cuerpo: string;

    @Column({ nullable: true })
    urlDestino: string;

    @Column({ default: false })
    leida: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
