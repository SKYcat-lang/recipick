import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  // Chrome DevTools 가 주기적으로 조회하는 엔드포인트를 200 JSON으로 응답해
  // 매 새로고침마다 404가 발생하는 문제를 제거한다.
  return new Response("{}", {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate"
    }
  });
};