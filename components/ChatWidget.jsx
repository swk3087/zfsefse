import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnon);

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [oldestAt, setOldestAt] = useState(null); // cursor for infinite scroll
  const listRef = useRef();

  const PAGE_SIZE = 20;

  useEffect(() => {
    // 초기 최신 메시지 로드
    loadLatest();
    // 실시간 구독(옵션)
    const sub = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        payload => {
          setMessages(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  async function loadLatest() {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    if (!error && data) {
      setMessages(data);
      if (data.length) setOldestAt(data[data.length - 1].created_at);
    }
  }

  async function loadMore() {
    if (loadingMore || !oldestAt) return;
    setLoadingMore(true);
    // older than oldestAt
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .lt("created_at", oldestAt)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    if (!error && data) {
      setMessages(prev => [...prev, ...data]);
      if (data.length) setOldestAt(data[data.length - 1].created_at);
      else setOldestAt(null);
    }
    setLoadingMore(false);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!content.trim()) return;
    const payload = { name: name || "익명", content: content.trim() };
    const { data, error } = await supabase.from("messages").insert(payload).select().single();
    if (!error && data) {
      // insert 시 실시간으로 들어오거나, 아래로 직접 추가 가능
      setContent("");
      // 스크롤을 맨 위(최신)로 보이게
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      alert("전송 실패");
    }
  }

  return (
    <>
      {/* 토글 버튼 (눈에 많이 띄지 않게) */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "none",
          background: "rgba(0,0,0,0.45)",
          color: "white",
          cursor: "pointer",
          zIndex: 9999
        }}
        title={open ? "채팅 닫기" : "채팅 열기"}
      >
        💬
      </button>

      {/* 채팅 패널 */}
      <div
        style={{
          position: "fixed",
          right: 18,
          bottom: 86,
          width: 320,
          maxHeight: 420,
          background: "transparent", // 투명 배경(글자만 보이게)
          zIndex: 9998,
          display: open ? "block" : "none",
          pointerEvents: "auto"
        }}
      >
        <div
          style={{
            // 안쪽 컨테이너는 배경을 거의 투명하게 두고 텍스트만 또렷하게
            backdropFilter: "blur(4px)",
            padding: 8,
            borderRadius: 8,
            boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
            background: "rgba(255,255,255,0.02)" // 거의 투명
          }}
        >
          <div style={{ height: 300, overflow: "auto", display: "flex", flexDirection: "column-reverse" }} ref={listRef}>
            {/* messages는 최신순(내부 로직에서 최신을 앞에 둠). 역순으로 보여주기 때문에 column-reverse 사용 */}
            {messages.map(msg => (
              <div key={msg.id} style={{ margin: "6px 0", color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
                <strong style={{ fontSize: 12 }}>{msg.name}:</strong>{" "}
                <span style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{msg.content}</span>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{new Date(msg.created_at).toLocaleString()}</div>
              </div>
            ))}
            {oldestAt && (
              <button onClick={loadMore} disabled={loadingMore} style={{ margin: 8 }}>
                {loadingMore ? "로딩..." : "이전 대화 더 불러오기"}
              </button>
            )}
          </div>

          <form onSubmit={handleSend} style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="이름(선택)"
              style={{ flex: "0 0 90px", padding: 6, borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.02)", color: "#fff" }}
            />
            <input
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="메시지 입력..."
              style={{ flex: 1, padding: 6, borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.02)", color: "#fff" }}
            />
            <button type="submit" style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none" }}>
              전송
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

