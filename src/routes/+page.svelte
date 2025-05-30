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
    color: gray; /* 부트스트랩의 large shadow 변수 사용 */
  }

  .a-hover:hover {
    color: black; /* 부트스트랩의 large shadow 변수 사용 */
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
                            <button class="w-100 mb-2 btn btn-lg rounded-3 btn-primary" type="submit">Sign up</button>
                            <small class="text-body-secondary">By clicking Sign up, you agree to the terms of use.</small>
                            <div class="py-2 mb-3 form-check d-flex">
                                <input type="checkbox" class="form-check-input" id="floatingCheck">
                                <label class="form-check-label px-2" for="floatingCheck">로그인 정보 저장</label>
                                <a class="ms-auto text-decoration-none px-2 a-hover" href="#">회원가입</a>
                            </div>
                            <hr class="my-4">
                            <h2 class="fs-5 fw-bold mb-3">다른 방식으로 로그인</h2>
                            <button class="w-100 py-2 mb-2 btn btn-outline-secondary rounded-3" type="submit">
                                <svg class="bi me-1" width="16" height="16" aria-hidden="true"><use xlink:href="#google"></use></svg>Sign up with Google</button>
                            <button class="w-100 py-2 mb-2 btn btn-outline-primary rounded-3" type="submit">
                                <svg class="bi me-1" width="16" height="16" aria-hidden="true"><use xlink:href="#facebook"></use></svg>Sign up with Facebook</button>
                            <button class="w-100 py-2 mb-2 btn btn-outline-secondary rounded-3" type="submit">
                                <svg class="bi me-1" width="16" height="16" aria-hidden="true"><use xlink:href="#github"></use></svg>Sign up with GitHub</button>
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
