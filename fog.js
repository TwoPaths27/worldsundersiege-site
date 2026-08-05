(() => {
  if (document.getElementById("wus-fog-layer")) return;

  const fog = document.createElement("div");
  fog.id = "wus-fog-layer";
  fog.setAttribute("aria-hidden", "true");
  fog.innerHTML = `
    <div class="wus-fog wus-fog-one"></div>
    <div class="wus-fog wus-fog-two"></div>
    <div class="wus-fog wus-fog-three"></div>
  `;

  document.body.prepend(fog);
})();
