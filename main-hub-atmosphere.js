(() => {
  if (document.getElementById("mainHubAtmosphere")) return;

  const layer = document.createElement("div");
  layer.id = "mainHubAtmosphere";
  layer.setAttribute("aria-hidden", "true");

  const embers = Array.from({ length: 18 }, (_, index) => {
    const left = (index * 29 + 7) % 100;
    const duration = 22 + (index % 9) * 4;
    const delay = -((index * 11) % duration);
    const drift = `${((index % 7) - 3) * 24}px`;
    const size=`${1 + (index % 3)}px`;
    const alpha=(0.45+((index*17)%50)/100).toFixed(2);

    return `<i class="main-hub-ember" style="
      --left:${left}%;
      --duration:${duration}s;
      --delay:${delay}s;
      --drift:${drift};
      --size:${size};
      --alpha:${alpha};
    "></i>`;
  }).join("");

  layer.innerHTML = `
    <div class="main-hub-fog"></div>
    <div class="main-hub-fog fog-two"></div>
    <div class="main-hub-embers">${embers}</div>
  `;

  document.body.prepend(layer);
})();
