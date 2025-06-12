<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation'; // SvelteKit의 네비게이션 함수
  import { writable } from 'svelte/store'; // Svelte 스토어 사용 예시

  // 사용자 정보를 저장할 스토어 (애플리케이션 전역에서 사용 가능하도록 stores.js 등으로 분리 가능)
  export const user = writable(null);

  // 가상 사용자 정보
  const virtualUserId = 'ex@gmail.com';
  const virtualUserName = 'Svelte 예시 사용자';
  const virtualUserProfilePic = 'https://via.placeholder.com/150/007bff/FFFFFF?text=User'; // 가상 프로필 사진

  let isLoading = true;
  let loginMessage = 'Google 로그인 처리 중... 잠시만 기다려주세요.';

  onMount(() => {
    // 실제 리디렉션 시에는 URL에서 code나 token을 파싱하겠지만, 여기서는 생략합니다.
    // console.log('가상 리디렉션 페이지에 도달했습니다.');

    // 1. 가상 로그인 지연 (실제 네트워크 요청 흉내)
    setTimeout(() => {
      // 2. 가상 사용자 정보로 "로그인" 처리
      const mockUserData = {
        id: virtualUserId,
        email: virtualUserId,
        name: virtualUserName,
        picture: virtualUserProfilePic,
        // 실제 구글 응답이라면 더 많은 정보가 있을 수 있습니다.
        // (예: given_name, family_name, locale 등)
      };

      // Svelte 스토어에 사용자 정보 저장
      user.set(mockUserData);

      // (선택 사항) localStorage에도 저장하여 브라우저 새로고침 시 유지
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('loggedInUser', JSON.stringify(mockUserData));
      }

      loginMessage = `${mockUserData.name}님, 환영합니다! 로그인이 완료되었습니다.`;
      isLoading = false;

      // 3. 로그인 후 메인 페이지 등으로 자동 리디렉션 (2초 후)
      setTimeout(() => {
        goto('/'); // SvelteKit의 goto 함수로 메인 페이지('/')로 이동
      }, 2000);

    }, 1500); // 1.5초 지연
  });
</script>

<div class="container">
  {#if isLoading}
    <div class="loader"></div>
    <p>{loginMessage}</p>
  {:else}
    <h1>🎉 로그인 성공!</h1>
    <p>{loginMessage}</p>
    <div class="user-info">
      {#if $user}
        <img src={$user.picture} alt="{$user.name} 프로필 사진" class="profile-pic" />
        <p><strong>ID:</strong> {$user.id}</p>
        <p><strong>이름:</strong> {$user.name}</p>
        <p><strong>이메일:</strong> {$user.email}</p>
      {/if}
    </div>
    <p>잠시 후 메인 페이지로 이동합니다...</p>
  {/if}
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    text-align: center;
    font-family: Arial, sans-serif;
  }

  .loader {
    border: 8px solid #f3f3f3; /* Light grey */
    border-top: 8px solid #3498db; /* Blue */
    border-radius: 50%;
    width: 60px;
    height: 60px;
    animation: spin 2s linear infinite;
    margin-bottom: 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  h1 {
    color: #333;
  }

  p {
    color: #555;
    font-size: 1.1em;
  }

  .user-info {
    margin-top: 20px;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f9f9f9;
  }

  .profile-pic {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin-bottom: 10px;
    border: 2px solid #ddd;
  }
</style>