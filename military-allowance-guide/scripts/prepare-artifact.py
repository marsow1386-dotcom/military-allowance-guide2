"""out/ 를 '_' 로 시작하는 경로를 쓰지 못하는 정적 호스팅용으로 바꿔 out-artifact/ 에 씁니다."""
import os, re, shutil, sys
src, dst = "out", "out-artifact"
shutil.rmtree(dst, ignore_errors=True)
shutil.copytree(src, dst)
# 1) 폴더·파일 이름에서 선행 '_' 제거 (깊은 경로부터)
renames = {}
for root, dirs, files in os.walk(dst, topdown=False):
    for n in files + dirs:
        if n.startswith("_"):
            new = "u" + n  # _next -> u_next 는 여전히 '_' 시작이 아니므로 OK
            os.rename(os.path.join(root, n), os.path.join(root, new))
            renames[n.split(".")[0] if n in files else n] = new.split(".")[0] if n in files else new
# 2) 파일 내용의 참조 치환
pairs = sorted({(k, v) for k, v in renames.items()}, key=lambda kv: -len(kv[0]))
pat = re.compile(r"(?<![A-Za-z0-9_])(" + "|".join(re.escape(k) for k, _ in pairs) + r")(?=[/.\"'\-]|$)")
m = dict(pairs)
for root, _, files in os.walk(dst):
    for f in files:
        if not f.endswith((".html", ".js", ".txt", ".css", ".json")):
            continue
        p = os.path.join(root, f)
        s = open(p, encoding="utf-8").read()
        s2 = pat.sub(lambda x: m[x.group(1)], s)
        if s2 != s:
            open(p, "w", encoding="utf-8").write(s2)
print("renamed:", sorted(m.items()))
