import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Chrome DevTools 가 주기적으로 조회하는 경로를 200 JSON으로 응답하여
  // 매 새로고침마다 404 에러가 찍히는 문제를 제거한다.
  if (event.url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
    return new Response("{}", {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=0, must-revalidate"
      }
    });
  }

  return resolve(event);
};