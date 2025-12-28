import { redirect } from '@sveltejs/kit';

export const load = async (event) => {
  // 1. 서버 세션 확인 (Spring의 SecurityContextHolder와 유사)
  const session = await event.locals.auth();
  const path = event.url.pathname;

  // 2. 화이트리스트 설정 (로그인 없이 접근 가능한 경로)
  const publicPaths = [
    '/',             // 메인 페이지
    '/auth',         // 로그인 처리 경로
    '/.well-known',  // 인증 관련
    '/api'           // API 경로
  ];

  // 정적 파일(.png 등)이나 화이트리스트 경로는 통과
  const isPublic = 
    path.includes('.') || 
    publicPaths.some(p => path === p || path.startsWith(p + '/'));

  // 3. 비로그인 상태로 보호된 경로 접근 시 서버에서 즉시 차단 및 리다이렉트
  if (!session && !isPublic) {
    // 브라우저에게 303 See Other 응답을 보내 강제로 이동시킵니다.
    throw redirect(303, '/');
  }

  return {
    session
  };
}
