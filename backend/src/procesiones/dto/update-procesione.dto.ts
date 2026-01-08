import { PartialType } from '@nestjs/mapped-types';
import { CreateProcesioneDto } from './create-procesione.dto';

export class UpdateProcesioneDto extends PartialType(CreateProcesioneDto) {}
