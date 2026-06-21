import { startupFinish } from "../utils/startup-finish.js";

startupFinish(() => {
  const mods_to_install = [
    "https://github.com/sameerasw/zen-themes/tree/main/TransparentZen",
    "https://github.com/Starry-AXQG/Context-Menu-Icons",
  ];

  if (!window.SineAPI) {
    for (const mod of mods_to_install) {
      SineAPI.manager.installMod(mod.homepage);
    }
  }
});
