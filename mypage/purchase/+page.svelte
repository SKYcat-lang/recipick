<script lang="ts">
import Header from '$lib/components/header.svelte';
let items = [
  { name: '당근', price: 3410 },
  { name: '양파', price: 1290 },
  { name: '닭고기', price: 7860 },
  { name: '감자', price: 4410 },
  { name: '대파', price: 5560 },
  { name: '고추', price: 1230 },
];
</script>

<Header />

<div class="purchase-container">
  <h2 style="text-align:center;margin-bottom:24px;">식자재 구매</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px;max-width:900px;margin:0 auto;">
    {#each items as item}
      <div style="background:#fff;border-radius:16px;padding:24px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <div style="width:100px;height:100px;background:#eee;border-radius:12px;margin:0 auto 12px auto;"></div>
        <div style="font-size:1.1rem;font-weight:bold;">{item.name}</div>
        <div style="color:#888;margin-bottom:12px;">최저가: {item.price}원</div>
        <button style="padding:8px 24px;border-radius:8px;background:#222;color:#fff;">구매</button>
      </div>
    {/each}
  </div>
</div>

<style>
  body, :global(body) {
    background-image: url('/background.png');
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    background-attachment: fixed;
    min-height: 100vh;
  }
  .purchase-container {
    background: rgba(255,255,255,0.85);
    border-radius: 32px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    padding: 32px;
    max-width: 1200px;
    margin: 32px auto;
  }
</style> 