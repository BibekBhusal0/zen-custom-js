// ==UserScript==
// @name            Floating sidebar
// @description     Make firefox sidebar floating and toggle pin unpin easily with a button
// @author          BibekBhusal
// ==/UserScript==

const UC_API = ChromeUtils.importESModule("chrome://userchromejs/content/uc_api.sys.mjs");

function addButton() {
  const header = document.getElementById("sidebar-header");

  if (!header) return;
  const button = UC_API.Utils.createElement(document, "div", {
    id: "sidebar-pin-unpin",
  });
  const config_flag = "natsumi.sidebar.ff-sidebar-float";
  const pref = UC_API.Prefs.get(config_flag);

  const buttonClick = () => pref.setTo(!pref.value);

  button.addEventListener("click", buttonClick);
  const children = header.children;
  if (children.length > 1) {
    header.insertBefore(button, children[children.length - 1]);
  } else {
    header.appendChild(button);
  }
}
UC_API.Runtime.startupFinished().then(addButton);
