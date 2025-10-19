// ==UserScript==
// @name            Floating sidebar
// @description     Make firefox sidebar floating and toggle pin unpin easily with a button
// @author          BibekBhusal
// ==/UserScript==

import { startupFinish } from "../utils/startup-finish.js";
import {parseElement} from "../utils/parse.js"
function addButton() {
  const header = document.getElementById("sidebar-header");

  if (!header) return;
  const button = parseElement('<div id="sidebar-pin-unpin"><div>')
  const config_flag = "extension.sidebar-float";
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

startupFinish(addButton);
