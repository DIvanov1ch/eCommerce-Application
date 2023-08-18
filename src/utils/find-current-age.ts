export default function findCurrentAge(value: string): number {
  const date: Date = new Date();
  const birthday: Date = new Date(value);
  const estimatedAge: number = date.getFullYear() - birthday.getFullYear();
  const currentAge: number = date.setFullYear(1970) < birthday.setFullYear(1970) ? estimatedAge - 1 : estimatedAge;
  return currentAge;
}
