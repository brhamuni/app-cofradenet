import { PartialType } from '@nestjs/mapped-types';
import { CreateHermandadDto } from './create-hermandad.dto';

export class UpdateHermandadDto extends PartialType(CreateHermandadDto) {}
