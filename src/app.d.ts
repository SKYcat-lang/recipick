// src/app.d.ts
import type { DefaultSession } from "@auth/sveltekit";

declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

// Auth.js 세션 타입 확장
declare module "@auth/sveltekit" {
  interface Session {
    user: {
      id: string;
      // dbId?: number; // 나중에 DB ID 추가 시 사용
    } & DefaultSession["user"];
  }
}

export {};
