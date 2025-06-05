<script>
    import Header from '$lib/components/header.svelte'; // 경로를 확인하세요. '$lib'는 src/lib를 가리킵니다.
    import Footer from '$lib/components/footer.svelte';
</script>
<Header />
<style>
    main {
        background-image: url('/background.png'); /* static 폴더의 이미지는 /경로로 접근 */
        background-size: cover; /* 화면 전체를 덮도록 설정 */
        background-position: center center; /* 이미지를 중앙에 위치 */
        background-repeat: no-repeat; /* 이미지 반복 없음 */
        background-attachment: fixed; /* 스크롤 시 배경 이미지가 고정됨 (선택 사항) */
    }
  /* 부트스트랩 shadow-sm 클래스에 hover 효과를 추가하는 CSS */

    .a-hover {
        color: gray;
    }

    .a-hover:hover {
        color: black;
    }

    .btn-primary-cust {
        --bs-btn-color: #fff;
        --bs-btn-bg: #ffb3d7;
        --bs-btn-border-color: #ffb3d7;
        --bs-btn-hover-color: #fff;
        --bs-btn-hover-bg: #ff91c5;
        --bs-btn-hover-border-color: #ff91c5;
        --bs-btn-focus-shadow-rgb: 49, 132, 253;
        --bs-btn-active-color: #fff;
        --bs-btn-active-bg: #f669ab;
        --bs-btn-active-border-color: #f669ab;
        --bs-btn-active-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);
        --bs-btn-disabled-color: #fff;
        --bs-btn-disabled-bg: #f669ab;
        --bs-btn-disabled-border-color: #f669ab;
    }
    /* 1. 카카오(Kakao) 노란색 버튼 */
    .btn-outline-kakao {
        --bs-btn-color: #c9a100;
        --bs-btn-border-color: #c9a100;
        --bs-btn-hover-color: #000; /* 밝은 배경이라 글자색은 검은색으로 변경 */
        --bs-btn-hover-bg: #FEE500;
        --bs-btn-hover-border-color: #FEE500;
        --bs-btn-focus-shadow-rgb: 254, 229, 0;
        --bs-btn-active-color: #000; /* 밝은 배경이라 글자색은 검은색으로 변경 */
        --bs-btn-active-bg: #FEE500;
        --bs-btn-active-border-color: #FEE500;
        --bs-btn-active-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);
        --bs-btn-disabled-color: #FEE500;
        --bs-btn-disabled-bg: transparent;
        --bs-btn-disabled-border-color: #FEE500;
        --bs-gradient: none;
    }

    /* 2. 깃허브(GitHub) 보라색 버튼 */
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
<main>
    <div class="container">
        <div class="row">
            <div class="col-xl-7 py-xl-5">
                <div class="container auto py-5 px-md-5">
                    <div class="text-white py-xl-4"><b>Discover Dellcious Recipes</b> - 맛있는 요리법을 발견하세요.</div>
                    <div class="py-md-1 py-xl-5">
                        <h1 class="text-white display-4 fw-medium">레시피로 가득한</h1>
                        <h1 class="px-md-4 text-white display-4 fw-medium">맛있는 여정</h1>
                    </div>
                </div>
            </div>
            <div class="col-xl-5">
                <div class="modal modal-sheet position-static d-block p-4 py-md-5" tabindex="-1" role="dialog" id="modalSignin">
                    <div class="modal-dialog">
                        <div class="modal-content rounded-4 shadow">
                        <div class="modal-header p-5 pb-4 border-bottom-0">
                            <h1 class="fw-bold mb-0 fs-2">로그인</h1>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-5 pt-0">
                            <form class="">
                            <div class="form-floating mb-3">
                                <input type="email" class="form-control rounded-3" id="floatingInput" placeholder="name@example.com">
                                <label for="floatingInput">Email address</label>
                            </div>
                            <div class="form-floating mb-3">
                                <input type="password" class="form-control rounded-3" id="floatingPassword" placeholder="Password">
                                <label for="floatingPassword">Password</label>
                            </div>
                            <button class="w-100 mb-2 btn btn-lg rounded-3 btn-primary-cust" type="submit">Sign up</button>
                            <small class="text-body-secondary">By clicking Sign up, you agree to the terms of use.</small>
                            <div class="py-2 mb-3 form-check d-flex">
                                <input type="checkbox" class="form-check-input" id="floatingCheck">
                                <label class="form-check-label px-2" for="floatingCheck">로그인 정보 저장</label>
                                <a class="ms-auto text-decoration-none px-2 a-hover" href="#">회원가입</a>
                            </div>
                            <hr class="my-4">
                            <h2 class="fs-5 fw-bold mb-3">다른 방식으로 로그인</h2>
                            <button class="w-100 py-2 mb-2 btn btn-outline-primary rounded-3" type="submit">
                                <svg class="bi me-1" width="16" height="16" aria-hidden="true"><use xlink:href="#google"></use></svg>Sign up with Google</button>
                            <button class="w-100 py-2 mb-2 btn btn-outline-github rounded-3" type="submit">
                                <svg class="bi me-1" width="16" height="16" aria-hidden="true"><use xlink:href="#github"></use></svg>Sign up with GitHub</button>
                            <button class="w-100 py-2 mb-2 btn btn-outline-kakao rounded-3" type="submit">
                                <svg class="bi me-1" width="16" height="16" aria-hidden="true"><use xlink:href="#kakao"></use></svg>Sign up with Kakao</button>
                            </form>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>
<Footer />
