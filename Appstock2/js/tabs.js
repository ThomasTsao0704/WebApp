export function switchTab(index) {
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === index));
  for (let i = 0; i <= 8; i++) {
    const panel = document.getElementById('tab' + i);
    if (panel) panel.classList.toggle('active', i === index);
  }
}
export function bindTabButtons() {
  const btns = document.querySelectorAll('.tab');
  btns.forEach((btn, i) => btn.addEventListener('click', () => switchTab(i)));
}
