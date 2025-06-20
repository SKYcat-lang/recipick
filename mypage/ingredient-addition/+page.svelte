<script lang="ts">
import Header from '$lib/components/header.svelte';
  // 식자재 목록 예시
  let ingredients = [
    { name: '또띠아(10개입)', count: 2 },
    { name: '찌개용 돼지고기 (500g)', count: 1 },
    { name: '스파게티 면', count: 1 },
    { name: '양파', count: 4 },
    { name: '닭고기 (600g)', count: 1 },
    { name: '대파', count: 2 },
    { name: '고추', count: 5 },
    { name: '당근', count: 4 },
    { name: '감자', count: 2 },
    { name: '된장', count: 1 },
    { name: '두부', count: 2 },
    { name: '애호박', count: 3 },
  ];

  function increment(idx: number) {
    ingredients[idx].count++;
  }
  function decrement(idx: number) {
    if (ingredients[idx].count > 0) ingredients[idx].count--;
  }

  // 레시피 추천 예시
  let recipeResults = [
    {
      name: '닭볶음탕',
      match: '식자재 8개 일치',
      color: '#ffb6c1',
      link: '#',
    },
    {
      name: '된장찌개',
      match: '식자재 5개 일치',
      color: '#d2b48c',
      link: '#',
    },
  ];
</script>

<Header />

<h2 style="text-align:center;margin-bottom:24px;">식자재 추가 페이지</h2>
<div class="container">
  <div class="left">
    <div class="title">식자재</div>
    <div class="ingredient-grid">
      {#each ingredients as ing, idx}
        <div class="ingredient-card">
          <div class="ingredient-img"><!-- 이미지 자리 --></div>
          <div class="ingredient-name">{ing.name}</div>
          <div class="counter">
            <button class="counter-btn" on:click={() => decrement(idx)}>-</button>
            <span>{ing.count}</span>
            <button class="counter-btn" on:click={() => increment(idx)}>+</button>
          </div>
        </div>
      {/each}
    </div>
  </div>
  <div class="right">
    <div class="recommend-header">
      <span class="recommend-title">재료&레시피 추천</span>
      <select class="gpt-select">
        <option>GPT-4</option>
      </select>
    </div>
    <div class="ai-box">
      <div style="font-size:1.1rem;font-weight:bold;margin-bottom:12px;">메뉴 & 레시피<br/>추천 받기</div>
      <div style="display:flex;gap:16px;justify-content:center;margin-bottom:12px;">
        <div style="width:48px;height:48px;background:#eee;border-radius:12px;"></div>
        <div style="width:48px;height:48px;background:#eee;border-radius:12px;"></div>
      </div>
      <button class="ai-btn">AI 메뉴 추천 - 일치 재료 기반</button>
    </div>
    <div class="recipe-list">
      {#each recipeResults as recipe}
        <div class="recipe-item" style={`--color: ${recipe.color}`}> 
          <span>{recipe.name} - {recipe.match}</span>
          <a class="recipe-link" href={recipe.link}>레시피 확인 하러 가기</a>
        </div>
      {/each}
    </div>
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
  .container {
    display: flex;
    flex-direction: row;
    background: rgba(255,255,255,0.85);
    border-radius: 32px;
    padding: 32px;
    margin: 32px auto;
    max-width: 1200px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  }
  .left, .right {
    flex: 1;
    padding: 24px;
  }
  .left {
    border-right: 2px solid #eee;
  }
  .title {
    font-size: 1.6rem;
    font-weight: bold;
    margin-bottom: 16px;
    text-align: center;
  }
  .ingredient-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  .ingredient-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #fafafa;
    border-radius: 16px;
    padding: 16px;
    min-height: 120px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  }
  .ingredient-img {
    width: 64px;
    height: 64px;
    background: #e0e0e0;
    border-radius: 8px;
    margin-bottom: 8px;
  }
  .ingredient-name {
    font-size: 1rem;
    margin-bottom: 8px;
    text-align: center;
  }
  .counter {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .counter-btn {
    background: #eee;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    font-size: 1.2rem;
    cursor: pointer;
    transition: background 0.2s;
  }
  .counter-btn:hover {
    background: #ccc;
  }
  .right {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .recommend-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    width: 100%;
    justify-content: space-between;
  }
  .recommend-title {
    font-size: 1.2rem;
    font-weight: bold;
  }
  .gpt-select {
    background: #eee;
    border: none;
    border-radius: 8px;
    padding: 4px 12px;
    font-size: 1rem;
  }
  .ai-box {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    padding: 24px;
    margin-bottom: 24px;
    width: 100%;
    text-align: center;
  }
  .ai-btn {
    background: #f5f5f5;
    border: none;
    border-radius: 8px;
    padding: 12px 24px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    margin-bottom: 16px;
  }
  .ai-btn:hover {
    background: #e0e0e0;
  }
  .recipe-list {
    width: 100%;
    margin-top: 16px;
  }
  .recipe-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--color, #eee);
    border-radius: 12px;
    padding: 16px 24px;
    margin-bottom: 16px;
    font-size: 1.1rem;
  }
  .recipe-link {
    background: rgba(255,255,255,0.7);
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    color: #333;
    font-weight: bold;
    text-decoration: none;
    transition: background 0.2s;
  }
  .recipe-link:hover {
    background: #fff;
  }
</style> 