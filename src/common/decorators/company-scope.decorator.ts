import { SetMetadata } from '@nestjs/common';

export const COMPANY_SCOPE_KEY = 'companyScope';
export const CompanyScope = () => SetMetadata(COMPANY_SCOPE_KEY, true);
