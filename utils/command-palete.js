export function addCommands(commands, retryCount = 0) {
  if (window.ZenCommandPalette) {
    window.ZenCommandPalette.addCommands(commands);
  } else {
    if (retryCount < 10) {
      setTimeout(() => addCommands(commands, retryCount + 1), 1000);
    }
  }
}

export function addDynamicCommandsProvider(func, pref, retryCount = 0) {
  if (window.ZenCommandPalette) {
    window.ZenCommandPalette.addDynamicCommandsProvider(func, pref);
  } else {
    if (retryCount < 10) {
      setTimeout(() => addDynamicCommandsProvider(func, pref, retryCount + 1), 1000);
    }
  }
}
