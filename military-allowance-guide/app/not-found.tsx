import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container page-body" style={{ textAlign: "center", padding: "96px 24px" }}>
      <h1 style={{ fontSize: 28 }}>페이지를 찾을 수 없습니다</h1>
      <p className="muted" style={{ margin: "10px 0 24px" }}>주소가 바뀌었거나 없는 페이지입니다.</p>
      <Link href="/" className="btn btn-primary">홈으로</Link>
    </div>
  );
}
