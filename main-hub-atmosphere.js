(() => {
  if (document.getElementById("mainHubAtmosphere")) return;

  const layer = document.createElement("div");
  layer.id = "mainHubAtmosphere";
  layer.setAttribute("aria-hidden", "true");

  const embers = Array.from({ length: 34 }, (_, index) => {
    const left = (index * 29 + 7) % 100;
    const duration = 22 + (index % 9) * 4;
    const delay = -((index * 11) % duration);
    const drift = `${((index % 7) - 3) * 24}px`;
    const size = `${3 + (index % 4)}px`;

    return `<i class="main-hub-ember" style="
      --left:${left}%;
      --duration:${duration}s;
      --delay:${delay}s;
      --drift:${drift};
      --size:${size};
    "></i>`;
  }).join("");

  layer.innerHTML = `
    <div class="main-hub-fog"></div>
    <div class="main-hub-fog fog-two"></div>
    <div class="main-hub-embers">${embers}</div>
  `;

  document.body.prepend(layer);
})();
