import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';
import { CreateUserWithPersonDto } from 'src/persons/dto/create-user-with-person.dto';

export class CreateUserDto extends CreateUserWithPersonDto {
  @ApiProperty({ description: 'Person ID reference' })
  @IsMongoId()
  personId: string;
}
