<script lang="ts">
import Header from '$lib/components/header.svelte';
// 더미 데이터
let stats = [
  { label: '추가한 식자재 수', value: 49, icon: '🛒' },
  { label: '구매한 식자재 수', value: 26, icon: '✔️' },
  { label: '사용한 식자재 수', value: 11, icon: '🍴' },
  { label: '폐기한 식자재 수', value: 2, icon: '🗑️' },
  { label: '남은 식자재 수', value: 36, icon: '📦' },
];
let period = '7일';
let startDate = '2025-01-01';
let endDate = '2025-01-08';

function gotoAddition() {
  window.location.href = '/mypage/ingredient-addition';
}
function gotoPurchase() {
  window.location.href = '/mypage/purchase';
}
</script>

<Header />

<style>
  body, :global(body) {
    background-image: url('/background.png');
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    background-attachment: fixed;
    min-height: 100vh;
  }
</style>

<h1 style="text-align:center;margin-bottom:12px;">마이페이지</h1>
<h2 style="text-align:center;margin-bottom:24px;">관리 페이지</h2>
<div style="display:flex;justify-content:center;gap:16px;margin-bottom:16px;">
  <input type="date" bind:value={startDate} /> ~
  <input type="date" bind:value={endDate} />
  <select bind:value={period}>
    <option>7일</option>
    <option>당일</option>
    <option>30일</option>
  </select>
  <button>조회</button>
</div>
<div style="display:flex;justify-content:center;gap:24px;margin-bottom:32px;">
  {#each stats as s}
    <div style="background:#fff;border-radius:16px;padding:24px 32px;box-shadow:0 2px 8px rgba(0,0,0,0.06);text-align:center;min-width:120px;">
      <div style="font-size:2rem;">{s.icon}</div>
      <div style="font-size:1.1rem;font-weight:bold;">{s.label}</div>
      <div style="font-size:1.5rem;">{s.value}</div>
    </div>
  {/each}
</div>
<div style="text-align:center;margin-bottom:16px;">가장 많이 찾은 식자재 : 토마토, 파스타 면</div>
<div style="background:#fff;border-radius:16px;padding:24px;margin:0 auto 32px auto;max-width:700px;">
  <div style="height:220px;display:flex;align-items:center;justify-content:center;color:#aaa;">[그래프 자리 - 차트 라이브러리 연동 가능]</div>
</div>
<div style="text-align:center;margin-bottom:32px;display:flex;justify-content:center;gap:24px;">
  <button style="padding:12px 32px;border-radius:8px;background:#222;color:#fff;font-size:1.1rem;" on:click={gotoAddition}>식자재 추가</button>
  <button style="padding:12px 32px;border-radius:8px;background:#222;color:#fff;font-size:1.1rem;" on:click={gotoPurchase}>식자재 구매</button>
</div> 