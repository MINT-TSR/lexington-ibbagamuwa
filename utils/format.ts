export function formatLKR(amount: number): string {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', currencyDisplay: 'symbol' }).format(amount)
}

