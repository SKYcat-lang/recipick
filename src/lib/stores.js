import { writable } from 'svelte/store';

/**
 * 사용자 정보를 저장하는 스토어.
 * 초기값은 null이며, 로그인 시 사용자 객체로 업데이트됩니다.
 * 브라우저 환경에서만 localStorage를 확인하여 로그인 상태를 복원합니다.
 */
const initialUser = null;
export const user = writable(initialUser);

if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
        user.set(JSON.parse(storedUser));
    }
}

// 스토어 값이 변경될 때마다 localStorage를 업데이트합니다.
user.subscribe(value => {
    if (typeof window !== 'undefined') {
        if (value) {
            localStorage.setItem('loggedInUser', JSON.stringify(value));
        } else {
            localStorage.removeItem('loggedInUser');
        }
    }
});