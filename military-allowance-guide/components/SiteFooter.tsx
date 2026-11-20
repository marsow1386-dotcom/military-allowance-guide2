import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <strong>군 수당 가이드</strong>
          <p>간부·병사·군무원이 받을 수 있는 수당과 신청 방법을 안내합니다. 금액은 2026년 기준 참고용이며, 실제 지급은 소속 부대 인사·급여 담당에게 확인하세요.</p>
        </div>
        <nav className="footer-links" aria-label="바로가기">
          <Link href="/finder">내 수당 찾기</Link>
          <Link href="/allowances">전체 수당</Link>
          <Link href="/guides">상황별 가이드</Link>
          <Link href="/faq">자주 묻는 질문</Link>
        </nav>
        <div className="footer-links">
          <a href="https://www.law.go.kr/법령/공무원수당등에관한규정" target="_blank" rel="noreferrer">공무원수당 등에 관한 규정</a>
          <a href="https://www.mpm.go.kr/mpm/info/resultPay/bizPay01" target="_blank" rel="noreferrer">인사혁신처 보수체계</a>
        </div>
      </div>
    </footer>
  );
}
