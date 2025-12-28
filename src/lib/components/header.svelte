<script>
  import "bootstrap/dist/css/bootstrap.min.css";
  // ▼ 추가된 부분
  import { page } from "$app/stores";
  import { signIn, signOut } from "@auth/sveltekit/client";
</script>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet">

<header class="py-3 border-bottom">
  <div class="container d-flex flex-column flex-md-row align-items-center">
    <a href="/" class="d-flex align-items-center text-dark text-decoration-none">
      <span class="fs-3 text-decoration-underline" style="font-family: 'Playfair Display';">Recipick</span>
    </a>

    <nav class="d-inline-flex mt-2 mt-md-0 ms-md-auto align-items-center">
      
      <!-- ▼ 로그인 상태에 따른 버튼 표시 -->
      {#if $page.data.session}
        <a class="me-3 py-2 text-dark text-decoration-none" href="storage">냉장고</a>
        <a class="me-3 py-2 text-dark text-decoration-none" href="#">커뮤니티</a>
        <a class="me-3 py-2 text-dark text-decoration-none" href="#">공지사항</a>
        <!-- 로그인 상태 -->
        <div class="dropdown ms-2">
          <button 
            class="btn d-flex align-items-center border-0 p-0 dropdown-toggle hide-arrow" 
            type="button" 
            data-bs-toggle="dropdown" 
            aria-expanded="false"
          >
            {#if $page.data.session.user?.image}
              <img 
                src={$page.data.session.user.image} 
                alt="Profile" 
                class="rounded-circle me-2" 
                width="32" 
                height="32"
              >
            {/if}
            <span class="me-1 fw-bold text-dark">{$page.data.session.user?.name}</span>
          </button>

          <ul class="dropdown-menu dropdown-menu-end shadow">
            <li>
              <a class="dropdown-item" href="/profile">
                <i class="bi bi-person me-2"></i>마이페이지
              </a>
            </li>
            <li><hr class="dropdown-divider"></li>
            <li>
              <button class="dropdown-item text-danger" on:click={() => signOut()}>
                <i class="bi bi-box-arrow-right me-2"></i>로그아웃
              </button>
            </li>
          </ul>
        </div>
      {/if}
    </nav>
  </div>
</header>
