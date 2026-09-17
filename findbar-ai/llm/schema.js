const OPTIONAL = "optional";

function field(schema, description, optional) {
  const out = { ...schema };
  if (description) out.description = description;
  if (optional) out[OPTIONAL] = true;
  return out;
}

export function str(description, optional = false) {
  return field({ type: "string" }, description, optional);
}

export function num(description, optional = false) {
  return field({ type: "number" }, description, optional);
}

export function strArr(description, optional = false) {
  return field({ type: "array", items: { type: "string" } }, description, optional);
}

export function obj(properties) {
  const required = [];
  const clean = {};
  for (const key of Object.keys(properties)) {
    const { [OPTIONAL]: isOptional, ...schema } = properties[key];
    clean[key] = schema;
    if (!isOptional) required.push(key);
  }
  const out = { type: "object", properties: clean };
  if (required.length) out.required = required;
  return out;
}

// Parameter names of a tool, for the tool list in the system prompt.
export function paramNames(parameters) {
  return Object.keys(parameters?.properties || {});
}
