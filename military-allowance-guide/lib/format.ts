export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export const manwon = (n: number) => {
  if (n % 10_000 === 0) return `${(n / 10_000).toLocaleString("ko-KR")}만 원`;
  return won(n);
};

export const dateKo = (iso: string) => iso.replaceAll("-", ".");
