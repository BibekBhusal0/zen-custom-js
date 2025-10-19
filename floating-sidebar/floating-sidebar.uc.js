// ==UserScript==
// @name            Floating sidebar
// @description     Make firefox sidebar floating and toggle pin unpin easily with a button
// @author          BibekBhusal
// ==/UserScript==

import { startupFinish } from "../utils/startup-finish.js";
import {parseElement,escapeXmlAttribute } from "../utils/parse.js"
import {svgToUrl, icons} from "../utils/icon.js"

function addButton() {
  const header = document.getElementById("sidebar-header");

  if (!header) return;
  const button = parseElement(`<toolbarbutton
  id="sidebar-pin-unpin"
  image ="${escapeXmlAttribute(svgToUrl(icons["pin"]))}"
/>`, 'xul')
  const pref = UC_API.Prefs.get( "extension.sidebar-float");

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
