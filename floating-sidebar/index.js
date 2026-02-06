import { startupFinish } from "../utils/startup-finish.js";
import { parseElement, escapeXmlAttribute } from "../utils/parse.js";
import { svgToUrl } from "../utils/icon.js";
import { addPrefListener, getPref, setPref } from "../utils/pref.js";

const icons = {
  pin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="context-fill light-dark(black, white)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4a1 1 0 0 1 1 1z"/></svg>`,
  unpin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="context-fill light-dark(black, white)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 17v5m3-12.66V7a1 1 0 0 1 1-1a2 2 0 0 0 0-4H7.89M2 2l20 20M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11"/></svg>`,
};
function addButton() {
  if (document.getElementById("sidebar-pin-unpin")) return;

  const header = document.getElementById("sidebar-header");

  if (!header) return;
  const button = parseElement(`<toolbarbutton id="sidebar-pin-unpin"/>`, "xul");
  const PREF_KEY = "extension.sidebar-float";
  const floating = () => getPref(PREF_KEY, false);
  function updateImage() {
    const icon = floating() ? icons["pin"] : icons["unpin"];
    button.setAttribute("image", escapeXmlAttribute(svgToUrl(icon)));
  }
  updateImage();
  addPrefListener(PREF_KEY, updateImage);

  const buttonClick = () => setPref(PREF_KEY, !floating());

  button.addEventListener("click", buttonClick);
  const children = header.children;
  if (children.length > 1) {
    header.insertBefore(button, children[children.length - 1]);
  } else {
    header.appendChild(button);
  }
}

startupFinish(addButton);
