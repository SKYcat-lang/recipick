<script>
    import Header from '$lib/components/header.svelte';
    import Footer from '$lib/components/footer.svelte';
    import { goto } from '$app/navigation';
    import { user } from '$lib/stores.js'; // 1번에서 만든 스토어를 가져옵니다.

    function handleGoogleLogin() {
        // 2번에서 만든 가상 리디렉션 페이지로 이동합니다.
        goto('/auth/google/callback');
    }

    function handleLogout() {
        // 스토어의 사용자 정보를 null로 설정하면 stores.js의 로직에 의해 localStorage도 정리됩니다.
        user.set(null);
    }
</script>

<Header />

    <main>
        <div class="container">
            <div class="row">
                <div class="col-xl-7 py-xl-5">
                    <div class="container auto py-5 px-md-5">
                        <h5 class="text-white py-xl-4"><b>Discover Dellcious Recipes</b> - 맛있는 요리법을 발견하세요.</h5>
                        <div class="py-md-1 py-xl-5">
                            <h1 class="text-white display-4 fw-medium">레시피로 가득한</h1>
                            <h1 class="px-md-4 text-white display-4 fw-medium">맛있는 여정</h1>
                        </div>
                    </div>
                </div>
                
{#if $user}
                <div class="col-xl-5">
                <div class="modal modal-sheet position-static d-block p-4 py-md-5">
                        <div class="modal-dialog">
                            <div class="modal-content rounded-4 shadow">
                                <div class="p-5 pb-4 border-bottom-0">
                                    <div class="d-flex align-items-center">
                                        <img src={$user.picture} alt="프로필 사진" class="rounded-circle me-4" width="100" height="100">
                                        <div class="d-flex flex-column align-items-start">
                                            <h3 class="fw-bold mb-1">{$user.name}</h3>
                                            <p class="text-muted">{$user.email}</p>
                                        </div>
                                    </div>
                                    <p class="text-end">
                                        <a class=" text-muted px-1" href="manager">마이페이지</a>
                                        <a class=" text-muted px-1" href="#" on:click={handleLogout}>로그아웃</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

{:else}
                <div class="col-xl-5">
                    <div class="modal modal-sheet position-static d-block p-4 py-md-5 my-md-5" tabindex="-1" role="dialog" id="modalSignin">
                        <div class="modal-dialog">
                            <div class="modal-content rounded-4 shadow">
                                <div class="modal-header p-5 pb-4 border-bottom-0">
                                    <h1 class="fs-2"><b class="fw-bold">로그인</b> - Recipick</h1>
                                </div>
                                <div class="modal-body px-5 pt-3 pb-4">
                                    <form on:submit|preventDefault> <div class="form-floating mb-3">
                                        <button class="w-100 py-2 my-2 btn btn-outline-primary rounded-3" type="button" on:click={handleGoogleLogin}>
                                            <svg class="bi me-1" width="16" height="16" aria-hidden="true"><use xlink:href="#google"></use></svg>
                                            Sign up with Google
                                        </button>
                                        <button class="w-100 py-2 my-2 btn btn-outline-github rounded-3" type="button">
                                            <svg class="bi me-1" width="16" height="16" aria-hidden="true"><use xlink:href="#github"></use></svg>
                                            Sign up with GitHub
                                        </button>
                                        <button class="w-100 py-2 my-2 btn btn-outline-kakao rounded-3" type="button">
                                            <svg class="bi me-1" width="16" height="16" aria-hidden="true"><use xlink:href="#kakao"></use></svg>
                                            Sign up with Kakao
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
{/if}
            </div>
        </div>
    </main>

<Footer />

<style>
    /* 기존 스타일은 그대로 유지합니다. */
    main {
        background-image: url('/background.png'); /* static 폴더의 이미지는 /경로로 접근 */
        background-size: cover;
        background-position: center center;
        background-repeat: no-repeat;
        background-attachment: fixed;
        min-height: calc(100vh - 112px); /* 예시: 헤더/푸터 높이를 제외한 값 */
    }
    .logged-in-container {
        max-width: 600px;
    }
    .a-hover { color: gray; }
    .a-hover:hover { color: black; }
    .btn-primary-cust {
        --bs-btn-color: #fff;
        --bs-btn-bg: #ff7c2d;
        --bs-btn-border-color: #ff7c2d;
        --bs-btn-hover-color: #fff;
        --bs-btn-hover-bg: #e8732a;
        --bs-btn-hover-border-color: #e8732a;
        --bs-btn-focus-shadow-rgb: 49, 132, 253;
        --bs-btn-active-color: #fff;
        --bs-btn-active-bg: #d26520;
        --bs-btn-active-border-color: #d26520;
        --bs-btn-active-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);
        --bs-btn-disabled-color: #fff;
        --bs-btn-disabled-bg: #d26520;
        --bs-btn-disabled-border-color: #d26520;
    }
    .btn-outline-kakao {
        --bs-btn-color: #c9a100;
        --bs-btn-border-color: #c9a100;
        --bs-btn-hover-color: #000;
        --bs-btn-hover-bg: #FEE500;
        --bs-btn-hover-border-color: #FEE500;
        --bs-btn-focus-shadow-rgb: 254, 229, 0;
        --bs-btn-active-color: #000;
        --bs-btn-active-bg: #FEE500;
        --bs-btn-active-border-color: #FEE500;
        --bs-btn-active-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);
        --bs-btn-disabled-color: #FEE500;
        --bs-btn-disabled-bg: transparent;
        --bs-btn-disabled-border-color: #FEE500;
        --bs-gradient: none;
    }
    .btn-outline-github {
        --bs-btn-color: #8250DF;
        --bs-btn-border-color: #8250DF;
        --bs-btn-hover-color: #fff;
        --bs-btn-hover-bg: #8250DF;
        --bs-btn-hover-border-color: #8250DF;
        --bs-btn-focus-shadow-rgb: 130, 80, 223;
        --bs-btn-active-color: #fff;
        --bs-btn-active-bg: #8250DF;
        --bs-btn-active-border-color: #8250DF;
        --bs-btn-active-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);
        --bs-btn-disabled-color: #8250DF;
        --bs-btn-disabled-bg: transparent;
        --bs-btn-disabled-border-color: #8250DF;
        --bs-gradient: none;
    }
</style>