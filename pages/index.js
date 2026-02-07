import Head from "next/head";
import ChatWidget from "../components/ChatWidget";

export default function Home() {
  return (
    <div>
      <Head>
        <title>투명 채팅 위젯</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>{`body { margin:0; font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto; background: url('/your-screenshot.png') no-repeat center/cover; }`}</style>
      </Head>
      <main>
        {/* 페이지 원래 내용. 예: 스크린샷 위에 띄우려면 백그라운드에 스크린샷을 놓거나, 실제 서비스 페이지 위에 아래 스크립트를 포함 */}
        <div style={{padding:24}}>
          <h1 style={{color:"#fff"}}>페이지 본문 (예시)</h1>
        </div>
      </main>

      <ChatWidget />
    </div>
  );
}

