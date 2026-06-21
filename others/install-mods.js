import { startupFinish } from "../utils/startup-finish.js";

startupFinish(async () => {
  const mods_to_install = [
    "https://github.com/sameerasw/zen-themes/tree/main/TransparentZen",
    "https://github.com/Starry-AXQG/Context-Menu-Icons",
  ];

  if (window.SineAPI) {
    for (const mod of mods_to_install) {
      await new Promise((r) => setTimeout(r, 2000));
      SineAPI.manager.installMod(mod);
    }
  }
});
