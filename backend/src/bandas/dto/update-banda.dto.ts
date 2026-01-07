import { PartialType } from '@nestjs/mapped-types';
import { CreateBandaDto } from './create-banda.dto';

export class UpdateBandaDto extends PartialType(CreateBandaDto) {}
