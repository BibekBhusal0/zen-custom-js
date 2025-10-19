import { startupFinish } from "../utils/startup-finish.js";
import {parseElement,escapeXmlAttribute } from "../utils/parse.js"
import {svgToUrl, icons} from "../utils/icon.js"

function addButton() {
  const header = document.getElementById("sidebar-header");

  if (!header) return;
  const button = parseElement(`<toolbarbutton id="sidebar-pin-unpin"/>`, 'xul')
  const pref = UC_API.Prefs.get( "extension.sidebar-float");
  function updateImage () {
    const icon = pref.value ? icons["pin"] : icons["unpin"]
    button.setAttribute("image", escapeXmlAttribute(svgToUrl(icon)))
  }
  updateImage()
  pref.addListener(updateImage)

  const buttonClick = () => {
    console.log("Clicked")
    pref.setTo(!pref.value);
  }

  button.addEventListener("click", buttonClick);
  const children = header.children;
  if (children.length > 1) {
    header.insertBefore(button, children[children.length - 1]);
  } else {
    header.appendChild(button);
  }
}

startupFinish(addButton);
