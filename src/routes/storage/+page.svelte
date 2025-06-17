<script>
    import Header from '$lib/components/header.svelte';
    import Footer from '$lib/components/footer.svelte';
    import { goto } from '$app/navigation';
    import { user } from '$lib/stores.js'; // 1번에서 만든 스토어를 가져옵니다.

    function handleLogout() {
        // 스토어의 사용자 정보를 null로 설정하면 stores.js의 로직에 의해 localStorage도 정리됩니다.
        user.set(null);
    }
</script>

<Header />

    <main>
        <div class="container">
            <div class="row">
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