export class CreateBandaDto {
    nombre: string;
    estiloMusical: string;
    localidad?: string;
    numeroComponentes?: number;
    imagenLogo?: string;
    usuarioId?: number;
    ciudadId?: number;
    historia?: string;
    repertorioIds?: number[];
}
