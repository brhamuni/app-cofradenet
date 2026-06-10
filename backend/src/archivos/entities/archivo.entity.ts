import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('archivos')
export class Archivo {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /** Proveedor donde vive el binario: local | r2 | mongodb */
    @Column()
    storageProvider: string;

    /** ID del fichero en el proveedor (nombre local o ObjectId de GridFS) */
    @Column()
    fileId: string;

    @Column()
    mimeType: string;

    @Column({ nullable: true })
    originalName: string;

    @Column({ type: 'bigint', nullable: true })
    size: number;

    @CreateDateColumn()
    createdAt: Date;
}
