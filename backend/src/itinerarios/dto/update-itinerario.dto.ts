import { PartialType } from '@nestjs/mapped-types';
import { CreateItinerarioDto } from './create-itinerario.dto';

export class UpdateItinerarioDto extends PartialType(CreateItinerarioDto) {}
