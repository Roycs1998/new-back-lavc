import { plainToInstance } from 'class-transformer';

export function toDto<TDoc extends { toJSON: () => object }, TDto>(
  doc: TDoc,
  dtoClass: new () => TDto,
): TDto {
  return plainToInstance(dtoClass, doc.toJSON(), {
    excludeExtraneousValues: true,
  });
}
