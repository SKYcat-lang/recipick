// src/hooks.server.ts
import { SvelteKitAuth } from "@auth/sveltekit";
import Google from "@auth/sveltekit/providers/google";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  AUTH_SECRET,
} from "$env/static/private";
import { sequence } from "@sveltejs/kit/hooks";
import type { Handle } from "@sveltejs/kit";

// 1. 기존 Chrome DevTools 대응 핸들
const customHandle: Handle = async ({ event, resolve }) => {
  if (
    event.url.pathname === "/.well-known/appspecific/com.chrome.devtools.json"
  ) {
    return new Response("{}", {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=0, must-revalidate",
      },
    });
  }

  return resolve(event);
};

// 2. Auth.js 인증 로직 (DB 연동 준비 추가)
const { handle: authHandle } = SvelteKitAuth({
  providers: [
    Google({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  secret: AUTH_SECRET,
  trustHost: true,

  // ▼▼▼ DB 연동을 위한 핵심 추가 부분 ▼▼▼
  callbacks: {
    // 1) 로그인 시 실행: 여기서 DB에 유저가 있는지 확인하고 없으면 저장합니다.
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      console.log(`[Auth] User signing in: ${user.email}`);

      // [TODO: 나중에 DB 연결 시 주석 해제 및 구현]
      // const dbUser = await db.user.findUnique({ where: { email: user.email } });
      // if (!dbUser) {
      //   await db.user.create({ data: { email: user.email, name: user.name, image: user.image } });
      // }

      return true; // true를 반환해야 로그인이 진행됩니다.
    },

    // 2) JWT 토큰 생성 시 실행: DB의 유저 ID 등을 토큰에 담습니다.
    async jwt({ token, user, account }) {
      if (user) {
        // 로그인 직후에만 user 객체가 존재합니다.
        token.id = user.id;
        // token.dbId = dbUser.id; // 나중에 DB ID도 여기에 넣습니다.
      }
      return token;
    },

    // 3) 클라이언트 세션 조회 시 실행: 토큰의 정보를 세션 객체로 옮깁니다.
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        // session.user.dbId = token.dbId;
      }
      return session;
    },
  },
});

export const handle = sequence(customHandle, authHandle);
