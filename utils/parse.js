export const parseElement = (elementString, type = "html") => {
  if (type === "xul") {
    return window.MozXULElement.parseXULToFragment(elementString).firstChild;
  }

  let element = new DOMParser().parseFromString(elementString, "text/html");
  if (element.body.children.length) element = element.body.firstChild;
  else element = element.head.firstChild;
  return element;
};

export const escapeXmlAttribute = (str) => {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

export const xulImage = (src = "", className = "") => {
  const el = parseElement(
    `<image${
      className ? ` class="${escapeXmlAttribute(className)}"` : ""
    }${src ? ` src="${escapeXmlAttribute(src)}"` : ""}/>`,
    "xul"
  );
  return el;
};
