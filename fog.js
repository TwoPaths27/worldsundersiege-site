(() => {
  if (document.getElementById("wus-fog-layer")) return;

  const fog = document.createElement("div");
  fog.id = "wus-fog-layer";
  fog.setAttribute("aria-hidden", "true");

  const embers = Array.from({ length: 24 }, (_, index) => {
    const left = (index * 37 + 11) % 100;
    const duration = 24 + (index % 8) * 4;
    const delay = -((index * 7) % duration);
    const drift = `${((index % 5) - 2) * 28}px`;
    const size = `${2 + (index % 3)}px`;

    return `<i class="wus-ember" style="
      --ember-left:${left}%;
      --ember-duration:${duration}s;
      --ember-delay:${delay}s;
      --ember-drift:${drift};
      --ember-size:${size};
    "></i>`;
  }).join("");

  fog.innerHTML = `
    <div class="wus-fog wus-fog-one"></div>
    <div class="wus-fog wus-fog-two"></div>
    <div class="wus-fog wus-fog-three"></div>
    <div class="wus-embers">${embers}</div>
  `;

  document.body.prepend(fog);
})();
