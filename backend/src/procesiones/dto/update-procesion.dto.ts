import { PartialType } from '@nestjs/mapped-types';
import { CreateProcesionDto } from './create-procesion.dto';

export class UpdateProcesionDto extends PartialType(CreateProcesionDto) {}
