<script lang="ts">
import Header from '$lib/components/header.svelte';
import Footer from '$lib/components/footer.svelte';
import { Goods } from '$lib/Goods'
let items = [
  new Goods('당근', 3410),
  new Goods('양파', 1290),
  new Goods('닭고기', 7860),
  new Goods('감자', 4410),
  new Goods('대파', 5560),
  new Goods('고추', 1230),
];

</script>

<Header />

<main class="p-5">
  <div class="purchase-container container-lg bg-white bg-opacity-75 rounded-4 p-5 shadow-lg">
    <h2 class="text-center pb-5">식자재 구매</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px;max-width:900px;margin:0 auto;">
      {#each items as item}
        <div class="bg-white rounded-5 p-4 text-center shadow">
          <div style="width:100px;height:100px;background:#eee;border-radius:12px;margin:0 auto 12px auto;"></div>
          <div style="font-size:1.1rem;font-weight:bold;">{item.name}</div>
          <div style="color:#888;margin-bottom:12px;">최저가: {item.price}원</div>
          <button style="padding:8px 24px;border-radius:8px;background:#222;color:#fff;">구매</button>
        </div>
      {/each}
    </div>
  </div>
</main>

<Footer />


<style>
  main {
    background-image: url('/background.png');
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    background-attachment: fixed;
    min-height: 100vh;
  }
</style> 