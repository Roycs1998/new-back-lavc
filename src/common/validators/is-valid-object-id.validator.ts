import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Types } from 'mongoose';

export function IsValidObjectId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidObjectId',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: `${propertyName} debe ser un ObjectId válido de MongoDB`,
        ...validationOptions,
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          return value ? Types.ObjectId.isValid(value) : true; // Allow optional
        },
      },
    });
  };
}
