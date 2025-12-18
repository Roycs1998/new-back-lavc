export enum PaymentMethodType {
  BANK_TRANSFER = 'bank_transfer', // Transferencia bancaria
  CULQI = 'culqi', // Culqi (tarjetas, yape vía Culqi)
  YAPE = 'yape', // Yape directo (sin Culqi)
  PLIN = 'plin', // Plin
  CASH = 'cash', // Efectivo (punto de venta)
  DEPOSIT = 'deposit', // Depósito bancario
}
