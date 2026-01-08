import { PartialType } from '@nestjs/mapped-types';
import { CreateMarchaDto } from './create-marcha.dto';

export class UpdateMarchaDto extends PartialType(CreateMarchaDto) {}
