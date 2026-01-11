import { startupFinish } from "../utils/startup-finish.js";
import { parseElement, escapeXmlAttribute } from "../utils/parse.js";
import { svgToUrl, icons } from "../utils/icon.js";
import { addPrefListener, getPref, setPref } from "../utils/pref.js";

function addButton() {
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
