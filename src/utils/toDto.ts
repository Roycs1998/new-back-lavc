import { plainToInstance } from 'class-transformer';

export function toDto<TDoc, TDto>(
  doc: TDoc,
  dtoClass: new () => TDto,
): TDto {
  let plain = doc;

  if (doc && typeof (doc as any).toJSON === 'function') {
    plain = (doc as any).toJSON();
  } else if (doc && (doc as any)._id && !(doc as any).id) {
    // Handle plain objects from aggregate/lean
    plain = { ...doc, id: (doc as any)._id.toString() };
  }

  return plainToInstance(dtoClass, plain, {
    excludeExtraneousValues: true,
  });
}
