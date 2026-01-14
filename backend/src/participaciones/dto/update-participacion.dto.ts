import { PartialType } from '@nestjs/mapped-types';
import { CreateParticipacionDto } from './create-participacion.dto';

export class UpdateParticipacionDto extends PartialType(
    CreateParticipacionDto,
) {}
