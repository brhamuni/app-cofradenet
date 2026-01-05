import { PartialType } from '@nestjs/mapped-types';
import { CreateCiudadeDto } from './create-ciudade.dto';

export class UpdateCiudadeDto extends PartialType(CreateCiudadeDto) {}
