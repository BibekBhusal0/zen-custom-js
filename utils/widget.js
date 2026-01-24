const lazy = {};

function defineModuleGettersWithFallback(target, modules) {
  for (let [key, spec] of Object.entries(modules)) {
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: true,
      get: function () {
        try {
          let module = ChromeUtils.importESModule(spec.url);
          delete target[key];
          target[key] = module[key];
          return module[key];
        } catch {
          let module = ChromeUtils.importESModule(spec.fallback);
          delete target[key];
          target[key] = module[key];
          return module[key];
        }
      },
    });
  }
}

defineModuleGettersWithFallback(lazy, {
  CustomizableUI: {
    url: "moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs",
    fallback: "resource:///modules/CustomizableUI.sys.mjs",
  },
});

export function addWidget(options) {
  try {
    lazy.CustomizableUI.createWidget({
      id: options.id,
      defaultArea: options.defaultArea || lazy.CustomizableUI.AREA_NAVBAR,
      removable: true,
      label: options.label,
      tooltiptext: options.tooltiptext || options.label,
      onCreated: function (node) {
        if (options.icon) {
          node.style.listStyleImage = `url("${options.icon}")`;
        }
        if (options.class) {
          node.classList.add(...options.class.split(" "));
        }
        if (options.onClick) {
          node.addEventListener("command", (e) => {
            options.onClick(e);
          });
        }
        if (options.onCreated) {
          options.onCreated(node);
        }
      },
    });
  } catch {
    //ignore
  }
}
